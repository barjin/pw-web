/* eslint-disable max-len */
import { chromium, Page, Browser } from 'playwright';
import logger, {Level} from 'pwww-shared/Logger';

import * as types from 'pwww-shared/Types';
import ws from 'ws';
import Rerep from 'pwww-shared/rerepl';

import TabManager from './TabManager';

/**
 * Main browser session class.
 *
 * Holds the active browser session (Playwright's "Browser" object) and both WS connections. Exposes functions for action scheduling and other manipulation with the internal browser.
 */
export default class BrowserSession {
/**
 * Stores the internal Playwright Browser session.
 */
  private browser : Browser|null = null;

  /**
 * Handles tab and context management and page bootstrapping.
 */
  private tabManager : TabManager|null = null;

  /**
 * Stores pending tasks, used for task execution serialization.
 */
  private messageQueue : {resolve: (response: Object) => void, task: types.Action}[] = [];

  /**
 * Sets the minimal delay between two different tasks being executed.
 *
 * Setting this to `null` disables additional delay (task execution will still wait for stable DOM state before executing next task).
 */
  private playbackDelay = 1000;

  /**
 * Rerep object for maintaining connection to the frontend app.
 */
  private rerep : Rerep;

  /**
 * @summary BrowserSession constructor
 * @description Stores given WS connections and binds the message event callbacks.
 * @param wsConnection WS connection for handling text commands.
 */
  constructor(wsConnection : WebSocket) {
    this.rerep = new Rerep(wsConnection);

    this.rerep.addEventListener('request', async (e) => 
    {
      return await new Promise(res => {
        this.enqueueTask({resolve: res, task: <types.Action><unknown>e});
      });
    });
  }

  /**
 * Getter for extracting the current page (from the associated TabManager object) easily.
 */
  private get currentPage() : Page {
    if(this.tabManager && this.tabManager.currentPage){
      return this.tabManager.currentPage;
    }
    else{
      throw new Error('The Tab Manager is not ready.');
    }
    
  }

  /**
 * Initializes the browser session, usually called at the very beginnning.
 *
 * Spawns a new instance of the Chromium browser with a TabManager, binds all the necessary event listeners and opens a new (blank) tab - this also creates a new browser context.
 */
  private async initialize() : Promise<void> {
    logger('Initializing browser...',Level.DEBUG);
    this.browser = <Browser>(await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] } : {headless: false}));
    
    this.close = (() => {
      if(this.browser){
        this.browser.close();
      }
      else{
        throw new Error('Cannot close nonexistent browser!');
      }
    });
    

    this.tabManager = await new TabManager(this.browser);

    this.tabManager.on('tabsUpdate', (newState) => {
      this.sendToClient(JSON.stringify(newState));
    });

    await this.tabManager.injectToAll({ path: `${__dirname}/ExtractSelector.js` });

    logger('Opening new tab...', Level.DEBUG);
    await this.tabManager.newTab();
  }

  /**
 * Helper function for sending any number of string messages to the connected client (using the associated messagingChannel)
 *
 * @param data String array to be sent to the client
 */
  private sendToClient = (...data: string[]) => {
    data.forEach((element) => {
      // this.messagingChannel.send(element);
    });
  };

  /**
 * Screenshot request handler - auto called by the web app (used mainly for scrolling functionality), not associated with the recordable screenshot action!
 *
 * Reads the request message and tries to take a screenshot of the current webpage. If it succeeds, sends "completion response" to the client using the streaming connection, followed by the binary data with the screenshot itself.
 * @param message WSMessage with the screenNumber (how many full "PageDowns" is the requested screen located)
 */
  private async requestScreenshot(message: types.WSMessage<{ screenNumber: number }>): Promise<void> {
    if (this.browser !== null && this.browser.isConnected()) {
      this.currentPage.screenshot({
        type: 'jpeg',
        quality: 20,
        clip: {
          x: 0, y: message.payload.screenNumber * 720, width: 1280, height: 720,
        },
        fullPage: true,
      })
        .then((buffer) => {
          // this.signalCompletion(message, this.streamingChannel);
          // this.streamingChannel.send(buffer);
        })
        // .catch((e) => this.signalError(message, e.message, this.streamingChannel));
    } else {
      logger('[PWWW] Browser is not running, cannot send screenshot!', Level.ERROR);
    }
  }

  /**
 * Helper function for error signalling during the message-related request.
 * @param message Initial request message
 * @param e Reason of the error
 * @param channel Optional, WS connection to send the message to. Default - messagingChannel.
 */
  private signalError(message : types.WSMessage<unknown>, e: string, channel : ws) : void {
    channel.send(JSON.stringify({
      responseID: message.messageID,
      error: true,
      errorMessage: e,
    }));
  }

  /**
 * Helper function for signalling the completion of the message-related request.
 * @param message Initial request message
 * @param channel Optional, WS connection to send the message to. Default - messagingChannel.
 */
  private signalCompletion(message : types.WSMessage<unknown>, channel : ws) : void {
    channel.send(JSON.stringify({
      responseID: message.messageID,
      payload: message.payload,
    }));
  }

  /**
 * Main action-executing method.
 *
 * Takes the actions from the action queue and executes them according to the internal actionList - types.BrowserAction-keyed object with callback functions for values.
 * If any of the action functions throws, the exception gets relayed to the client via signalError.
 */
  private async processTasks() : Promise<void> {
    const actionList : { [key in keyof typeof types.BrowserAction] : ((task: types.Action) => Promise<types.Action>) } = {
      click:
(async (task) => {
  if (!task.data.selector) {
    try {
      const selectorObj = (await this.currentPage.evaluate(([click]) => {
        return (<any>window)["SelectorGenerator"].getNodeInfo((<any>window)["SelectorGenerator"].grabElementFromPoint(click.x, click.y));
      }, [task.data]));
      if (selectorObj.error) {
        throw new Error(selectorObj.error);
      }

      task.data.selector = selectorObj.semanticalSelector;
    } catch (e) {
      logger(<string>e, Level.ERROR);
      throw e;
    }
    logger(`Clicked on ${task.data.selector}`, Level.DEBUG);
  }
  if (task.data.selector) {
    await this.currentPage.click(task.data.selector, { timeout: 5000 });
    return task;
  }

  throw new Error('Selector could not be generated!');
}),

      browse:
(async (task) => {
  const url = await this.currentPage.goto(task.data.url)
    .then(() => task.data.url)
    .catch(async () => {
      const queryURL = `https://duckduckgo.com/?q=${encodeURIComponent(task.data.url)}`;
      logger(`Browsing to ${queryURL}...`, Level.DEBUG);
      await this.currentPage.goto(queryURL);
      return queryURL;
    });

  task.data.url = url;
  return task;
}),

      navigate:
async (task) => {
  await (task.data.back ? this.currentPage.goBack() : this.currentPage.goForward());

  return task;
},
      codeblock:
async (task) => {
// storing URL in case we need to reload page (if user-submitted code stuck in infinite loop, simple page.reload() will not work due to the single-threaded nature of JS.)
  const url = this.currentPage.url();
  let error = true;

  // the user submitted code is evaluated in the browser context (allowing user to run code on the server directly would probably pose as a security threat)
  await Promise.race([
    new Promise((res) => {
      this.currentPage.evaluate(task.data.code)
        .then(() => { error = false; res(null); });
    }),
    new Promise((_, rej) => setTimeout(() => {
      if (error) {
        rej({ message: 'Custom code block timeout, reloading page...' });
        if(this.tabManager){
          this.tabManager.closeTab(this.currentPage);
          this.tabManager.newTab(url);
        }
        else{
          throw new Error("Missing instance of Tab Manager, cannot ressurect the browser session!");
        }
        
      }
    }, 5000)),	// timeout to prevent action execution queue from freezing
  ]);

  return task;
},
      openTab:
async (task) => {
  if(this.tabManager){
    await this.tabManager.newTab();
    return task;
  }
  throw new Error("Missing instance of Tab Manager, cannot open a new tab!");
},

      switchTabs:
async (task) => {
  if(this.tabManager){
    await this.tabManager.switchTabs(task.data.currentTab);
    return task;
  }
  throw new Error("Missing instance of Tab Manager, cannot switch tabs!");
},

      closeTab:
async (task) => {
  if(this.tabManager){
    await this.tabManager.closeTab(task.data.closing);
    return task;
  }
  throw new Error("Missing instance of Tab Manager, cannot close tab!");
},
      insertText: async (task) => {
        await this.currentPage.keyboard.insertText(task.data.text);
        return task;
      },
      read: async (task) => {
        if (!task.data.selector) {
          const nodeInfo = await this.currentPage.evaluate(([click]) => {
            const generator = (<Window & typeof globalThis & { SelectorGenerator: any }>window).SelectorGenerator;
            return generator.getNodeInfo(generator.grabElementFromPoint(click.x, click.y));
          }, [task.data]);

          task.data.selector = nodeInfo.structuralSelector;

          // We cannot 'read' images, just screenshot it.
          if (nodeInfo.tagName === 'IMG') {
            task.type = <types.BrowserAction><unknown>types.BrowserAction[types.BrowserAction.screenshot];
          }
        }
        return task;
      },
      reset: async () => {
        if(this.tabManager){
          await this.tabManager.recycleContext();
          return types.EmptyAction;
        }
        throw new Error("Missing instance of Tab Manager, cannot reset the browser context!");
      },
      screenshot: async (task) => task,
      // When recording, screenshots are NOOP - they just get recorded.
      noop: async () => (types.EmptyAction),
    };

    if (this.browser === null || !this.browser.isConnected()) {
      await this.initialize();
    }

    while (this.messageQueue.length !== 0) {
      const newTask = this.messageQueue.shift();

      if(!newTask){
        throw new Error('Empty task!');
      }
      const {resolve, task} = newTask;

      // Validate payload type here????

      if (!task || !(task.type in actionList)) {
        logger(`[PWWW] Invalid task type! ${JSON.stringify(task)}`,Level.ERROR);
      } else {
        logger(`[PWWW] Executing ${task.type}...`,Level.DEBUG);

        Promise.all(
          [
            // Runs task and delay timer simultaneously - if task takes a lot of time, its execution time gets deducted from the delay as well.
            // Slows the playback down, giving user some time to understarnd the playback flow.
            actionList[task.type](task),
            this.playbackDelay ? new Promise((resolve) => setTimeout(resolve, this.playbackDelay)) : null,
          ],
        )
          .then(async ([response]) => {
            await this.currentPage.waitForLoadState();
            resolve(response);
          })
          .catch((e) => {
            // this.signalError(task, e.message);
          });
      }
    }
  }

  /**
* Enqueues new actions (messagingChannel message listener).
*
* Pushes the new messages into the messageQueue, checks if processTasks() is already running - if not, it starts the processing.
* @param task - New task object
*/
  public enqueueTask = (args: {resolve: () => void, task: types.Action}) : void => {
    this.messageQueue.push(args);
    if (this.messageQueue.length === 1) {
      this.processTasks();
    }
  };

  /**
* Public "destructor" for the browser session.
*
* Closes the internal browser session, which allows for safe disposal of the BrowserSession object. Disposing the BrowserSession without calling close() beforehand causes a serious memory leak, as the Playwright Chromium subprocess continues to live indefinitely.
*/
  public close : () => void = () => {}; // gets assigned with browser creation
}
