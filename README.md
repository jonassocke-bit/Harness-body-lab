# Harness Body Lab v2.2 MAX

This build extracts the body-relevant MakeHuman 1.3.0 modifier catalog instead of hand-picking sliders.

## Included
- 7 core controls: Gender, Weight, Muscle, Height, Body Proportions, Breast Size, Breast Firmness
- 142 direct body modifiers from the official MakeHuman JSON definitions
- Groups: neck, torso, hip, stomach, buttocks, pelvis, armslegs, breast, genitals, measurements, body shapes

Total visible controls: 149

Face/head/eyes/nose/mouth/ears are deliberately excluded because they do not affect harness fitting.
They can be added later from the same source data without changing the engine.

## UI
- Bottom sheet does not snap; it remains exactly where released.
- Sheet content scrolls independently.
- Groups are collapsible.
- Search filters parameters and automatically opens matching groups.

## Files
Upload all flat files to the GitHub repository root:
- index.html
- style.css
- app.js
- base.obj
- modifier-config.js
- labels.js
- body-morphs.js
- macro-morphs.js

All MakeHuman mesh/target data in this test comes from the user-supplied MakeHuman v1.3.0 source archive.


## v2.1 Overdrive ranges

Every direct MakeHuman body modifier can now be extrapolated beyond the original -100% / +100% range.

Tap the percentage value on the right side of a detail slider to open its local range editor.
Example:

- Min: -100
- Max: 140

The slider then runs from -100% to +140%, and the MakeHuman target delta is multiplied by up to 1.4.

Allowed test range is clamped to -500% .. +500% as a safety guardrail.

The seven high-level macro controls (Gender, Weight, Muscle, Height, Body Proportions,
Breast Size, Breast Firmness) keep their native MakeHuman interpolation ranges because
their endpoints are semantic macro states rather than simple single-target deltas.

## v2.2 — all controls overdrive

The editable Min/Max range is now enabled for all controls, including the seven core macros.

For macro controls, values outside their native MakeHuman 0..100 range are extrapolation tests,
not native MakeHuman states. This is intentionally exposed so the useful limits can be explored.

Gender interpretation:
- 0 = female macro endpoint
- 50 = equal female/male macro blend
- 100 = male macro endpoint
- below 0 / above 100 = experimental extrapolation of the corresponding endpoint

Gender changes the whole conditioned macro body target, not only breasts or genitals.
Breast-specific female targets are additionally faded toward zero as Gender approaches male.
