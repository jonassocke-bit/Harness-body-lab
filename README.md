# Harness Body Lab v2.6.2 — exact MakeHuman macro stack

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

## v2.3 — global ranges and sheet fixes

- Global Min % / Max % fields apply the same range to every visible parameter at once.
- Individual parameter ranges can still be edited afterward.
- The bottom sheet no longer uses a translated 100vh element. Its actual top edge is moved
  and its bottom is pinned to the viewport, so the drag handle remains recoverable.
- The inner parameter area uses the remaining real panel height as its scroll viewport.
  A large bottom padding ensures the final controls can be scrolled fully above the screen edge
  even when the sheet is short.
- The sheet still has no snapping and remains exactly where released.

## v2.4 — basic workflow + presets

Research result:
- The MakeHuman 1.3.0 source archive contains no bundled `.mhm` standard-body preset library.
- MHM is a text-based saved character configuration format, so presets are fundamentally parameter sets.
- The official MakeHuman main body controls are Gender, Age, Muscle, Weight, Height and Proportions,
  with breast size / firmness as additional macro controls.

Therefore v2.4 adds Harness starting presets built ONLY from the genuine MakeHuman macro controls:
- Male Average
- Male Slim
- Male Muscular
- Female Average
- Female Curvy
- Neutral

These are not claimed as official MakeHuman presets. They are convenience starting configurations.
Selecting a preset clears Advanced offsets, then sets the native MakeHuman macro parameters.

All 142 direct body modifiers remain available under a collapsed Advanced section with search,
groups, individual overdrive, and global range editing.

The supplied MakeHuman 1.3.0 source archive also contains:
- `data/rigs/default.mhskel`
- `data/rigs/default_weights.mhw`
- `data/poses/tpose.bvh`
- animation/pose BVHs including walk and dance examples

These are the basis for a later proper Three.js SkinnedMesh pose implementation.


## v2.6.2 — exact macro dependency port

The previous builds omitted MakeHuman's `macrodetails` target layer. This layer contains the
race/population × gender × age base-shape targets and is a major part of the visible male/female difference.

v2.6.2 includes the complete relevant MakeHuman 1.3.0 macro target stack locally and computes each
target weight using MakeHuman's own factor principle: the weight is the product of the values of
all macro-variable tokens encoded in that target.

Included macro dimensions:
- Gender
- Age (using the exact `_setAgeVals()` formula from `human.py`)
- Caucasian / Asian / African population mix, normalized to sum to 1
- Muscle
- Weight
- Height
- Body proportions
- Breast size
- Breast firmness

Macro target groups included:
- `macrodetails`: race × gender × age
- `macrodetails-universal`: gender × age × muscle × weight
- `macrodetails-height`: gender × age × muscle × weight × height
- `macrodetails-proportions`: gender × age × muscle × weight × proportions
- breast macro targets conditioned by age/gender/muscle/weight/cup/firmness where present

Advanced direct modifiers remain additive on top.


### Binary packaging
The exact macro target stack is stored as local Float32 binary chunks instead of huge JavaScript arrays.
This keeps every GitHub-uploaded file under the web upload size limit and reduces parse overhead on iPhone Safari.


## v2.6.2 — face + first real rig/pose test

- Adds 138 MakeHuman head/face modifiers under Advanced:
  head, forehead, eyebrows, eyes, nose, mouth, ears, chin and cheeks.
- Loads MakeHuman's official `default.mhskel` structure and `default_weights.mhw` skin weights
  extracted from the supplied v1.3.0 source.
- Builds a Three.js `SkinnedMesh` with 163 MakeHuman bones.
- Pose buttons are intentionally simple direct bone rotations for this first test:
  Neutral, Arms down, Arms up, Step.
- The purpose of these buttons is to validate MakeHuman skinning in Safari before adding BVH or Mixamo retargeting.

Body Proportions remains driven by the exact MakeHuman macro target stack. Test it at 0 and 100;
its effect is subtler than Weight/Muscle because it changes relative limb/torso proportions rather
than overall body mass.


## v2.6.2 — GitHub Mobile split build

The six large `exact-macros-*.bin` files were split into small flat chunks of at most
approximately 2.4 MB each.

`macro-chunks.json` maps the original binary filename to its chunk files. The browser loader
reassembles the chunks in memory before parsing the macro data.

No folders are required. Upload every file in this ZIP directly to the repository root.

Largest file in this build is intentionally kept below typical mobile GitHub web-upload limits.


## v2.6.2
All exact macro data is now stored in small UTF-8 JavaScript modules. No macro .bin files remain. This build is intended for iPhone/GitHub mobile upload.


## v2.7.3 Guided Debug

Adds the Harness-Designer-style guided test/report mode:
- Pass / Fail / Skip per question
- per-question comments
- multiple 3D screenshots per question
- three screenshot thumbnails per row
- closing/reopening preserves current question, status, comments and screenshots
- Back from question 1 wraps to the last question
- persistent state in localStorage
- finish page + overall comment
- HTML report with embedded screenshots
- Web Share fallback
- compact JPG report export


## v2.7.3 — Safari loading architecture fix

Critical change:
- `macro-text-manifest.js` no longer imports all 87 `macrodata-*.js` files at module startup.
- The manifest now contains filenames only.
- Macro text chunks are fetched and decoded dynamically.
- `base.obj` + MakeHuman rig render first.
- Exact MakeHuman macro containers then load sequentially in the background.
- Loading UI shows package and part progress.
- 15 second timeout per macro text asset gives a concrete filename/error instead of an endless spinner.
- The neutral mesh remains visible if macro loading fails.

Existing static `macrodata-*.js` files stay in the repository unchanged.


## v2.7.3 — unfragmented asset build

This build intentionally uses the six original exact MakeHuman macro binaries directly.
No macrodata text fragments, no chunk manifest, and no body-morph JS fragments are used.

Upload the files to the repository root. Because GitHub mobile appears to limit the total
size of one web commit, upload/commit the large files individually (or in small groups).
Each individual file in this build remains below GitHub's 25 MiB browser file limit.


## v2.7.3 — Measurement + Revision UI

Uses 20 original MakeHuman measurement rulers extracted from
`plugins/0_modeling_a_measurement.py`.

Live dual display:
- Morph/technical value remains visible.
- Age additionally shows MakeHuman age in years.
- Height shows current mesh height in cm.
- Weight shows MakeHuman-style Mosteller estimate from current mesh surface + height.
- Official measurement modifiers show current resulting cm using MakeHuman's ruler vertex paths.
- Body stats show height, estimated weight, BSA and volume.

Revision mode:
- Every UI parameter can be classified as Hauptansicht / Feinanpassung / Advanced.
- Advanced body/face controls are moved live according to the saved classification.
- Every parameter can be renamed and annotated.
- Reference/calibration marks store the full body state and current computed value.
- Revision data exports as JSON.

User presets:
- Current full body state can be named and saved locally.

## v2.7.3 Safari parser-safe rebuild

Rebuilt from the known-working v2.7.0 base rather than from v2.7.1/v2.7.2.
Inline Revision was reimplemented with conservative JavaScript syntax and simple DOM construction.
The working v2.7.0 measurement architecture and `measurement-data.js` are preserved.
