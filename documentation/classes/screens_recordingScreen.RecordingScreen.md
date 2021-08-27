[pwww-web](../README.md) / [Exports](../modules.md) / [screens/recordingScreen](../modules/screens_recordingScreen.md) / RecordingScreen

# Class: RecordingScreen

[screens/recordingScreen](../modules/screens_recordingScreen.md).RecordingScreen

Top-level React Component encompassing all the other components at the Recording Screen.

## Hierarchy

- `Component`<`IRecScreenProps`, `IRecScreenState`\>

  ↳ **`RecordingScreen`**

## Table of contents

### Constructors

- [constructor](screens_recordingScreen.RecordingScreen.md#constructor)

### Properties

- [\_canvas](screens_recordingScreen.RecordingScreen.md#_canvas)
- [\_messageChannel](screens_recordingScreen.RecordingScreen.md#_messagechannel)
- [\_recordingModifier](screens_recordingScreen.RecordingScreen.md#_recordingmodifier)
- [\_step](screens_recordingScreen.RecordingScreen.md#_step)
- [\_stopSignal](screens_recordingScreen.RecordingScreen.md#_stopsignal)
- [\_streamChannel](screens_recordingScreen.RecordingScreen.md#_streamchannel)
- [currentScreencastRequestIdx](screens_recordingScreen.RecordingScreen.md#currentscreencastrequestidx)
- [location](screens_recordingScreen.RecordingScreen.md#location)
- [requestedScreens](screens_recordingScreen.RecordingScreen.md#requestedscreens)

### Methods

- [UNSAFE\_componentWillMount](screens_recordingScreen.RecordingScreen.md#unsafe_componentwillmount)
- [UNSAFE\_componentWillReceiveProps](screens_recordingScreen.RecordingScreen.md#unsafe_componentwillreceiveprops)
- [UNSAFE\_componentWillUpdate](screens_recordingScreen.RecordingScreen.md#unsafe_componentwillupdate)
- [\_initRender](screens_recordingScreen.RecordingScreen.md#_initrender)
- [\_insertText](screens_recordingScreen.RecordingScreen.md#_inserttext)
- [\_playRecording](screens_recordingScreen.RecordingScreen.md#_playrecording)
- [\_recordingControl](screens_recordingScreen.RecordingScreen.md#_recordingcontrol)
- [\_requestAction](screens_recordingScreen.RecordingScreen.md#_requestaction)
- [\_requestScreenshot](screens_recordingScreen.RecordingScreen.md#_requestscreenshot)
- [\_stepper](screens_recordingScreen.RecordingScreen.md#_stepper)
- [\_stop](screens_recordingScreen.RecordingScreen.md#_stop)
- [\_streamSetup](screens_recordingScreen.RecordingScreen.md#_streamsetup)
- [componentDidCatch](screens_recordingScreen.RecordingScreen.md#componentdidcatch)
- [componentDidMount](screens_recordingScreen.RecordingScreen.md#componentdidmount)
- [componentDidUpdate](screens_recordingScreen.RecordingScreen.md#componentdidupdate)
- [componentWillMount](screens_recordingScreen.RecordingScreen.md#componentwillmount)
- [componentWillReceiveProps](screens_recordingScreen.RecordingScreen.md#componentwillreceiveprops)
- [componentWillUnmount](screens_recordingScreen.RecordingScreen.md#componentwillunmount)
- [componentWillUpdate](screens_recordingScreen.RecordingScreen.md#componentwillupdate)
- [forceUpdate](screens_recordingScreen.RecordingScreen.md#forceupdate)
- [getSnapshotBeforeUpdate](screens_recordingScreen.RecordingScreen.md#getsnapshotbeforeupdate)
- [render](screens_recordingScreen.RecordingScreen.md#render)
- [setState](screens_recordingScreen.RecordingScreen.md#setstate)
- [shouldComponentUpdate](screens_recordingScreen.RecordingScreen.md#shouldcomponentupdate)

## Constructors

### constructor

• **new RecordingScreen**(`props`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `IRecScreenProps` |

#### Overrides

Component&lt;IRecScreenProps, IRecScreenState\&gt;.constructor

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:244](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L244)

## Properties

### \_canvas

• `Private` **\_canvas**: `RefObject`<[`StreamWindow`](screens_recordingScreen.StreamWindow.md)\>

React ref to the current StreamWindow.

Useful for calling the non-react functions of the current StreamWindow from this component.

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:206](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L206)

___

### \_messageChannel

• `Private` **\_messageChannel**: ``null`` \| [`ACKChannel`](ACKChannel.ACKChannel-1.md) = `null`

WebSockets connection for sending the textual commands to the server.

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:210](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L210)

___

### \_recordingModifier

• `Private` **\_recordingModifier**: `RecordingModifier`

Container object with recording modifier functions (used to pass the modifiers to the child components while still storing the state at the top level)

As of now, this object contains "deleteBlock", "updateBlock", "rearrangeBlocks" and "pushCustomBlock".

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:538](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L538)

___

### \_step

• `Private` **\_step**: `Function`

Resolve function of the _stepper() generated Promise.

Once called, the stepper promise gets resolved and the playback moves one step forward (if running in the step mode, noop otherwise).

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:228](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L228)

___

### \_stopSignal

• `Private` **\_stopSignal**: `boolean` = `false`

Boolean flag for stopping the playback.

If set true, the asynchronous recording playback will stop (and set the flag back to false).

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:221](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L221)

___

### \_streamChannel

• `Private` **\_streamChannel**: ``null`` \| [`ACKChannel`](ACKChannel.ACKChannel-1.md) = `null`

WebSockets connection for image data transfer.

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:214](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L214)

___

### currentScreencastRequestIdx

• `Private` **currentScreencastRequestIdx**: `number` = `0`

Stores current expected screen tile id.

Set after the "screenshot response" message, the next binary streamChannel message will contain this id's screenshot.

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:235](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L235)

___

### location

• **location**: `any`

React Router location (used for accessing the query part of the url, hostname etc.)

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:200](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L200)

___

### requestedScreens

• `Private` **requestedScreens**: `number`[] = `[]`

Stores ids of already requested screen tiles.

Used for optimization (eliminating double requests - quite important when binding the requester on the wheel event, which fires rapidly).

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:242](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L242)

___

## Methods

### \_initRender

▸ `Private` **_initRender**(): () => `void`

Clears the internal screen buffer and requests first two screens on the page.

#### Returns

`fn`

IIFE-style function to be called when complete rerendering is required.

▸ (): `void`

##### Returns

`void`

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:349](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L349)

___

### \_insertText

▸ `Private` **_insertText**(): `void`

Prompts the user for the text to paste to the website, then requests an insertText action.

#### Returns

`void`

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:474](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L474)

___

### \_playRecording

▸ `Private` **_playRecording**(`step?`): `Promise`<`void`\>

Starts the playback session.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `step` | `boolean` | `false` | If true, the playback will wait for the _stepper() promise to resolve with every action (next step button click). |

#### Returns

`Promise`<`void`\>

Gets resolved after the recording has ended (rejected if there was an error during the playback).

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:413](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L413)

___

### \_recordingControl

▸ `Private` **_recordingControl**(`action`): `void`

"Router" method (used mainly as a callback in child components) for the playback/recording control.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `action` | `string` | Type of the requested action (play\|record\|step\|stop). |

#### Returns

`void`

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:485](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L485)

___

### \_requestAction

▸ `Private` **_requestAction**(`actionType`, `data`): `undefined` \| `Promise`<`void`\>

Helper method to facilitate client->server requests and recording mechanism.

Requests the specified action via the messagingChannel (ACK channel), if the recording session is active, the action gets recorded.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `actionType` | `BrowserAction` | Type (defined in the types.BrowserAction enum) of the requested action. |
| `data` | `object` | Object with the action-type-dependent data. |

#### Returns

`undefined` \| `Promise`<`void`\>

Promise gets resolved when the Action is executed (on the server) and the browser view is rerendered. Might throw (reject response) when there is a problem with the action execution.

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:366](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L366)

___

### \_requestScreenshot

▸ `Private` **_requestScreenshot**(`screenNumber`): `void`

Helper function for sending the screenshot requests to the server over the corresponding WS channel.
Checks whether the requested screenshot has been requested before - in that case, this new request is discarded. Otherwise the request is made and handled further.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `screenNumber` | `number` | Number of the currently requested screen. |

#### Returns

`void`

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:335](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L335)

___

### \_stepper

▸ `Private` **_stepper**(): `Promise`<`void`\>

"Hacky" solution for the playback "Step" functionality.

#### Returns

`Promise`<`void`\>

The promise's resolve function is exposed as a private class member _step, pressing the "Next Step button" calls this function, resulting in the Promise getting resolved and the playback resumed.

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:402](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L402)

___

### \_stop

▸ `Private` **_stop**(): `Promise`<`void`\>

"Hacky" solution for stopping the playback.

#### Returns

`Promise`<`void`\>

The promise gets normaly immediately resolved, when the class member _stopSignal is set, the promise gets rejected (which then disables the playback).

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:392](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L392)

___

### \_streamSetup

▸ `Private` **_streamSetup**(): `void`

Bootstrapping method for starting all the necessary connections and binding the event handlers.

#### Returns

`void`

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:269](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L269)
