const { chromium } = require('playwright');

import type { Page } from '../playwright/src/client/page';
import type { Browser } from '../playwright/src/client/browser';

import * as types from 'pwww-shared/types';

import TabManager from './tabManager';
import ws from 'ws';

const fs = require('fs');
const path = require('path');

class BrowserSession {
	private _browser : Browser = null;
	private _tabManager : TabManager;

	private _messageQueue : types.WSMessage<types.Action>[] = [];
	private _playbackDelay : number = 1000;

	private _messagingChannel : ws;
	private _streamingChannel : ws;

	constructor(messagingChannel : ws, streamingChannel : ws){
		this._messagingChannel = messagingChannel;
		this._streamingChannel = streamingChannel;

		messagingChannel.on('message', (message: string) => this.enqueueTask(JSON.parse(message)));
		streamingChannel.on('message', (message: string) => this._requestScreenshot(JSON.parse(message)));
		// on close?		
	}

	private get _currentPage() : Page {
		return this._tabManager.currentPage;
	}
	
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

	private _sendToClient = (...data) => {
		data.forEach(element => {
			this._messagingChannel.send(element);
		});
	}

	private async _requestScreenshot(message: types.WSMessage<{screenNumber: number}>): Promise<void>{
		if(this._browser !== null && this._browser.isConnected()){
			this._currentPage.screenshot({type: 'jpeg', clip:{x: 0, y:message.payload.screenNumber*720, width: 1280, height: 720}, fullPage: true})
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

	// private async sendScreenshot(options? : any) : Promise<void>{
	// 	if(this._browser !== null && this._browser.isConnected()){
	// 		this._currentPage.screenshot({'type': 'jpeg', ...options})
	// 			.catch(() => console.log("dropping screenshot..."))
	// 			.then((buffer: Buffer) => this._streamingChannel.send(buffer));
				
	// 	}
	// 	else{
	// 		console.error("[PWWW] Browser is not running, cannot send screenshot!");
	// 	}
	// }

	private _signalError(message : types.WSMessage<any>, e: string, channel : ws = this._messagingChannel) : void{
		channel.send(JSON.stringify({
			responseID: message.messageID,
			error: true,
			errorMessage: e
		}));
	}

	private _signalCompletion(message : types.WSMessage<any>, channel : ws = this._messagingChannel) : void{
		channel.send(JSON.stringify({
			responseID: message.messageID,
			payload: message.payload}));
	}

	private async processTasks() : Promise<void>{
		const actionList : {[key in keyof typeof types.BrowserAction] : ((task: types.Action) => Promise<types.Action>) } = {
			'click' : 
                (async (task) => {
					if(!task.data.selector){
						try{
							task.data.selector = (await this._currentPage.evaluate(([click]) => {
								const generator = new window["SelectorGenerator"]();
								return generator.getNodeInfo(generator.grabElementFromPoint(click.x, click.y));
							},[task.data])).semanticalSelector;
						}
						catch(e){
							console.error(e);
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

	public enqueueTask = ( task: types.WSMessage<types.Action> ) : void => {
		this._messageQueue.push(task);
		if(this._messageQueue.length === 1){
			this.processTasks();
		}
	}

	public close : Function = () => {}; //gets assigned with browser creation
}

export default BrowserSession;