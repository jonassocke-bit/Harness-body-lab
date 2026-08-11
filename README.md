# Harness Body Quality Test — local MakeHuman v2

Upload ALL files directly into the root of the GitHub Pages repository:

- index.html
- style.css
- app.js
- base.obj
- waist-decr.target
- waist-incr.target
- hips-decr.target
- hips-incr.target

Everything relevant to the body test is local now. No Git LFS, no GitHub Media endpoint,
no external body/target runtime downloads.

The only external runtime dependency is Three.js itself via jsDelivr.

Expected UI status:
`2/2 echte MakeHuman-Morphs lokal aktiv`

The four target files and base.obj were extracted from the MakeHuman v1.3.0 source archive
provided by the user.
