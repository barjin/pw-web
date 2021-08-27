[pwww-shared](../README.md) / [Exports](../modules.md) / Transpiler

# Class: Transpiler

Base Transpiler class

Used to generate executable JS code from an array of PWWW actions.

## Hierarchy

- **`Transpiler`**

  ↳ [`ApifyTranspiler`](ApifyTranspiler.md)

## Table of contents

### Constructors

- [constructor](Transpiler.md#constructor)

### Properties

- [actions](Transpiler.md#actions)
- [footer](Transpiler.md#footer)
- [header](Transpiler.md#header)
- [screenshotID](Transpiler.md#screenshotid)

### Methods

- [translate](Transpiler.md#translate)

## Constructors

### constructor

• **new Transpiler**()

## Properties

### actions

• `Protected` **actions**: `Object`

Object with BrowserAction types for keys and string generating functions for values.

The functions accept action objects and use the action specific data to generate equivalent code.

#### Index signature

▪ [key: `string`]: (`data`: `any`) => `string`

#### Defined in

[jsTranspiler.ts:42](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-shared/jsTranspiler.ts#L42)

___

### footer

• `Protected` **footer**: `string`

Ending of the generated file stored as a string.

#### Defined in

[jsTranspiler.ts:74](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-shared/jsTranspiler.ts#L74)

___

### header

• `Protected` **header**: `string`

Header of the generated file stored as a string.

#### Defined in

[jsTranspiler.ts:29](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-shared/jsTranspiler.ts#L29)

___

### screenshotID

• **screenshotID**: `number` = `0`

#### Defined in

[jsTranspiler.ts:24](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-shared/jsTranspiler.ts#L24)

## Methods

### translate

▸ **translate**(`recording`): `Blob`

The main transpiler method, returns transpiled code as a text/plain blob.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `recording` | `Action`[] | Array of action "blocks" |

#### Returns

`Blob`

The transpiled recording (.js source code) as a text/plain Blob .

#### Defined in

[jsTranspiler.ts:85](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-shared/jsTranspiler.ts#L85)
