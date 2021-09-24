export enum BrowserAction {
    'click',
    'goto',
    'insertText',
    'goBack',
    'goForward',
    'openTab',
    'switchTabs',
    'closeTab',

    'reset',
    'noop',

    'codeblock',

    'read',
    'screenshot',
}

export type Action = {
    'type' : BrowserAction,
    'data' : any
}

export type RecordedAction = {
    'id': number,
    'what' : Action
}

export type WSMessage<T> = {
    'messageID': number,
    'payload': T
}

export type APIResponse<T> = {
    'ok': boolean,
    'data': T
}

export type AppState = {
    TabState: {currentTab: number, tabs: string[]},
    RecordingState: {
        isRecording: boolean,
        playback: (null|"cont"|"step"),
        playbackError: string,
        currentActionIdx: number,
        recording: {
            name: string,
            actions: Action[]
        }
    }
}

export type RecordingModifier = {
    this?: any,
    deleteBlock : (idx: number) => void,
    rearrangeBlocks : (oldidx: number, newidx: number) => void,
    updateBlock : (idx: number, action: Action) => void,
    pushCustomBlock : () => void;
}

export const EmptyAction = {type: BrowserAction.noop, data: {}};