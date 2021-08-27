[pwww-server](../README.md) / [Exports](../modules.md) / [tabManager](../modules/tabManager.md) / TabManager

# Class: TabManager

[tabManager](../modules/tabManager.md).TabManager

Class for handling the browser tab management.

## Hierarchy

- `EventEmitter`

  ↳ **`TabManager`**

## Table of contents

### Constructors

- [constructor](tabManager.TabManager.md#constructor)

### Properties

- [\_browser](tabManager.TabManager.md#_browser)
- [\_injections](tabManager.TabManager.md#_injections)
- [currentPage](tabManager.TabManager.md#currentpage)

### Accessors

- [\_pages](tabManager.TabManager.md#_pages)

### Methods

- [\_pageBootstrapper](tabManager.TabManager.md#_pagebootstrapper)
- [closeTab](tabManager.TabManager.md#closetab)
- [injectToAll](tabManager.TabManager.md#injecttoall)
- [listAllTabs](tabManager.TabManager.md#listalltabs)
- [newTab](tabManager.TabManager.md#newtab)
- [notifyStateChange](tabManager.TabManager.md#notifystatechange)
- [recycleContext](tabManager.TabManager.md#recyclecontext)
- [switchTabs](tabManager.TabManager.md#switchtabs)

## Constructors

### constructor

• **new TabManager**(`browser`)

Constructor for the TabManager class

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `browser` | `Browser` | Sessions Playwright Browser object |

#### Overrides

EventEmitter.constructor

#### Defined in

[tabManager.ts:26](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/tabManager.ts#L26)

## Properties

### \_browser

• `Private` **\_browser**: `Browser`

Associated Playwright Browser object.

#### Defined in

[tabManager.ts:12](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/tabManager.ts#L12)

___

### \_injections

• `Private` **\_injections**: (`Function` \| { `path`: `string`  })[] = `[]`

Functions or paths to scripts to be injected to every new page.

#### Defined in

[tabManager.ts:16](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/tabManager.ts#L16)

___

### currentPage

• **currentPage**: `Page`

Playwright Page object exposing the currently selected page.

#### Defined in

[tabManager.ts:20](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/tabManager.ts#L20)

## Accessors

### \_pages

• `Private` `get` **_pages**(): `Page`[]

Getter method for listing all the managed tabs (Playwright Page objects) in all contexts.

#### Returns

`Page`[]

List of currently active tabs / pages.

#### Defined in

[tabManager.ts:35](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/tabManager.ts#L35)

## Methods

### \_pageBootstrapper

▸ `Private` **_pageBootstrapper**(`page`): `Promise`<`void`\>

Helper method to sideload scripts into a new page as well as bind some listeners and introduce the "tabName" member variable into the page (for easier tab name retrieval).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `page` | `Page` | Current page to be bootstrapped. |

#### Returns

`Promise`<`void`\>

Promise gets resolved after the given page is bootstrapped with the specified scripts.

#### Defined in

[tabManager.ts:53](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/tabManager.ts#L53)

___

### closeTab

▸ **closeTab**(`idx`): `Promise`<`void`\>

Closes the specified page. Handles possible termination of the current page, changes current page id accordingly.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `idx` | `number` \| `Page` | id of the page to be closed (index in the _pages array) or the Page object itself. |

#### Returns

`Promise`<`void`\>

Promise, gets resolved when the page is successfully closed.

#### Defined in

[tabManager.ts:138](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/tabManager.ts#L138)

___

### injectToAll

▸ **injectToAll**(`arg`): `Promise`<`void`\>

Injects the specified function/script to all the active pages, stores it in the _injections array for the future pages (to be used during bootstrapping).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `arg` | `Function` \| { `path`: `string`  } | Function (or path to the script file) to be injected |

#### Returns

`Promise`<`void`\>

Promise, gets resolved when all the existing pages have been reloaded with the new script injected.

#### Defined in

[tabManager.ts:168](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/tabManager.ts#L168)

___

### listAllTabs

▸ **listAllTabs**(): `any`

Gets the current state of the browser tabs (current tab id and list of tab titles).

#### Returns

`any`

List of open tabs and the current tab id.

#### Defined in

[tabManager.ts:81](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/tabManager.ts#L81)

___

### newTab

▸ **newTab**(`url?`): `Promise`<`void`\>

Opens up a new page in the last existing (running) context. If there is no running context, it gets created with some default options.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `url?` | `string` | Optional - url to open the page with. |

#### Returns

`Promise`<`void`\>

Promise gets resolved after the new page is open, bootstrapped and on the specified URL (if applicable).

#### Defined in

[tabManager.ts:115](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/tabManager.ts#L115)

___

### notifyStateChange

▸ `Private` **notifyStateChange**(): `void`

Helper method for emiting the "tabsUpdate" event (listened to by BrowserSession) with the list of all tabs.

#### Returns

`void`

#### Defined in

[tabManager.ts:44](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/tabManager.ts#L44)

___

### recycleContext

▸ **recycleContext**(): `Promise`<`void`\>

Closes all the current browser contexts and opens up a blank page.

#### Returns

`Promise`<`void`\>

Promise gets resolved after the blank page is open.

#### Defined in

[tabManager.ts:100](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/tabManager.ts#L100)

___

### switchTabs

▸ **switchTabs**(`newTab`): `void`

Changes the currentPage.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `newTab` | `number` | index of the new tab in the _pages array |

#### Returns

`void`

#### Defined in

[tabManager.ts:183](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/tabManager.ts#L183)
