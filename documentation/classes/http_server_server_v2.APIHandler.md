[pwww-server](../devdocs.md) / [Exports](../devdocs.md) / [http-server/server_v2](../modules/http_server_server_v2.md) / APIHandler

# Class: APIHandler

[http-server/server_v2](../modules/http_server_server_v2.md).APIHandler

Helper class, encapsulates the REST API related methods (routers, request handlers etc.)

## Table of contents

### Constructors

- [constructor](http_server_server_v2.APIHandler.md#constructor)

### Methods

- [\_deleteRecording](http_server_server_v2.APIHandler.md#_deleterecording)
- [\_error](http_server_server_v2.APIHandler.md#_error)
- [\_getRecording](http_server_server_v2.APIHandler.md#_getrecording)
- [\_listRecordings](http_server_server_v2.APIHandler.md#_listrecordings)
- [\_newRecording](http_server_server_v2.APIHandler.md#_newrecording)
- [\_postOKCallback](http_server_server_v2.APIHandler.md#_postokcallback)
- [\_renameRecording](http_server_server_v2.APIHandler.md#_renamerecording)
- [\_sendJSONData](http_server_server_v2.APIHandler.md#_sendjsondata)
- [\_updateRecording](http_server_server_v2.APIHandler.md#_updaterecording)
- [routeAPIGetRequest](http_server_server_v2.APIHandler.md#routeapigetrequest)
- [routeAPIPostRequest](http_server_server_v2.APIHandler.md#routeapipostrequest)

## Constructors

### constructor

• **new APIHandler**()

#### Defined in

[http-server/server_v2.ts:10](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/http-server/server_v2.ts#L10)

## Methods

### \_deleteRecording

▸ `Private` **_deleteRecording**(`req`, `res`): `void`

POST request handler for the /api/deleteRecording endpoint.

Reads the file id from the "id" field of the request body, tries to delete the specified file.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `req` | `any` | Express.js request object |
| `res` | `any` | Express.js response object |

#### Returns

`void`

#### Defined in

[http-server/server_v2.ts:140](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/http-server/server_v2.ts#L140)

___

### \_error

▸ `Private` **_error**(`res`, `reason`): `void`

Helper function to signalize error over HTTP.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `res` | `any` | Express.js response object. |
| `reason` | `any` | Serializable data (preferably string) describing the error. |

#### Returns

`void`

#### Defined in

[http-server/server_v2.ts:31](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/http-server/server_v2.ts#L31)

___

### \_getRecording

▸ `Private` **_getRecording**(`req`, `res`): `void`

GET request handler for /api/recording?id=ID endpoint.

Extracts the recording id from the request's query string, parses the ID and tries to return the content over HTTP

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `req` | `any` | Express.js request object |
| `res` | `any` | Express.js response object |

#### Returns

`void`

#### Defined in

[http-server/server_v2.ts:68](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/http-server/server_v2.ts#L68)

___

### \_listRecordings

▸ `Private` **_listRecordings**(`res`): `void`

GET request handler for /api/recordings endpoint.

Sends list of the paths.savePath folder contents via HTTP (using given response object).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `res` | `any` | Express.js response object |

#### Returns

`void`

#### Defined in

[http-server/server_v2.ts:44](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/http-server/server_v2.ts#L44)

___

### \_newRecording

▸ `Private` **_newRecording**(`req`, `res`): `void`

POST request handler for the /api/newRecording endpoint.

Reads the file's name from the "name" field of the request body, parses (and somewhat sanitizes) this string and tries to create a new file with this name. Performs several checks (existing file etc.)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `req` | `any` | Express.js request object |
| `res` | `any` | Express.js response object |

#### Returns

`void`

#### Defined in

[http-server/server_v2.ts:158](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/http-server/server_v2.ts#L158)

___

### \_postOKCallback

▸ `Private` **_postOKCallback**(`res`): (`error`: `any`) => `void`

Helper function for signalling completion of (or error during) a POST request.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `res` | `any` | Express.js response object |

#### Returns

`fn`

A callback function accepting error object (compliant with the async fs functions callback semantics).

▸ (`error`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `any` |

##### Returns

`void`

#### Defined in

[http-server/server_v2.ts:101](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/http-server/server_v2.ts#L101)

___

### \_renameRecording

▸ `Private` **_renameRecording**(`req`, `res`): `void`

POST request handler for the /api/renameRecording endpoint.

Reads the file id from the "id" field and the desired name from the "newName" field of the request body, tries to rename the file accordingly.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `req` | `any` | Express.js request object |
| `res` | `any` | Express.js response object |

#### Returns

`void`

#### Defined in

[http-server/server_v2.ts:119](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/http-server/server_v2.ts#L119)

___

### \_sendJSONData

▸ `Private` **_sendJSONData**(`res`, `data`): `void`

Helper function to encapsulate the data into a JSON object with an "ok header" and send them via HTTP.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `res` | `any` | Express.js response object. |
| `data` | `object` | Data to be sent. |

#### Returns

`void`

#### Defined in

[http-server/server_v2.ts:17](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/http-server/server_v2.ts#L17)

___

### \_updateRecording

▸ `Private` **_updateRecording**(`req`, `res`): `void`

POST request handler for the /api/updateRecording endpoint.

Reads the file's name from the "name" field and new contents from the "actions" field of the request, and writes this content into the file (overwrites potential existing files).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `req` | `any` | Express.js request object |
| `res` | `any` | Express.js response object |

#### Returns

`void`

#### Defined in

[http-server/server_v2.ts:178](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/http-server/server_v2.ts#L178)

___

### routeAPIGetRequest

▸ **routeAPIGetRequest**(`req`, `res`): `void`

GET requests router function.

Reads the request path and routes the request to according functions.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `req` | `any` | Express.js request object |
| `res` | `any` | Express.js response object |

#### Returns

`void`

#### Defined in

[http-server/server_v2.ts:197](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/http-server/server_v2.ts#L197)

___

### routeAPIPostRequest

▸ **routeAPIPostRequest**(`req`, `res`): `void`

POST requests router function.

Reads the request path and routes the request to according functions.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `req` | `any` | Express.js request object |
| `res` | `any` | Express.js response object |

#### Returns

`void`

#### Defined in

[http-server/server_v2.ts:220](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/http-server/server_v2.ts#L220)
