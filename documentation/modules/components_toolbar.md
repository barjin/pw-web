[pwww-web](../devdocs.md) / [Exports](../devdocs.md) / components/toolbar

# Module: components/toolbar

## Table of contents

### Functions

- [BrowserTab](components_toolbar.md#browsertab)
- [TabBar](components_toolbar.md#tabbar)
- [ToolBar](components_toolbar.md#toolbar)

## Functions

### BrowserTab

▸ **BrowserTab**(`props`): `Element`

Single browser tab as a functional React component.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | `IBrowserTabProps` | React props object containing tab data (title, id...) as well as click and close handlers. |

#### Returns

`Element`

The rendered browser tab.

#### Defined in

[pwww-web/src/components/toolbar.tsx:83](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/components/toolbar.tsx#L83)

___

### TabBar

▸ **TabBar**(`props`): `Element`

Tab Bar as a functional React component.

Encapsulates multiple BrowserTab elements and renders them in line, passing the callback functions into them.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | `ITabBarProps` | React props object containing tab state and callbacks for tab management. |

#### Returns

`Element`

The rendered tab bar.

#### Defined in

[pwww-web/src/components/toolbar.tsx:106](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/components/toolbar.tsx#L106)

___

### ToolBar

▸ **ToolBar**(`props`): `Element`

Functional React component containing the upper browser toolbar (list of open tabs, address bar, go back/ go forward buttons).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | `ToolBarProps` | Reacts props object containing the tab state and navigation function for browsing and back/forward navigation |

#### Returns

`Element`

The rendered toolbar.

#### Defined in

[pwww-web/src/components/toolbar.tsx:24](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-web/src/components/toolbar.tsx#L24)
