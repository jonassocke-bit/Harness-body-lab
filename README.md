# Harness Body Lab v0.6 — real MakeHuman target test

Flat GitHub Pages project. Upload all five files to the repository root.

## The important change

The key fitting sliders now load and apply actual MakeHuman `.target` vertex deltas:

- V-Shape: `torso-vshape-decr/incr`
- Bust/Chest circumference: `measure-bust-circ-decr/incr`
- Waist circumference: `measure-waist-circ-decr/incr`
- Hip circumference: `measure-hips-circ-decr/incr`
- Buttocks volume: `buttocks-volume-decr/incr`
- Upper-arm circumference: `measure-upperarm-circ-decr/incr`
- Thigh horizontal scale: left + right upper-leg targets
- Calf circumference: `measure-calf-circ-decr/incr`

The OBJ parser preserves each triangle vertex's original hm08 vertex ID. This is essential:
MakeHuman targets refer to original mesh vertex indices, while WebGL rendering duplicates
vertices when quads/polygons are triangulated.

Height, Weight and Muscle are deliberately marked with `*`: they remain lightweight
approximations in this proof-of-concept. Proper MakeHuman macro morphing combines multiple
macro targets and is the next step only if the real local morph quality is worth continuing.

## Runtime sources

- Body: NAVER Anny's CC0-adapted MPFB2 hm08 base mesh.
- Targets: official makehumancommunity/makehuman-assets repository (CC0).

The app fetches these through jsDelivr so the GitHub repository itself stays flat and tiny.
