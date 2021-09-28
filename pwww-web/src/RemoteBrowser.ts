/* eslint-disable */
/** RemoteBrowser class
Shielding the frontend developer from the "low level" communication with the streamed browser via WebSockets connection */

import Rerep, { Message } from 'pwww-shared/rerepl';
import * as types from 'pwww-shared/Types';


type ClickParams = { x: number, y: number } | { selector : string };

export default class RemoteBrowser {
[key: string]: Function|typeof this.rerep;

private rerep : Rerep | null = null;

public screencastCallback: (data: Buffer) => void = () => {};
public tabStateCallback: (data: types.AppState["TabState"]) => void = () => {};

constructor() {
}

private requestAction = (type: types.BrowserAction, params?: Object) : Promise<Object> => {
  if (!this.rerep) {
    throw new Error('The remote browser is disconnected.');
  }

  return this.rerep.request({ type: types.BrowserAction[type], data: params });
}

public connectToServer = (serverAddress: string, port: number) => {
  const rerep = new Rerep(new WebSocket(`${window.location.protocol === "https" ? "wss" : "ws"}://${serverAddress}:${port}/ws`));

  rerep.addEventListener('open', () => {
    this.rerep = rerep;
    this.rerep.request({ type: 'reset' });
  });

  rerep.addEventListener('close', () => {
    this.rerep = null;
  });

  rerep.addEventListener('response', (payload : Message['payload']) => { 
    return !(<any>payload).error; 
  });
  
  rerep.addEventListener('misc', (message : any) => {
    if ((<Message>message).header.format === 'B') {
      this.screencastCallback(<Buffer>(<Message>message).payload);
    }
    else if ((<Message>message).header.format === 'J'){
      this.tabStateCallback(<types.AppState["TabState"]>(<Message>message).payload);
    }
  });
}

public reset = (params?: {}) => {
  return this.requestAction(types.BrowserAction.reset, {});
}

public click = (params: ClickParams) => {
  return this.requestAction(types.BrowserAction.click, params);
}

public goto = (params: {url: string}) => {
  return this.requestAction(types.BrowserAction.goto, params);
}

public insertText = (params: {text: string}) => {
  return this.requestAction(types.BrowserAction.insertText, params);
}

public goBack = (params?: {}) => {
  return this.requestAction(types.BrowserAction.goBack, params);
}

public goForward = (params?: {}) => {
  return this.requestAction(types.BrowserAction.goForward, params);
}

public openTab = (params?: {}) => {
  return this.requestAction(types.BrowserAction.openTab);
}

public switchTab = (params?: {currentTab: number}) => {
  return this.requestAction(types.BrowserAction.switchTabs, params);
}

public closeTab = (params: {closing: number}) => {
  return this.requestAction(types.BrowserAction.closeTab, params);
}

public read = (params: ClickParams) => {
  return this.requestAction(types.BrowserAction.read, params);
}

public scroll = (params: WheelEvent) => {
  const {x,y,deltaX,deltaY,deltaZ} = params;
  this.rerep?.send({type: 'mouseWheel',x,y,deltaX,deltaY,deltaZ});
}

public highlight = (selector: string) => {
  this.rerep?.send({type: 'highlight', data: {selector: selector}});
}

}
