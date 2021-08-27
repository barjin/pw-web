[pwww-shared](../README.md) / [Exports](../modules.md) / ApifyTranspiler

# Class: ApifyTranspiler

Apify environment specific transpiler

Uses Apify-specific functions and environment variables (mainly) to faciliate storing output data on the Apify platform.

## Hierarchy

- [`Transpiler`](Transpiler.md)

  ↳ **`ApifyTranspiler`**

## Table of contents

### Constructors

- [constructor](ApifyTranspiler.md#constructor)

### Properties

- [actions](ApifyTranspiler.md#actions)
- [footer](ApifyTranspiler.md#footer)
- [header](ApifyTranspiler.md#header)
- [screenshotID](ApifyTranspiler.md#screenshotid)

### Methods

- [translate](ApifyTranspiler.md#translate)

## Constructors

### constructor

• **new ApifyTranspiler**()

#### Overrides

[Transpiler](Transpiler.md).[constructor](Transpiler.md#constructor)

#### Defined in

[jsTranspiler.ts:110](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-shared/jsTranspiler.ts#L110)

## Properties

### actions

• `Protected` **actions**: `Object`

Object with BrowserAction types for keys and string generating functions for values.

The functions accept action objects and use the action specific data to generate equivalent code.

#### Index signature

▪ [key: `string`]: (`data`: `any`) => `string`

#### Inherited from

[Transpiler](Transpiler.md).[actions](Transpiler.md#actions)

#### Defined in

[jsTranspiler.ts:42](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-shared/jsTranspiler.ts#L42)

___

### footer

• `Protected` **footer**: `string`

Ending of the generated file stored as a string.

#### Inherited from

[Transpiler](Transpiler.md).[footer](Transpiler.md#footer)

#### Defined in

[jsTranspiler.ts:74](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-shared/jsTranspiler.ts#L74)

___

### header

• `Protected` **header**: `string`

Header of the generated file stored as a string.

#### Inherited from

[Transpiler](Transpiler.md).[header](Transpiler.md#header)

#### Defined in

[jsTranspiler.ts:29](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-shared/jsTranspiler.ts#L29)

___

### screenshotID

• **screenshotID**: `number` = `0`

#### Overrides

[Transpiler](Transpiler.md).[screenshotID](Transpiler.md#screenshotid)

#### Defined in

[jsTranspiler.ts:108](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-shared/jsTranspiler.ts#L108)

## Methods

### translate

▸ **translate**(`recording`): `Blob`

Apify Platform specific implementation of the Transpiler.translate() method.

Logs https links to the taken screenshots for easier access.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `recording` | `Action`[] | Recording, array of action blocks |

#### Returns

`Blob`

The transpiled recording (.js source code) as a text/plain Blob.

#### Overrides

[Transpiler](Transpiler.md).[translate](Transpiler.md#translate)

#### Defined in

[jsTranspiler.ts:168](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-shared/jsTranspiler.ts#L168)
