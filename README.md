# Harness Body Lab v1

Flat GitHub Pages build. Upload these files to the repository root:

- index.html
- style.css
- app.js
- morph-data.js
- base.obj

## Morph system
The adult body macro uses 18 genuine MakeHuman `macrodetails/universal-*young*`
targets and trilinear blending across:
- female ↔ male
- min / average / max muscle
- min / average / max weight

Fine controls use genuine MakeHuman detail/measure targets.

`Proportionen koppeln` is an additional Harness Body Lab convenience layer. Its neighbour
correlation coefficients are heuristic and deliberately modest. It can be disabled or its
strength changed. The whole-body Weight/Muscle/Gender correlation itself is MakeHuman data.

## UI
The bottom sheet does not snap. Drag the handle and release it anywhere; it stays at the
release position. The contents inside the sheet scroll independently.
