# Harness-oriented target map

## Verified exact MakeHuman macro modifier names

These names are directly present in MakeHuman's `Human` API:

| Harness UI | MakeHuman modifier |
|---|---|
| Gender | `macrodetails/Gender` |
| Weight | `macrodetails-universal/Weight` |
| Muscle | `macrodetails-universal/Muscle` |
| Height | `macrodetails-height/Height` |
| Proportions | `macrodetails-proportions/BodyProportions` |
| Breast size | `breast/BreastSize` |
| Breast firmness | `breast/BreastFirmness` |

MakeHuman documents Gender as a continuous value where 0 is female and 1 is male, and Weight/Muscle/Height as continuous macro dimensions.

## Detail groups observed in real MakeHuman model data

MakeHuman issue/model output exposes detail modifier families including:

- `hip/...`
- `buttocks/buttocks-volume-decr|incr`
- `pelvis/...`

Example observed hip modifiers include:

- `hip/hip-scale-horiz-decr|incr`
- `hip/hip-trans-down|up`
- `hip/hip-waist-down|up`

These are useful evidence that the fine-grained topology we want exists, but **do not treat this document as a complete filename catalogue**.

## UI sliders recommended for Harness Designer

### Core
- Gender
- Height
- Weight / body fat
- Muscle
- Global body proportions

### Torso
- Shoulder width
- Chest circumference/depth
- Breast size
- Breast firmness/shape
- Waist circumference
- Belly/abdomen

### Pelvis
- Hip width/circumference
- Pelvis height
- Buttocks volume/projection

### Limbs
- Upper-arm circumference
- Forearm circumference
- Thigh circumference
- Calf circumference

## Architecture rule

The UI should expose **semantic sliders**. Each semantic slider can mix multiple MakeHuman target files. Harness geometry should bind to the deformed common topology, not to absolute XYZ positions.
