export enum BrowserAction {
    'click',
    'browse',
    'insertText',
    'navigate',
    'read',

    'openTab',
    'switchTabs',
    'closeTab',

    'reset',
    'playRecording',
    'recording',
    'noop'
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
        playbackError: boolean
        currentActionIdx: number,
        recording: {
            name: string,
            actions: Action[]
        }
    }
}

export const EmptyAction = {type: BrowserAction.noop, data: {}};