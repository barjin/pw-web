[pwww-web](../README.md) / [Exports](../modules.md) / [ACKChannel](../modules/ACKChannel.md) / ACKChannel

# Class: ACKChannel

[ACKChannel](../modules/ACKChannel.md).ACKChannel

Simple helper class facilitating a "Request-Response" mechanism over WebSockets.

Uses promises to unify the standard "fetch-like" HTTP-approach and the bidirectional nature of WebSockets communication.

## Table of contents

### Constructors

- [constructor](ACKChannel.ACKChannel-1.md#constructor)

### Properties

- [\_WSChannel](ACKChannel.ACKChannel-1.md#_wschannel)
- [\_broadcastCallback](ACKChannel.ACKChannel-1.md#_broadcastcallback)
- [\_messageID](ACKChannel.ACKChannel-1.md#_messageid)
- [\_pendingActions](ACKChannel.ACKChannel-1.md#_pendingactions)

### Methods

- [addEventListener](ACKChannel.ACKChannel-1.md#addeventlistener)
- [messageReceiver](ACKChannel.ACKChannel-1.md#messagereceiver)
- [request](ACKChannel.ACKChannel-1.md#request)
- [send](ACKChannel.ACKChannel-1.md#send)

## Constructors

### constructor

• **new ACKChannel**(`wsChannel`, `broadcastCallback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `wsChannel` | `WebSocket` |
| `broadcastCallback` | (`arg0`: `Blob`) => `void` |

#### Defined in

[pwww-web/src/ACKChannel.ts:35](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/ACKChannel.ts#L35)

## Properties

### \_WSChannel

• `Private` **\_WSChannel**: `WebSocket`

The internal WebSocket connection.

#### Defined in

[pwww-web/src/ACKChannel.ts:29](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/ACKChannel.ts#L29)

___

### \_broadcastCallback

• `Private` **\_broadcastCallback**: (`arg0`: `Blob`) => `void`

The function called when an unrequested message comes (either has no responseID or has no match in the _pendingActions).

#### Type declaration

▸ (`arg0`): `void`

The function called when an unrequested message comes (either has no responseID or has no match in the _pendingActions).

##### Parameters

| Name | Type |
| :------ | :------ |
| `arg0` | `Blob` |

##### Returns

`void`

#### Defined in

[pwww-web/src/ACKChannel.ts:33](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/ACKChannel.ts#L33)

___

### \_messageID

• `Private` **\_messageID**: `number` = `0`

Global ACK message counter (used for generating unique message IDs sequentially)

#### Defined in

[pwww-web/src/ACKChannel.ts:12](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/ACKChannel.ts#L12)

___

### \_pendingActions

• `Private` **\_pendingActions**: { `messageID`: `number` ; `reject`: (`reason`: `any`) => `void` ; `resolve`: (`response`: `object`) => `void`  }[] = `[]`

List of pending messages (sent, but not confirmed by the server yet).

Every message record contains resolve and reject functions which either resolve or reject the associated promise.

#### Defined in

[pwww-web/src/ACKChannel.ts:19](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/ACKChannel.ts#L19)

## Methods

### addEventListener

▸ **addEventListener**(`type`, `listener`): `void`

Passthrough function for adding listeners to the underlying WebSocket channel.

Although useful, should be used with discretion, e.g. not for 'message' events, which are already handled by the messageReceiver method.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `type` | `string` | Event type to be listening to (conn, message...) |
| `listener` | (`event`: `Event`) => `void` | Listener (event handling) function. |

#### Returns

`void`

#### Defined in

[pwww-web/src/ACKChannel.ts:72](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/ACKChannel.ts#L72)

___

### messageReceiver

▸ `Private` **messageReceiver**(`message`): `void`

New message handler, if the message is a response for any pending request, the attached promise gets resolved with the incoming data.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `Object` | WS message object containing arbitrary data |
| `message.data` | `Blob` | - |

#### Returns

`void`

#### Defined in

[pwww-web/src/ACKChannel.ts:80](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/ACKChannel.ts#L80)

___

### request

▸ **request**(`data`): `Promise`<`object`\>

Method for sending data, expecting ACK message (or other kind of response)

Returns thenable promise, which hugely simplifies the usage of WebSockets channel with the classic Request-Response approach.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `object` | Arbitrary (serializable) data to be sent over the WebSockets channel. |

#### Returns

`Promise`<`object`\>

Promise gets resolved with the response object (after the response arrives).

#### Defined in

[pwww-web/src/ACKChannel.ts:48](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/ACKChannel.ts#L48)

___

### send

▸ **send**(`data`): `void`

Method for sending data without waiting for ACK (or any other response)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `object` | Arbitrary (serializable) data to be sent over the WebSockets channel. |

#### Returns

`void`

#### Defined in

[pwww-web/src/ACKChannel.ts:61](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/ACKChannel.ts#L61)
