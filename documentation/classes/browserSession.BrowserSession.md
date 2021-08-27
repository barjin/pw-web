[pwww-server](../README.md) / [Exports](../modules.md) / [browserSession](../modules/browserSession.md) / BrowserSession

# Class: BrowserSession

[browserSession](../modules/browserSession.md).BrowserSession

Main browser session class.

Holds the active browser session (Playwright's "Browser" object) and both WS connections. Exposes functions for action scheduling and other manipulation with the internal browser.

## Table of contents

### Constructors

- [constructor](browserSession.BrowserSession.md#constructor)

### Properties

- [\_browser](browserSession.BrowserSession.md#_browser)
- [\_messageQueue](browserSession.BrowserSession.md#_messagequeue)
- [\_messagingChannel](browserSession.BrowserSession.md#_messagingchannel)
- [\_playbackDelay](browserSession.BrowserSession.md#_playbackdelay)
- [\_streamingChannel](browserSession.BrowserSession.md#_streamingchannel)
- [\_tabManager](browserSession.BrowserSession.md#_tabmanager)
- [close](browserSession.BrowserSession.md#close)

### Accessors

- [\_currentPage](browserSession.BrowserSession.md#_currentpage)

### Methods

- [\_initialize](browserSession.BrowserSession.md#_initialize)
- [\_requestScreenshot](browserSession.BrowserSession.md#_requestscreenshot)
- [\_sendToClient](browserSession.BrowserSession.md#_sendtoclient)
- [\_signalCompletion](browserSession.BrowserSession.md#_signalcompletion)
- [\_signalError](browserSession.BrowserSession.md#_signalerror)
- [enqueueTask](browserSession.BrowserSession.md#enqueuetask)
- [processTasks](browserSession.BrowserSession.md#processtasks)

## Constructors

### constructor

• **new BrowserSession**(`messagingChannel`, `streamingChannel`)

**`summary`** BrowserSession constructor

**`description`** Stores given WS connections and binds the message event callbacks for both of them.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `messagingChannel` | `WebSocket` | WS connection for handling text commands. |
| `streamingChannel` | `WebSocket` | WS connection for handling image stream. |

#### Defined in

[browserSession.ts:56](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L56)

## Properties

### \_browser

• `Private` **\_browser**: `Browser` = `null`

Stores the internal Playwright Browser session.

#### Defined in

[browserSession.ts:23](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L23)

___

### \_messageQueue

• `Private` **\_messageQueue**: `WSMessage`<`Action`\>[] = `[]`

Stores pending tasks, used for task execution serialization.

#### Defined in

[browserSession.ts:32](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L32)

___

### \_messagingChannel

• `Private` **\_messagingChannel**: `WebSocket`

Websockets connection used for signalling and action scheduling.

#### Defined in

[browserSession.ts:43](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L43)

___

### \_playbackDelay

• `Private` **\_playbackDelay**: `number` = `1000`

Sets the minimal delay between two different tasks being executed.

Setting this to `null` disables additional delay (task execution will still wait for stable DOM state before executing next task).

#### Defined in

[browserSession.ts:38](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L38)

___

### \_streamingChannel

• `Private` **\_streamingChannel**: `WebSocket`

Websockets connection used for image data requests / transfer.

#### Defined in

[browserSession.ts:48](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L48)

___

### \_tabManager

• `Private` **\_tabManager**: [`TabManager`](tabManager.TabManager.md)

Handles tab and context management and page bootstrapping.

#### Defined in

[browserSession.ts:27](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L27)

___

### close

• **close**: `Function`

Public "destructor" for the browser session.

Closes the internal browser session, which allows for safe disposal of the BrowserSession object. Disposing the BrowserSession without calling close() beforehand causes a serious memory leak, as the Playwright Chromium subprocess continues to live indefinitely.

#### Defined in

[browserSession.ts:329](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L329)

## Accessors

### \_currentPage

• `Private` `get` **_currentPage**(): `Page`

Getter for extracting the current page (from the associated TabManager object) easily.

#### Returns

`Page`

#### Defined in

[browserSession.ts:67](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L67)

## Methods

### \_initialize

▸ `Private` **_initialize**(): `Promise`<`void`\>

Initializes the browser session, usually called at the very beginnning.

Spawns a new instance of the Chromium browser with a TabManager, binds all the necessary event listeners and opens a new (blank) tab - this also creates a new browser context.

#### Returns

`Promise`<`void`\>

#### Defined in

[browserSession.ts:76](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L76)

___

### \_requestScreenshot

▸ `Private` **_requestScreenshot**(`message`): `Promise`<`void`\>

Screenshot request handler - auto called by the web app (used mainly for scrolling functionality), not associated with the recordable screenshot action!

Reads the request message and tries to take a screenshot of the current webpage. If it succeeds, sends "completion response" to the client using the streaming connection, followed by the binary data with the screenshot itself.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `WSMessage`<`Object`\> | WSMessage with the screenNumber (how many full "PageDowns" is the requested screen located) |

#### Returns

`Promise`<`void`\>

#### Defined in

[browserSession.ts:110](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L110)

___

### \_sendToClient

▸ `Private` **_sendToClient**(...`data`): `void`

Helper function for sending any number of string messages to the connected client (using the associated _messagingChannel)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `...data` | `string`[] | String array to be sent to the client |

#### Returns

`void`

#### Defined in

[browserSession.ts:98](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L98)

___

### \_signalCompletion

▸ `Private` **_signalCompletion**(`message`, `channel?`): `void`

Helper function for signalling the completion of the message-related request.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `WSMessage`<`any`\> | Initial request message |
| `channel` | `WebSocket` | Optional, WS connection to send the message to. Default - messagingChannel. |

#### Returns

`void`

#### Defined in

[browserSession.ts:143](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L143)

___

### \_signalError

▸ `Private` **_signalError**(`message`, `e`, `channel?`): `void`

Helper function for error signalling during the message-related request.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `WSMessage`<`any`\> | Initial request message |
| `e` | `string` | Reason of the error |
| `channel` | `WebSocket` | Optional, WS connection to send the message to. Default - messagingChannel. |

#### Returns

`void`

#### Defined in

[browserSession.ts:130](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L130)

___

### enqueueTask

▸ **enqueueTask**(`task`): `void`

Enqueues new actions (messagingChannel message listener).

Pushes the new messages into the messageQueue, checks if processTasks() is already running - if not, it starts the processing.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `task` | `WSMessage`<`Action`\> | New task object |

#### Returns

`void`

#### Defined in

[browserSession.ts:317](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L317)

___

### processTasks

▸ `Private` **processTasks**(): `Promise`<`void`\>

Main action-executing method.

Takes the actions from the action queue and executes them according to the internal actionList - types.BrowserAction-keyed object with callback functions for values.
If any of the action functions throws, the exception gets relayed to the client via _signalError.

#### Returns

`Promise`<`void`\>

#### Defined in

[browserSession.ts:155](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/browserSession.ts#L155)
