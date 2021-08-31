[pwww-web](../devdocs.md) / [Exports](../devdocs.md) / [screens/recordingScreen](../modules/screens_recordingScreen.md) / StreamWindow

# Class: StreamWindow

[screens/recordingScreen](../modules/screens_recordingScreen.md).StreamWindow

React component containing the canvas with the streamed browser environment.

Contains all the rendering methods as well as some scrolling logic.

## Hierarchy

- `Component`<`any`, `any`\>

  ↳ **`StreamWindow`**

## Table of contents

### Constructors

- [constructor](screens_recordingScreen.StreamWindow.md#constructor)

### Properties

- [\_actionSender](screens_recordingScreen.StreamWindow.md#_actionsender)
- [\_canvas](screens_recordingScreen.StreamWindow.md#_canvas)
- [\_requestScreenshot](screens_recordingScreen.StreamWindow.md#_requestscreenshot)
- [\_screenBuffer](screens_recordingScreen.StreamWindow.md#_screenbuffer)
- [\_scrollHeight](screens_recordingScreen.StreamWindow.md#_scrollheight)

### Methods

- [\_flushBuffer](screens_recordingScreen.StreamWindow.md#_flushbuffer)
- [addScreen](screens_recordingScreen.StreamWindow.md#addscreen)
- [getClickPos](screens_recordingScreen.StreamWindow.md#getclickpos)
- [getSnapshotBeforeUpdate](screens_recordingScreen.StreamWindow.md#getsnapshotbeforeupdate)
- [resetView](screens_recordingScreen.StreamWindow.md#resetview)

## Constructors

### constructor

• **new StreamWindow**(`props`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `Object` |
| `props.actionSender` | (`actionType`: `BrowserAction`, `data`: `object`) => `Promise`<`void`\> |
| `props.screenRequester` | (`screenNumber`: `number`) => `void` |

#### Overrides

Component&lt;any, any\&gt;.constructor

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:48](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L48)

## Properties

### \_actionSender

• `Private` **\_actionSender**: (...`args`: `any`[]) => `Promise`<`void`\>

Callback function for passing the canvas targetted actions (clicking, screenshots) to the handlers higher up.

#### Type declaration

▸ (...`args`): `Promise`<`void`\>

Callback function for passing the canvas targetted actions (clicking, screenshots) to the handlers higher up.

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `any`[] |

##### Returns

`Promise`<`void`\>

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:34](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L34)

___

### \_canvas

• `Private` **\_canvas**: `RefObject`<`HTMLCanvasElement`\>

React Reference to the actual HTML canvas element acting as the browser main window.

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:30](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L30)

___

### \_requestScreenshot

• `Private` **\_requestScreenshot**: (`screenNumber`: `number`) => `void`

Callback function for requesting new screen tiles - used with the scrolling functionality, not connected to the recordable "screenshot" action.

#### Type declaration

▸ (`screenNumber`): `void`

Callback function for requesting new screen tiles - used with the scrolling functionality, not connected to the recordable "screenshot" action.

##### Parameters

| Name | Type |
| :------ | :------ |
| `screenNumber` | `number` |

##### Returns

`void`

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:38](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L38)

___

### \_screenBuffer

• `Private` **\_screenBuffer**: `Blob`[]

Array of screen tiles - updated dynamically as the user scrolls to save some bandwidth as well as some extra horsepower.

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:46](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L46)

___

### \_scrollHeight

• `Private` **\_scrollHeight**: `number` = `0`

Current distance scrolled (in the vertical direction).

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:42](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L42)

## Methods

### \_flushBuffer

▸ `Private` **_flushBuffer**(): `void`

Internal method for flushing the current state of the image buffer to the screen.

Checks whether the images are loaded, uses the current scroll height and optimizes the rendering process.

#### Returns

`void`

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:139](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L139)

___

### addScreen

▸ **addScreen**(`idx`, `data`): `void`

"Setter" function for the internal sceen buffer.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `idx` | `number` | Index of the new screen being added. |
| `data` | `Blob` | Binary image data of the new screen. |

#### Returns

`void`

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:79](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L79)

___

### getClickPos

▸ `Private` **getClickPos**(`ev`): `Object`

Canvas click handler using basic geometry to map the current click position (takes care of the scroll height calculations) to the VIEWPORT_H, VIEWPORT_W space (correspoding to the Playwright's browser window size)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ev` | `MouseEvent` | Click event |

#### Returns

`Object`

The remapped coordinates of the current click.

| Name | Type |
| :------ | :------ |
| `x` | `number` |
| `y` | `number` |

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:61](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L61)

___

### resetView

▸ **resetView**(): `void`

Clears the screen buffer array and resets the scroll height to 0.

#### Returns

`void`

#### Defined in

[pwww-web/src/screens/recordingScreen.tsx:87](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/recordingScreen.tsx#L87)
