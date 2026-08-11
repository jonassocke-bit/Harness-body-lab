# Harness Body Lab v0.7.1 — stable smooth build

This build deliberately returns to the last known-working v0.5 runtime structure.

Changes:
- no external MakeHuman target downloads
- no Git LFS dependency at runtime
- smooth shared vertex normals via Three.js `mergeVertices`
- softer mannequin material
- one finger rotate
- two finger pan + pinch zoom
- 12 second body-load timeout with visible error instead of infinite spinner

All five files go directly into the GitHub repository root.

This is a stability checkpoint. Real MakeHuman targets should be bundled locally in the
repository in the next step rather than fetched from multiple third-party hosts at runtime.
