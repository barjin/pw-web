const { chromium } = require('playwright');

import type { Page } from '../playwright/src/client/page';
import type { Browser } from '../playwright/src/client/browser';

import * as types from 'pwww-shared/types';

import {TabManager} from './tabManager';
import ws from 'ws';
import { createSemanticDiagnosticsBuilderProgram } from 'typescript';

const fs = require('fs');
const path = require('path');

/**
 * Main browser session class.
 * 
 * Holds the active browser session (Playwright's "Browser" object) and both WS connections. Exposes functions for action scheduling and other manipulation with the internal browser.
 */
class BrowserSession {
	/**
	 * Stores the internal Playwright Browser session.
	 */
	private _browser : Browser = null;
	/**
	 * Handles tab and context management and page bootstrapping.
	 */
	private _tabManager : TabManager;

	/**
	 * Stores pending tasks, used for task execution serialization.
	 */
	private _messageQueue : types.WSMessage<types.Action>[] = [];
	/**
	 * Sets the minimal delay between two different tasks being executed.
	 * 
	 * Setting this to `null` disables additional delay (task execution will still wait for stable DOM state before executing next task).
	 */
	private _playbackDelay : number = 1000;

	/**
	 * Websockets connection used for signalling and action scheduling.
	 */
	private _messagingChannel : ws;

	/**
	 * Websockets connection used for image data requests / transfer. 
	*/
	private _streamingChannel : ws;

	/**
	 * @summary BrowserSession constructor
	 * @description Stores given WS connections and binds the message event callbacks for both of them.
	 * @param messagingChannel WS connection for handling text commands.
	 * @param streamingChannel WS connection for handling image stream.
	 */
	constructor(messagingChannel : ws, streamingChannel : ws){
		this._messagingChannel = messagingChannel;
		this._streamingChannel = streamingChannel;

		messagingChannel.on('message', (message: string) => this.enqueueTask(JSON.parse(message)));
		streamingChannel.on('message', (message: string) => this._requestScreenshot(JSON.parse(message)));		
	}

	/**
	 * Getter for extracting the current page (from the associated TabManager object) easily. 
	 */
	private get _currentPage() : Page {
		return this._tabManager.currentPage;
	}
	
	/**
	 * Initializes the browser session, usually called at the very beginnning.
	 * 
	 * Spawns a new instance of the Chromium browser with a TabManager, binds all the necessary event listeners and opens a new (blank) tab - this also creates a new browser context.
	 */
	private async _initialize() : Promise<void> {
		console.log("Initializing...");
		this._browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] } : {});
		this.close = (() => this._browser.close());

		this._tabManager = await new TabManager(this._browser);

		this._tabManager.on('tabsUpdate',(newState) => {
			this._sendToClient(JSON.stringify(newState));
		});

		await this._tabManager.injectToAll({path: __dirname + '/extractSelector.js'});

		console.log("Opening new tab...");
		await this._tabManager.newTab();
	};

	/**
	 * Helper function for sending any number of string messages to the connected client (using the associated _messagingChannel)
	 * 
	 * @param data String array to be sent to the client
	 */
	private _sendToClient = (...data: string[]) => {
		data.forEach(element => {
			this._messagingChannel.send(element);
		});
	}

	/**
	 * Screenshot request handler - auto called by the web app (used mainly for scrolling functionality), not associated with the recordable screenshot action!
	 * 
	 * Reads the request message and tries to take a screenshot of the current webpage. If it succeeds, sends "completion response" to the client using the streaming connection, followed by the binary data with the screenshot itself. 
	 * @param message WSMessage with the screenNumber (how many full "PageDowns" is the requested screen located)
	 */
	private async _requestScreenshot(message: types.WSMessage<{screenNumber: number}>): Promise<void>{
		if(this._browser !== null && this._browser.isConnected()){
			this._currentPage.screenshot({type: 'jpeg', quality: 20, clip:{x: 0, y:message.payload.screenNumber*720, width: 1280, height: 720}, fullPage: true})
				.then(buffer => {
					this._signalCompletion(message,this._streamingChannel);
					this._streamingChannel.send(buffer);
				})
			.catch(e => this._signalError(message,e.message,this._streamingChannel))
		}
		else{
			console.error("[PWWW] Browser is not running, cannot send screenshot!");
		}
	}

	/**
	 * Helper function for error signalling during the message-related request.
	 * @param message Initial request message
	 * @param e Reason of the error
	 * @param channel Optional, WS connection to send the message to. Default - messagingChannel.
	 */
	private _signalError(message : types.WSMessage<any>, e: string, channel : ws = this._messagingChannel) : void{
		channel.send(JSON.stringify({
			responseID: message.messageID,
			error: true,
			errorMessage: e
		}));
	}

	/**
	 * Helper function for signalling the completion of the message-related request.
	 * @param message Initial request message
	 * @param channel Optional, WS connection to send the message to. Default - messagingChannel.
	 */
	private _signalCompletion(message : types.WSMessage<any>, channel : ws = this._messagingChannel) : void{
		channel.send(JSON.stringify({
			responseID: message.messageID,
			payload: message.payload}));
	}

	/**
	 * Main action-executing method.
	 * 
	 * Takes the actions from the action queue and executes them according to the internal actionList - types.BrowserAction-keyed object with callback functions for values. 
	 * If any of the action functions throws, the exception gets relayed to the client via _signalError.
	 */
	private async processTasks() : Promise<void>{
		const actionList : {[key in keyof typeof types.BrowserAction] : ((task: types.Action) => Promise<types.Action>) } = {
			'click' : 
                (async (task) => {
					if(!task.data.selector){
						try{
							let selectorObj = (await this._currentPage.evaluate(([click]) => {
								const generator = new window["SelectorGenerator"]();
								return generator.getNodeInfo(generator.grabElementFromPoint(click.x, click.y));
							},[task.data]));
							if(selectorObj.error){
								throw(selectorObj.error);
							}
							
							task.data.selector = selectorObj.semanticalSelector;
						}
						catch(e){
							console.error(e);
							throw new Error(e);
						}
						console.log(`Clicked on ${task.data.selector}`);
					}
					if(task.data.selector){
						await this._currentPage.click(task.data.selector,{timeout: 5000});
						return task;
					}
                    else{
						throw "Selector could not be generated!";
					}
                }),

			'browse' : 
                (async (task) => {
					let url = await this._currentPage.goto(task.data.url)
						.then(() => task.data.url)
						.catch( async () => //FIX THIS! Promise rejection happens if invalid URL is given... But what if there is another type of error? Can cause infinite duckduckgo request loop!
							{
								let queryURL = "https://duckduckgo.com/?q=" + encodeURIComponent(task.data.url);
								console.log(queryURL);
								await this._currentPage.goto(queryURL);
								return queryURL;
							});

					task.data.url = url;
					return task;
                }),

			'navigate':
                async (task) => {
                    await (task.data.back ? this._currentPage.goBack() : this._currentPage.goForward());

					return task;
                },
			'codeblock':
				async (task) => {
					
					// storing URL in case we need to reload page (if user-submitted code stuck in infinite loop, simple page.reload() will not work due to the single-threaded nature of JS.)
					let url = this._currentPage.url();
					let error = true;
					
					// the user submitted code is evaluated in the browser context (allowing user to run code on the server directly would probably pose as a security threat)
					await Promise.race([
						new Promise((res) => {
							this._currentPage.evaluate(task.data["code"])
								.then(() => {error = false; res(null)});
						}),
						new Promise((_,rej) => setTimeout(() => {
							if(error){
								rej({message: "Custom code block timeout, reloading page..."}),
								this._tabManager.closeTab(this._currentPage);
								this._tabManager.newTab(url);
							}
						},5000))	// timeout to prevent action execution queue from freezing
					]);

					return task;
				}
			,
			'openTab':
                async (task) => {
                    await this._tabManager.newTab();

					return task;
				},

			'switchTabs': 
                async (task) => {
                    await this._tabManager.switchTabs(task.data.currentTab);
					return task;
                },

			'closeTab':
             	async (task) => {
                    await this._tabManager.closeTab(task.data.closing);

					return task;
                },
			'insertText': async (task) => {
				await this._currentPage.keyboard.insertText(task.data.text);
				return task;
			},
			'read': async (task) => {
				if(!task.data.selector){
					var nodeInfo = await this._currentPage.evaluate(([click]) => {
						const generator = new window["SelectorGenerator"]();
						return generator.getNodeInfo(generator.grabElementFromPoint(click.x, click.y));
					},[task.data]);

					task.data.selector = nodeInfo.structuralSelector;

					// We cannot 'read' images, just screenshot it.
					if(nodeInfo.tagName === "IMG"){
						(task.type as any) = types.BrowserAction[types.BrowserAction.screenshot];
					}
				}
				return task;
			},
			'reset': async () => {
				await this._tabManager.recycleContext();
				return types.EmptyAction;
			},
			'screenshot': async (task) => {
				// When recording, screenshots are NOOP - they just get recorded.
				return task;
			},
			'noop': async () => (types.EmptyAction)
        };

		if(this._browser === null || !this._browser.isConnected()){
			await this._initialize();
		}

		while(this._messageQueue.length !== 0){
			let task = this._messageQueue.shift();

			// Validate payload type here????

			if(!(task.payload.type in actionList)){
				console.error("[PWWW] Invalid task type! " + JSON.stringify(task));
			}
			else {
				console.log("[PWWW] Executing " + task.payload.type + "...");

				Promise.all(
					[
						// Runs task and delay timer simultaneously - if task takes a lot of time, its execution time gets deducted from the delay as well.
						// Slows the playback down, giving user some time to understarnd the playback flow.
						actionList[task.payload.type](task.payload),
						this._playbackDelay ? new Promise(resolve => setTimeout(resolve,this._playbackDelay)) : null
					])
					.then(async ([actionWithContext]) => {
						await this._currentPage.waitForLoadState(),

						this._signalCompletion(task);
					})
					.catch((e) => {
						this._signalError(task, e.message);
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
	public enqueueTask = ( task: types.WSMessage<types.Action> ) : void => {
		this._messageQueue.push(task);
		if(this._messageQueue.length === 1){
			this.processTasks();
		}
	}

	/**
	 * Public "destructor" for the browser session.
	 * 
	 * Closes the internal browser session, which allows for safe disposal of the BrowserSession object. Disposing the BrowserSession without calling close() beforehand causes a serious memory leak, as the Playwright Chromium subprocess continues to live indefinitely.
	 */
	public close : Function = () => {}; //gets assigned with browser creation
}

export {BrowserSession};