export enum BrowserAction {

    'click',
    'browse',
    'keydown',
    'navigate',

    'openTab',
    'switchTabs',
    'closeTab',

    'playRecording',
    'recording',
    'noop'
}

export type Action = {
    'type' : BrowserAction,
    'data' : object
}

export type RecordedAction = {
    'where' : object,
    'what' : Action
}

export const EmptyRecord = {type: BrowserAction.noop, data: {}};