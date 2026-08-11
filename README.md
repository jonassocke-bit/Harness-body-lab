# Harness Body Lab

Mobile-first Three.js starter for integrating a highly customizable MakeHuman-derived body into a leather Harness Designer.

## What works now

- Runs as a static website: perfect for GitHub Pages and iPhone Safari.
- One-finger/touch-compatible orbit via Three.js controls.
- Body UI for Gender, Weight, Muscle, Height, Proportions, Breast Size/Firmness, Shoulders, Chest, Waist, Hips, Butt, Thighs, Calves and Arms.
- Presets: Female, Neutral, Male, Curvy, Muscular.
- Working fallback mannequin so the project opens even before MakeHuman assets are added.
- Browser-side parser for sparse MakeHuman `.target` files.
- `manifest.json` adapter concept: one visible slider can combine several physical targets.

## Why this architecture

MakeHuman uses a common parametric topology. For the Harness Designer this is important because rings/anchors can later be bound to surface vertices/triangles and follow body deformation.

## iPhone / GitHub Pages setup

1. Create a new GitHub repository.
2. Upload all files from this folder directly into the root of your GitHub repository. No subfolders are required.
3. In GitHub: Settings → Pages → Deploy from branch → `main` / root.
4. Open the generated Pages URL in Safari.
5. Add it to the Home Screen if desired.

No npm, Blender or desktop build step is required for this starter.

## Add the real MakeHuman body

See `MAKEHUMAN_ASSETS_README.md`.

The project deliberately ships without guessed target filenames. Add official CC0 asset files and create:

```text
manifest.json
```

based on `manifest.example.json`.

## Next integration step for Harness Designer

Replace world-space attachment points with surface bindings:

```js
{
  triangle: [i0, i1, i2],
  barycentric: [u, v, w],
  normalOffset: 0.004
}
```

Whenever the body vertices change, recompute the attachment position from the same triangle and barycentric coordinates. This lets rings and strap anchors follow Waist/Hip/Chest/etc. morphs automatically.

## Sources / licensing

- MakeHuman application code: AGPL.
- MakeHuman bundled assets repository: assets released CC0 since September 2020.
- This starter does not copy MakeHuman application code and does not bundle MakeHuman asset files.
- The starter code in this repository is provided under MIT (see `LICENSE`).

Before publishing a production app, keep attribution/source notes even where CC0 does not require attribution; it makes provenance auditable.


## Flat GitHub layout

This variant is intentionally flattened for iPhone GitHub uploads. Every file goes into the repository root.

Important:
- `index.html`, `app.js`, `config.js`, `fallback-body.js`, `target-loader.js`, and `style.css` must all stay in the root.
- When you later add MakeHuman assets, upload `base.obj`, `manifest.json`, and every `.target` file into the same root.
- `manifest.json` must reference target files as `./filename.target`.
