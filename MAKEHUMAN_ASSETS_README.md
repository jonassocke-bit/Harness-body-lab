# MakeHuman assets

This starter intentionally does **not** bundle MakeHuman mesh/target files.

Why:
1. Keep this repository tiny and easy to inspect.
2. Avoid mixing unverified target filenames into the code.
3. Make the asset source explicit.

The official `makehuman-assets` repository states that bundled assets are CC0.

## Expected layout

```text
base.obj
manifest.json
waist-decrease.target
waist-increase.target
hips-increase.target
...
```

Create a new file named `manifest.json` from `manifest.example.json` only after replacing the example target filenames with real ones.

The browser-side parser supports normal sparse MakeHuman `.target` rows:

```text
vertexIndex dx dy dz
```

The visible UI slider does not need to equal one physical `.target` file. A slider may combine multiple targets through `manifest.json`.
