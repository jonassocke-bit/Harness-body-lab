# Harness Body Lab v1.1

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

## v1.1 breast and gender fix

`Bust / Chest` was a circumference measurement target and therefore enlarged the entire
thorax. It has been renamed to `Chest circumference`.

Two genuine MakeHuman breast controls are now included:
- Breast size (mincup / averagecup / maxcup)
- Breast firmness (minfirmness / averagefirmness / maxfirmness)

The full adult-young female breast grid is blended against current Weight and Muscle.
MakeHuman has no file for averagecup + averagefirmness because that combination is the
neutral zero-delta state; v1.1 handles it as an empty target.

Breast target influence is multiplied by the female component of the Gender slider.
At fully Male, breast-specific targets contribute zero.
