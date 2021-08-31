[pwww-web](../devdocs.md) / [Exports](../devdocs.md) / restAPI

# Module: restAPI

## Table of contents

### Functions

- [getAPI](restAPI.md#getapi)
- [postAPI](restAPI.md#postapi)

## Functions

### getAPI

▸ **getAPI**(`endpoint`): `Promise`<`types.APIResponse`<`object`\>\>

Helper function for simplifying the POST GET API requests.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `endpoint` | `string` | API endpoint (only the "updateRecording", "newRecording" etc. part - i.e. without the hostname nor /api) |

#### Returns

`Promise`<`types.APIResponse`<`object`\>\>

The promise gets resolved with the incoming object after the response arrival. If the response is {ok: false}, the promise gets rejected (throws).

#### Defined in

[pwww-web/src/restAPI.ts:31](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/restAPI.ts#L31)

___

### postAPI

▸ **postAPI**(`endpoint`, `body`): `Promise`<`types.APIResponse`<`object`\>\>

Helper function for simplifying the POST REST API requests.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `endpoint` | `string` | API endpoint (only the "updateRecording", "newRecording" etc. part - i.e. without the hostname nor /api) |
| `body` | `object` | Serializable object to be used as the POST request body |

#### Returns

`Promise`<`types.APIResponse`<`object`\>\>

The promise gets resolved with the incoming object after the response arrival. If the response is {ok: false}, the promise gets rejected (throws).

#### Defined in

[pwww-web/src/restAPI.ts:11](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/restAPI.ts#L11)
