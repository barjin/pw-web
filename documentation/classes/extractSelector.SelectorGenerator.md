[pwww-server](../README.md) / [Exports](../modules.md) / [extractSelector](../modules/extractSelector.md) / SelectorGenerator

# Class: SelectorGenerator

[extractSelector](../modules/extractSelector.md).SelectorGenerator

Main class for generating Playwright selectors by analyzing the element and its attributes and relations in the DOM tree.

## Table of contents

### Constructors

- [constructor](extractSelector.SelectorGenerator.md#constructor)

### Methods

- [GetSelectorSemantic](extractSelector.SelectorGenerator.md#getselectorsemantic)
- [GetSelectorStructural](extractSelector.SelectorGenerator.md#getselectorstructural)
- [\_isUniqueCss](extractSelector.SelectorGenerator.md#_isuniquecss)
- [getNodeInfo](extractSelector.SelectorGenerator.md#getnodeinfo)
- [grabElementFromPoint](extractSelector.SelectorGenerator.md#grabelementfrompoint)

## Constructors

### constructor

• **new SelectorGenerator**()

#### Defined in

[extractSelector.ts:103](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/extractSelector.ts#L103)

## Methods

### GetSelectorSemantic

▸ `Private` **GetSelectorSemantic**(`element`): `string`

Generates semantical selector (describing element by its attributes and properties).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `element` | `HTMLElement` | Element being described. |

#### Returns

`string`

Playwright style selector describing the given element based on its properties.

#### Defined in

[extractSelector.ts:196](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/extractSelector.ts#L196)

___

### GetSelectorStructural

▸ `Private` **GetSelectorStructural**(`element`): `string`

Generates structural selector (describing element by its DOM tree location).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `element` | `Element` | Element being described. |

#### Returns

`string`

CSS-compliant selector describing the element's location in the DOM tree.

#### Defined in

[extractSelector.ts:163](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/extractSelector.ts#L163)

___

### \_isUniqueCss

▸ `Private` **_isUniqueCss**(`selector`, `root?`): `boolean`

Tests if the (CSS) selector targets unique element on the current page.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `selector` | `string` | String with the generated selector |
| `root` | `ParentNode` | - |

#### Returns

`boolean`

True if unique, false otherwise (the selector targets more than one element).

#### Defined in

[extractSelector.ts:112](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/extractSelector.ts#L112)

___

### getNodeInfo

▸ **getNodeInfo**(`element`): `Object`

Generates semantic selector, structural selector and tagname for the element (node).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `element` | `Node` | DOM tree node being analysed. |

#### Returns

`Object`

Object containing all the available data about the input Node.

| Name | Type |
| :------ | :------ |
| `semanticalSelector` | `string` |
| `structuralSelector` | `string` |
| `tagName` | `string` |

#### Defined in

[extractSelector.ts:144](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/extractSelector.ts#L144)

___

### grabElementFromPoint

▸ **grabElementFromPoint**(`x`, `y`): `Element`

Grabs the topmost element on the specified coordinates.
If the coordinates are not in the current viewport, the page gets scrolled (the document.elementFromPoint would return null for out of screen elements).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `x` | `number` | x click coordinate |
| `y` | `number` | y click coordinate |

#### Returns

`Element`

Topmost element on the specified coordinates.

#### Defined in

[extractSelector.ts:129](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/extractSelector.ts#L129)
