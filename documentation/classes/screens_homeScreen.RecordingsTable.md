[pwww-web](../README.md) / [Exports](../modules.md) / [screens/homeScreen](../modules/screens_homeScreen.md) / RecordingsTable

# Class: RecordingsTable

[screens/homeScreen](../modules/screens_homeScreen.md).RecordingsTable

React class component representing the main menu recordings table.

## Hierarchy

- `Component`<`IEmpty`, `IRecordingsTableState`\>

  ↳ **`RecordingsTable`**

## Table of contents

### Constructors

- [constructor](screens_homeScreen.RecordingsTable.md#constructor)

### Properties

- [columns](screens_homeScreen.RecordingsTable.md#columns)

### Methods

- [addNewRecording](screens_homeScreen.RecordingsTable.md#addnewrecording)
- [deleteRecording](screens_homeScreen.RecordingsTable.md#deleterecording)
- [loadRecordings](screens_homeScreen.RecordingsTable.md#loadrecordings)
- [renameRecording](screens_homeScreen.RecordingsTable.md#renamerecording)

## Constructors

### constructor

• **new RecordingsTable**(`props`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `props` | `IEmpty` |

#### Overrides

Component&lt;IEmpty,IRecordingsTableState\&gt;.constructor

#### Defined in

[pwww-web/src/screens/homeScreen.tsx:25](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/homeScreen.tsx#L25)

## Properties

### columns

• **columns**: `String`[]

The table column headers.

#### Defined in

[pwww-web/src/screens/homeScreen.tsx:23](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/homeScreen.tsx#L23)

## Methods

### addNewRecording

▸ **addNewRecording**(): `void`

New recording button callback method.

Prompts the user for the new recording's name, then sends a POST request to the according REST API endpoint. If successful, reloads the table's content.

#### Returns

`void`

#### Defined in

[pwww-web/src/screens/homeScreen.tsx:77](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/homeScreen.tsx#L77)

___

### deleteRecording

▸ **deleteRecording**(`recordingId`): `void`

Delete button callback method.

Asks the user to confirm their decision, then sends a POST request to the according REST API endpoint. If successful, reloads the table's content.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `recordingId` | `number` | ID of the recording being deleted |

#### Returns

`void`

#### Defined in

[pwww-web/src/screens/homeScreen.tsx:91](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/homeScreen.tsx#L91)

___

### loadRecordings

▸ **loadRecordings**(): `void`

Helper method for simple recordings reload.

Sends a GET request to the REST API, updates React state accordingly.

#### Returns

`void`

#### Defined in

[pwww-web/src/screens/homeScreen.tsx:38](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/homeScreen.tsx#L38)

___

### renameRecording

▸ **renameRecording**(`recordingId`): `void`

Rename button callback method.

Prompts the user for the new recording's name, then sends a POST request to the according REST API endpoint. If successful, reloads the table's content.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `recordingId` | `number` | ID of the recording being renamed |

#### Returns

`void`

#### Defined in

[pwww-web/src/screens/homeScreen.tsx:63](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/screens/homeScreen.tsx#L63)

___