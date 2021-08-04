export enum BrowserAction {
    'click',
    'browse',
    'insertText',
    'navigate',

    'openTab',
    'switchTabs',
    'closeTab',

    'reset',
    'playRecording',
    'recording',
    'noop'
}

export type Action = {
    'id': number,
    'type' : BrowserAction,
    'data' : any
}

export type RecordedAction = {
    'where' : object,
    'what' : Action
}

export type APIResponse<T> = {
    'ok': boolean,
    'data': T
}

export type AppState = {
    TabState: {currentTab: number, tabs: string[]},
    RecordingState: {
        isRecording: boolean,
        currentActionIdx: number,
        recording: {
            name: string,
            actions: RecordedAction[]
        }
    }
}

export const EmptyRecord = {type: BrowserAction.noop, data: {}};