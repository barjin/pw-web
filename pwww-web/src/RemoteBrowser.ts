/* eslint-disable */
/** RemoteBrowser class
Shielding the frontend developer from the "low level" communication with the streamed browser via WebSockets connection */

import Rerep, { Message } from 'pwww-shared/rerepl';
import * as types from 'pwww-shared/Types';

export default class RemoteBrowser {
[key: string]: Function|typeof this.rerep;

private rerep : Rerep | null = null;

public screencastCallback: (data: Buffer) => void = () => {};

constructor() {
}

private requestAction = (type: types.BrowserAction, params?: Object) : Promise<Object> => {
  if (!this.rerep) {
    throw new Error('The remote browser is disconnected.');
  }

  return this.rerep.request({ type: types.BrowserAction[type], data: params });
}

public connectToServer = (serverAddress: string, port: number) => {
  const rerep = new Rerep(new WebSocket(`ws://${serverAddress}:${port}`));
  rerep.send({ahoj: "ahoj"});

  rerep.addEventListener('open', () => {
    this.rerep = rerep;
    this.rerep.send({ type: 'noop' });
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
  });
}

public reset = () => {
  return this.requestAction(types.BrowserAction.reset, {});
}

public click = (params: { x: number, y: number } | { selector : string }) => {
  return this.requestAction(types.BrowserAction.click, params);
}

public goto = (url: string) => {
  return this.requestAction(types.BrowserAction.browse, { url });
}

public insertText = (text: string) => {
  return this.requestAction(types.BrowserAction.insertText, { text });
}

public goBack = () => {
  return this.requestAction(types.BrowserAction.navigate, { back: true });
}

public goForward = () => {
  return this.requestAction(types.BrowserAction.navigate, { back: false });
}

public openTab = () => {
  return this.requestAction(types.BrowserAction.openTab);
}

public switchTab = (tabID: number) => {
  return this.requestAction(types.BrowserAction.switchTabs, { currentTab: tabID });
}

public closeTab = (tabID: number) => {
  return this.requestAction(types.BrowserAction.closeTab, { closing: tabID });
}
}
