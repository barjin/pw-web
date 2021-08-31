[pwww-server](../devdocs.md) / [Exports](../devdocs.md) / extractSelector

# Module: extractSelector

## Table of contents

### Enumerations

- [CharType](../enums/extractSelector.CharType.md)

### Classes

- [SelectorGenerator](../classes/extractSelector.SelectorGenerator.md)

### Functions

- [EuclideanDistanceSq](extractSelector.md#euclideandistancesq)
- [MarkovScore](extractSelector.md#markovscore)

## Functions

### EuclideanDistanceSq

▸ **EuclideanDistanceSq**(`vecA`, `vecB`): `number`

Calculates square of the Euclidean distance between two given vectors.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `vecA` | `number`[] | First vector |
| `vecB` | `number`[] | Second vector |

#### Returns

`number`

Squared Euclidean distance between the two vectors. Throws if the vectors are of different dimensions.

#### Defined in

[extractSelector.ts:68](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/extractSelector.ts#L68)

___

### MarkovScore

▸ **MarkovScore**(`input`): `number`

Calculates probability of the input being a human-readable string (using the Markov chain approach).

With an array input, the score is a product of scores of all the array items (gets reduced by a constant coefficient to punish long selectors).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `input` | `string` \| `string`[] | String or array of strings to be analyzed. |

#### Returns

`number`

Score on the 0 - 2 scale describing how human-readable the input is (bigger score - more likely to be a readable string)

#### Defined in

[extractSelector.ts:18](https://github.com/barjin/pw-web/blob/3b77b1a/pwww-server/src/extractSelector.ts#L18)
