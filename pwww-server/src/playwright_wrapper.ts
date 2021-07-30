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
		messagingChannel.start(this.enqueueTask, () => {
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
		this._browser = await chromium.launch();
		this._tabManager = await new TabManager(this._browser);

		this._tabManager.on('tabsUpdate',(newState) => {
			this._sendToClient(JSON.stringify(newState));
		})

		await this._tabManager.newTab();
		await this._tabManager.injectToAll({path: './extractSelector.js'});
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
						.catch( async () => 
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
			// Following actions should not be recorded (are used for recording management).
			// Therefore are they returning "EmptyRecord", a special value which gets ignored during capturing.
			// 'playRecording':
			// 	async (task) => {
			// 		this._isRecording = false;
					
			// 		if(task.data.delay){
			// 			this._playbackDelay = task.data.delay;
			// 		}
			// 		this._actionQueue = this._recording.map((x) => x.what);;
			
			// 		await this._tabManager.recycleContext();
			// 		return types.EmptyRecord;
			// 	},
			// 'recording':
			// 	async (task) => {
					
			// 		/* 
			// 			Temporary, needs better solution! - when recording session starts, the browser resets itself.
			// 			This way, we avoid the recording/playback initial state inconsistency.
			// 		*/
			// 		if(!this._isRecording && task.data.on){
			// 			this._tabManager.recycleContext();
			// 		}

			// 		this._isRecording = task.data.on;

			// 		if(!this._isRecording){
			// 			this.saveRecording(task.data.name);
			// 		}

			// 		return types.EmptyRecord;
			// 	},
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

				let [actionWithContext, _] = await Promise.all(
					[
						//Runs task and delay timer simultaneously - if task takes a lot of time, its execution time gets deducted from the delay as well.
						// !!! Needs better way of telling when the action is completed. !!!
						actionList[task.type](task),
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

	// public saveRecording(filename : string){
	// 	if(!fs.existsSync(paths.savePath)) fs.mkdirSync(paths.savePath);

	// 	fs.writeFileSync(path.join(paths.savePath,filename), JSON.stringify(this._recording));
	// }

	public enqueueTask = ( task: string ) : void => {
		let parsedTask = JSON.parse(task);

		// Enqueue task is invoked on incoming message, i.e. user action in streamed browser.
		// To ensure "responsiveness", the broswer turns the delayed playback mode off.
		// this._playbackDelay = null;

		this._actionQueue.push(parsedTask);
		if(this._actionQueue.length === 1){
			this.processTasks();
		}
	}
}

export default PlaywrightWrapper;