# Harness Body Lab v2 MAX

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
