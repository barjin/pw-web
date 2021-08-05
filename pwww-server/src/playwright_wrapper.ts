const { chromium } = require('playwright');

import type { Page } from '../playwright/src/client/page';
import type { Browser } from '../playwright/src/client/browser';

import * as types from 'pwww-shared/types';

import TabManager from './tabManager';
import WSChannel from './wsChannel';

const fs = require('fs');
const path = require('path');

class PlaywrightWrapper{
	private _browser : Browser = null;
	private _tabManager : TabManager;

	private _actionQueue : types.Action[] = [];

	private _playbackDelay : number = 1000;

	private _messagingChannel : WSChannel;
	private _streamingChannel : WSChannel;

	constructor(messagingChannel : WSChannel, streamingChannel : WSChannel){
		this._messagingChannel = messagingChannel;
		messagingChannel.start(
			(message: string) => this.enqueueTask(JSON.parse(message)),
			() => {
			if(this._browser){
				this._browser.close();
			}
		});

		this._streamingChannel = streamingChannel;
		streamingChannel.start((..._) => {}, (..._) => {});
	}

	private get _currentPage() : Page {
		return this._tabManager.currentPage;
	}
	
	private async _initialize() : Promise<void> {
		console.log("Initializing...");
		this._browser = await chromium.launch();
		this._tabManager = await new TabManager(this._browser);

		this._tabManager.on('tabsUpdate',(newState) => {
			this._sendToClient(JSON.stringify(newState));
		});

		await this._tabManager.injectToAll({path: './extractSelector.js'});

		console.log("Opening new tab...");
		await this._tabManager.newTab();
	}

	private _sendToClient = (...data) => {
		data.forEach(element => {
			this._messagingChannel.send(element);
		});
	}

	private async sendScreenshot(options? : any) : Promise<void>{
		if(this._browser !== null && this._browser.isConnected()){

			this._currentPage.screenshot({'type': 'jpeg', ...options})
				.then(this._streamingChannel.send)
				.catch(console.error);
		}
		else{
			console.error("[PWWW] Browser is not running, cannot send screenshot!");
		}
	}

	private async processTasks() : Promise<void>{
		const actionList : {[key in keyof typeof types.BrowserAction] : ((task: types.Action) => Promise<{type: types.BrowserAction, data: object}>) } = {
			'click' : 
                (async (task) => {
					if(!task.data.selector){
						task.data.selector = await this._currentPage.evaluate(([click]) => {
							const generator = new window["SelectorGenerator"]();
							return generator.GetSelector(document.elementFromPoint(click.x, click.y));
						},[task.data]);

						console.log(`Clicked on ${task.data.selector}`);
					}

                    await this._currentPage.click(task.data.selector);
					return task;
                }),

			'browse' : 
                (async (task) => {
					let url : string = task.data.url;

                    await this._currentPage.goto(url)
						.catch( async () => //FIX Promise rejection happens, if invalid URL is given... But what if there is another error?
							{
								url = "https://duckduckgo.com/?q=" + encodeURIComponent(url);
								await this._currentPage.goto(url);
							});

					return { ...task, data: {url: url} };
                }),

			'navigate':
                async (task) => {
                    await (task.data.back ? this._currentPage.goBack() : this._currentPage.goForward());

					return task;
                },

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
			'reset': async () => {
				await this._tabManager.recycleContext();
				return types.EmptyRecord;
			},
			'recording': async () => (types.EmptyRecord),
			'playRecording': async () => (types.EmptyRecord),
			'noop': async () => (types.EmptyRecord)
        };

		if(this._browser === null || !this._browser.isConnected()){
			await this._initialize();
		}

		while(this._actionQueue.length !== 0){
			let task = this._actionQueue.shift();
			if(task.type in actionList){

				console.log("[PWWW] Executing " + task.type + "...");

				let [actionWithContext, _, __] = await Promise.all(
					[
						//Runs task and delay timer simultaneously - if task takes a lot of time, its execution time gets deducted from the delay as well.
						actionList[task.type](task),
						this._currentPage.waitForLoadState(),
						this._playbackDelay ? new Promise(resolve => setTimeout(resolve,this._playbackDelay)) : null
					])

				this._sendToClient(JSON.stringify({
				responseID: task.id,
				currentAction:{
					where: {},
					what: actionWithContext
				}}));
				this.sendScreenshot(); // is this the correct time to send screenshots? (after every single action?)
			}
			else{
				console.error("[PWWW] Invalid task type! " + JSON.stringify(task));
			}
		}
	}

	public enqueueTask = ( task: types.Action ) : void => {
	
		this._actionQueue.push(task);
		if(this._actionQueue.length === 1){
			this.processTasks();
		}
	}
}

export default PlaywrightWrapper;