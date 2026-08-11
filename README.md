# Harness Body Quality Test v1

Upload all files directly into the root of the GitHub repository.

Files:
- index.html
- style.css
- app.js
- README.md

This is intentionally not another full Body Lab version. It is a minimal quality gate.

## What is different

- The visible MakeHuman hm08 body is selected strictly by original vertex IDs `0..13379`.
- Faces are preserved only when all their original vertex IDs belong to that visible body range.
- The mesh stays indexed: one original MakeHuman body vertex == one rendered body vertex.
- Smooth normals are calculated on that shared topology.
- No helper/joint group-name filtering.
- No merge-by-position.
- No approximate body shape sliders.
- Only two genuine MakeHuman morph pairs are tested:
  - waist circumference
  - hip circumference

## Expected status

`2/2 echte MakeHuman-Morphs aktiv`

If it shows less than 2/2, the GitHub media/LFS endpoint is not usable reliably from the iPhone and the target bytes need to be physically bundled in the repository.

Runtime sources:
- hm08 base: NAVER Anny MPFB2 data (CC0)
- morph targets: makehumancommunity/makehuman-assets (CC0)
