[pwww-server](../devdocs.md) / [Exports](../devdocs.md) / [http-server/server_v2](../modules/http_server_server_v2.md) / HTTPServer

# Class: HTTPServer

[http-server/server_v2](../modules/http_server_server_v2.md).HTTPServer

Base HTTP server object

## Table of contents

### Constructors

- [constructor](http_server_server_v2.HTTPServer.md#constructor)

### Properties

- [\_apiHandler](http_server_server_v2.HTTPServer.md#_apihandler)

### Methods

- [StartServer](http_server_server_v2.HTTPServer.md#startserver)

## Constructors

### constructor

• **new HTTPServer**()

## Properties

### \_apiHandler

• `Private` **\_apiHandler**: [`APIHandler`](http_server_server_v2.APIHandler.md)

API Handler object handling REST API requests.

#### Defined in

[http-server/server_v2.ts:250](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/http-server/server_v2.ts#L250)

## Methods

### StartServer

▸ **StartServer**(`port?`): `void`

Start function for the Express.js HTTP server.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `port` | `number` | `8000` | Port to start the Express.js HTTP server at. |

#### Returns

`void`

#### Defined in

[http-server/server_v2.ts:256](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/http-server/server_v2.ts#L256)
