export enum BrowserAction {

    'click',
    'browse',
    'keydown',
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

export const EmptyRecord = {type: BrowserAction.noop, data: {}};