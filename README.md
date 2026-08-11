# Harness Body Lab v0.3 — Flat GitHub Upload

Alle Dateien direkt in den Root deines GitHub-Repositories hochladen:

- `index.html`
- `style.css`
- `app.js`
- `README.md`
- `LICENSE`

Danach GitHub Pages auf `main` / root aktivieren.

## Was sich gegenüber v0.1 geändert hat

- Kein Kugel-/Capsule-Platzhalter mehr.
- Das Projekt lädt das echte MakeHuman/MPFB2 `hm08` Base-Mesh aus NAVER Labs' Anny-Datensatz.
- `helper-*` und `joint-*` Face Groups werden beim Parsen ausgefiltert.
- Keine Kleidung wird geladen.
- Die Körperform wird direkt auf dem gemeinsamen Mesh verändert.
- Mobile UI als ziehbares Bottom-Sheet mit separatem Scrollbereich.
- Presets: Female, Neutral, Male, Curvy, Muscular.
- Regler: Gender, Height, Weight, Muscle, Proportions, Shoulders, Chest, Breast, Waist, Belly, Hips, Butt, Thighs, Calves, Arms.

## Wichtig

v0.3 verwendet bereits das echte MakeHuman Base-Mesh, die einzelnen Körperregler sind aber zunächst eine browserseitige, regionsbasierte Deformation. Das ist absichtlich ein Zwischenschritt: So können wir Aussehen und iPhone-Performance testen, bevor wir den größeren Satz echter MakeHuman `.target`-Morphs integrieren.

Quelle des Base-Mesh:
`naver/anny/src/anny/data/mpfb2/3dobjs/base.obj`

Anny dokumentiert die gebündelten MPFB2-Daten als CC0.


## v0.3 Fixes

- Automatic anatomical-axis detection fixes the body appearing sideways/lying down.
- Shoulder/chest/waist controls now use torso-spatial masks.
- Shoulder changes no longer scale hands merely because the arms are at shoulder height.
- Arm thickness fades out before wrists and hands.
- Pelvis and leg deformations are spatially isolated as well.
