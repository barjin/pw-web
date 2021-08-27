[pwww-web](../README.md) / [Exports](../modules.md) / components/side_bar

# Module: components/side\_bar

## Table of contents

### Functions

- [CodeBlock](components_side_bar.md#codeblock)
- [CodeEditModal](components_side_bar.md#codeeditmodal)
- [CodeList](components_side_bar.md#codelist)
- [DownloadModal](components_side_bar.md#downloadmodal)
- [SideBar](components_side_bar.md#sidebar)

## Functions

### CodeBlock

▸ **CodeBlock**(`props`): `Element`

Single code block as a functional React component

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | `Object` | React props object contianing event handlers, as well as other code-block related data (action title, active indicator, error message etc.) |
| `props.action` | `types.Action` | The recorded action represented by this block |
| `props.active` | `boolean` | During playback, this determines whether this block is being currently run. |
| `props.deleteBlock` | `MouseEventHandler`<`HTMLElement`\> | Block removal handler. |
| `props.dragDrop` | `DragEventHandler` | Drag drop event handler |
| `props.dragOver` | `DragEventHandler` | Drag over event handler |
| `props.dragStart` | `DragEventHandler` | Drag start event handler |
| `props.editBlock` | `MouseEventHandler`<`HTMLElement`\> | Block editing handler. |
| `props.error` | `string` | In case of an error contains string with the error message. |
| `props.idx` | `number` | Index of this block in the whole recording. |
| `props.scrollRef` | `React.MutableRefObject`<``null``\> \| ``null`` | React ref for scrolling the currently active action to view during playback. |
| `props.toggleInfo` | `MouseEventHandler`<`HTMLElement`\> | Hover over the error explain button handler |

#### Returns

`Element`

The rendered code block.

#### Defined in

[pwww-web/src/components/side_bar.tsx:226](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/components/side_bar.tsx#L226)

___

### CodeEditModal

▸ **CodeEditModal**(`props`): `Element`

Modal for code block editing as a functional React component

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | `Object` | React props object containing currently edited code block details etc. |
| `props.action` | `types.Action` | Current action being edited. |
| `props.closeSelf` | `Function` | Callback function to set the modal's visibility to false. |
| `props.editAction` | `Function` | Callback function to edit the action higher up (where the recording is stored). |
| `props.showModal` | `boolean` | Boolean value determining the visibility of the modal. |

#### Returns

`Element`

The rendered modal.

#### Defined in

[pwww-web/src/components/side_bar.tsx:323](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/components/side_bar.tsx#L323)

___

### CodeList

▸ **CodeList**(`props`): `JSX.Element`

Side bar as a functional React component.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | `Object` | React props object containing current recording state (which is being stored higher up), recording modifiers and recording control callback. |
| `props.recordingModifier` | `SideBarProps`[``"recordingModifier"``] | - |
| `props.recordingState` | `SideBarProps`[``"recordingState"``] | - |

#### Returns

`JSX.Element`

The rendered sidebar.

#### Defined in

[pwww-web/src/components/side_bar.tsx:145](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/components/side_bar.tsx#L145)

___

### DownloadModal

▸ **DownloadModal**(`props`): `JSX.Element`

Recording Export/Download modal as a functional React component.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | `IDownloadModalProps` | Download modal props (mostly boolean show/hide and some necessary callbacks). |

#### Returns

`JSX.Element`

The rendered download modal.

#### Defined in

[pwww-web/src/components/side_bar.tsx:48](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/components/side_bar.tsx#L48)

___

### SideBar

▸ **SideBar**(`props`): `JSX.Element`

Side bar as a functional React component.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | `SideBarProps` | React props object containing current recording state (which is being stored higher up), recording modifiers and recording control callback. |

#### Returns

`JSX.Element`

The rendered sidebar.

#### Defined in

[pwww-web/src/components/side_bar.tsx:107](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/components/side_bar.tsx#L107)
