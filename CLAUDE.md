# CLAUDE.md — Isometric Game-Asset Constitution

> **Hand this file to every new Claude conversation before asking for any asset.**
> It exists for one reason: so that assets built in *different* chats, weeks apart,
> still snap together, share scale, read as one art style, and drop into Unity
> without rework. If a request conflicts with this file, this file wins — or we
> change this file first, then build.

**Project:** Ascent/Fall — isometric ARPG (world of Vaehr). Dark mythopoetic horror.
**Now:** prototype & sandbox in the browser (Three.js + the SculptGL forge in this repo).
**Later:** the real game is authored in **Unity**. Assets must stay engine-neutral so
that porting to Unity is a *copy*, never a rebuild.

---

## §0 — THE CONTRACT (the only place to change global rules)

Every number below is a hard project standard. Change it *here*, and every asset
and every future chat inherits the change. Do not silently deviate in a single asset.

| Rule | Value | Why |
|---|---|---|
| **Unit** | `1 unit = 1 metre` (Unity-native) | Unity is the real target; model at real scale from the start. |
| **Up axis** | `+Y up`, `-Z forward` | glTF/Unity convention. Three.js agrees. |
| **Base grid module** | **1.0 m** floor tile. Sub-snaps: 0.5 / 0.25 m | Everything modular snaps to this. *(David: confirm or change — this drives all level geometry.)* |
| **Isometric projection** | **Orthographic**, camera pitch **35.264°** (`atan(1/√2)`), yaw **45°** | True isometric. Already wired to hotkey **`O`** in `dc-addon.js`. |
| **Poly tier** | **Web-prototype-lean** (see §7 budgets) | Iso camera is distant; web must stay light. *(David: bump to a heavier tier here if desired.)* |
| **Mesh source-of-truth format** | **glTF 2.0 binary `.glb`** (primary) + `.obj` (forge fallback) | Open, PBR-native, loads directly in Three.js *and* Unity. |
| **Texture format / size** | `PNG`, power-of-two. Chars **1024²**, props/tiles **512²**, hero/boss **2048²** | Web-safe, mip-friendly. |
| **PBR maps** | `_albedo`, `_N` (normal), `_ORM` (Occlusion/Roughness/Metallic packed), optional `_E` (emissive) | One metal/rough/AO texture instead of three. |
| **2D iso tile ratio** | **2:1 dimetric**, base tile **128 × 64 px** | Classic iso pixel/sprite ratio for the 2D layer & minimap. |
| **Tilemap data format** | **Tiled** (`.tmx` / `.tsx`) or Tiled-JSON | Imports to both a Three.js loader and Unity Tilemap. |
| **Palette / aesthetic** | Governed by the `ascent-fall-design-law` skill + matcaps in `resources/matcaps/` (`dc_blood_gloss`, `dc_cold_bone`, `dc_void_chitin`) | Do **not** invent new hues; pull from the design law. |

If any value above is still a placeholder or you are unsure, **ask David before building** —
do not guess a scale or a budget into an asset.

---

## §1 — THE GOLDEN RULE: code and assets are separate

There are three zones. Keep them apart.

```
FACTORY (code)          →   PRODUCT (assets, neutral)   →   CONSUMERS (code)
this repo's tool + forge     assets/                          prototype/  (Three.js, now)
                                                              Unity/      (later, elsewhere)
```

1. **`assets/` is the product and it is engine-neutral.** It contains only portable
   formats (`.glb`, `.obj`, `.png`, tileset `.tmx/.tsx/.json`). Nothing in `assets/`
   may reference Three.js, Unity, a shader graph, a `.meta` file, or any engine-specific
   thing. This is what "keep assets unlocked for Unity" *means* — the library never
   marries an engine.

2. **`prototype/` (Three.js) is a disposable viewer.** It *reads* from `assets/` and
   writes nothing back. You can delete `prototype/` entirely and lose zero art. It
   exists to look at, sandbox, and pressure-test assets in an iso scene — nothing more.

3. **Unity is a downstream consumer, not a source.** When the Unity project is created
   (separate repo/folder), it imports the *same* `assets/` library. If an asset needs a
   Unity-only tweak (collider, LODGroup, prefab), that tweak lives in the Unity project,
   **never** back-written into `assets/`.

**Test for any change:** "Would this survive if we threw away Three.js tomorrow and
opened the assets in Unity?" If no, it belongs in `prototype/` or `Unity/`, not `assets/`.

---

## §2 — Repository layout

```
/                       ← THE FACTORY (SculptGL web tool — code, do not mix assets in here)
├── CLAUDE.md           ← this file
├── index.html, sculptgl.js, dc-addon.js, css/, worker/   ← the sculpt tool
├── resources/          ← tool resources: matcaps, alphas, environments (aesthetic source)
├── forge/              ← headless-Blender engines (intake / edge_rings / bake_out / daemon)
│
├── assets/             ← THE PRODUCT — engine-neutral library (the thing that ports to Unity)
│   ├── _manifest/      ← asset registry + this contract's machine-readable copy
│   │   ├── registry.json      (every asset: id, type, scale, tris, maps, status)
│   │   └── spec-template.md    (copy per new asset — see §12)
│   ├── characters/     ← <Name>/  { mesh.glb, textures/, spec.md }
│   ├── props/          ← interactables, clutter
│   ├── environment/
│   │   ├── modular/    ← walls, floors, columns — snap to the 1 m grid (§5)
│   │   └── tiles2d/    ← 2D isometric tilesets + tilemaps (§6)
│   ├── materials/      ← shared PBR material defs (json) + matcap refs
│   └── textures/       ← shared/tiling textures used by many assets
│
└── prototype/          ← THE VIEWER — Three.js iso sandbox (code, disposable, read-only on assets/)
    ├── index.html
    ├── src/            ← scene, ortho iso camera, GLTFLoader, tilemap loader
    └── README.md
```

---

## §3 — Definition of "game-ready for isometric" (the acceptance gate)

An asset is **not done** until every box is true. This is the checklist a new Claude
runs before calling anything finished.

- [ ] **Scale** is real-world metres; object sits correctly on the 1 m grid.
- [ ] **Transforms applied** — scale `1,1,1`, rotation `0,0,0`, at export. (Non-negotiable, see §14.)
- [ ] **Origin/pivot** correct: floors = centre; walls/props = bottom-centre contact point.
- [ ] **Reads at the iso angle** — silhouette is clear at 35.264° pitch / 45° yaw, distant camera. Detail that vanishes at that angle was wasted; put it in the normal map or cut it.
- [ ] **Topology**: quads where it deforms, intentional tris on hard surface, **zero n-gons**, manifold, outward normals.
- [ ] **Poly budget** met for its class (§7).
- [ ] **UVs**: no overlaps for baked maps, consistent texel density, power-of-two textures, padding per size.
- [ ] **PBR set** present and named (`_albedo` / `_N` / `_ORM` [/ `_E`]).
- [ ] **Format**: `.glb` in `assets/`, loads clean in the Three.js prototype.
- [ ] **Palette** pulled from the design law, not invented.
- [ ] **Registered** in `assets/_manifest/registry.json` with its spec.
- [ ] **Unity-safe**: nothing engine-specific baked in; would import to Unity as-is.

---

## §4 — 3D asset pipeline (sculpt → forge → neutral library)

This repo already *is* the organic-asset factory. Use it; don't reinvent it.

1. **Sculpt / blockout** in the SculptGL fork (`https://dc-evod.github.io/dc-sculptgl`).
   Vertex-paint colour zones as you go — the bake reads vertex colour.
2. **INTAKE** (button / `forge/intake.py`) — cleans raw/generated meshes: merge doubles,
   delete loose, dissolve degenerate, fill holes, recalc normals, optional voxel/quad
   remesh with vertex-colour transfer. Run this on anything imported from a generator.
3. **MARK → paint joints cyan → RINGS** (`forge/edge_rings.py`) — lays retopo edge loops
   at deformation zones for anything that will rig/animate (§7).
4. **BAKE** (`forge/bake_out.py`) — smart-project UVs, rasterise vertex colour → `_albedo.png`
   (+ optional vertex-AO → `_ao.png`), export `.obj` + `.mtl`. Every run prints a `RECEIPT`
   JSON with measured stats (uv_fill, tri counts) — trust the receipt, not a guess.
5. **Promote to the library**: convert the forge OBJ → **`.glb`**, generate/complete the
   PBR set to the §0 contract (`_N`, pack `_ORM`), drop into the right `assets/…` folder,
   fill the spec (§12), register it. *Only now* is it a real asset.

> The forge currently outputs OBJ + albedo(+AO). Step 5 is where it becomes the
> engine-neutral GLB+PBR the contract requires. Keep the forge OBJ as the `.obj` fallback.

---

## §5 — Modular environment & the isometric grid

For walls, floors, columns, ruins — anything the level is built from.

- **Snap to the 1 m base module.** Wall = 1 m or 2 m spans; floor = 1×1 m; heights in 0.5 m steps.
- **Edge verts must sit exactly on grid lines**, and matching edges (wall-to-wall) need
  identical vert counts so pieces weld seamlessly.
- **Pivots**: walls = bottom-centre; floors = centre (rotates cleanly); corners = corner vert.
- **Design for the iso read**: the interesting silhouette is the *top and two facing sides*.
  Don't spend polys on faces the 45° camera never sees; do keep strong top-edge profiles.
- **Tileable textures** on modular sets so 4 walls in a row show no repeat seam.
- Build a **kit**, not one-offs: straight / corner / T / end / doorway share the same
  height, trim line, and material so any level reads as one place.

---

## §6 — 2D tilesets & isometric mapping

The 2D layer (ground tilemaps, minimap, UI-scale iso, or a fully 2D iso mode).

- **Projection**: 2:1 dimetric. Base tile **128 × 64 px** (§0). A tile's diamond top face
  is 128 wide × 64 tall; taller blocks extend upward in multiples of the tile height.
- **Tilesets** live in `assets/environment/tiles2d/<set>/`: one PNG atlas + a Tiled `.tsx`.
- **Tilemaps** (the actual level layout) are Tiled `.tmx`/JSON — **data, not code** — so the
  same map file drives the Three.js prototype loader *and* a Unity Tilemap import.
- **Anchor/registration point** is the bottom-centre of the diamond, so tiles stack and sort
  correctly by depth (painter's order = row-by-row, back-to-front).
- **3D-vs-2D parity**: if a location exists as both 3D modular geometry and a 2D tileset,
  keep footprints identical (a 1 m grid cell = one 128×64 tile) so they represent the
  same space. Note the pairing in each asset's spec.
- Keep 2D palette locked to the same design law as the 3D — the 2D layer is not an excuse
  to drift colour.

---

## §7 — Characters, creatures, poly budgets

**Web-prototype-lean tier** (default per §0). These are triangle ceilings, iso-distance tuned:

| Class | Tris (LOD0) | Textures | Notes |
|---|---|---|---|
| Player / hero | 15k – 40k | 2048² | Rig-ready topology, manual edge loops at joints. |
| Boss / major NPC | 20k – 60k | 2048² | Silhouette is king at iso distance. |
| Common enemy / NPC | 5k – 15k | 1024² | Reuse skeletons where possible. |
| Large prop / statue | 2k – 8k | 1024² | |
| Small prop / clutter | 0.3k – 4k | 512² | Bake detail to normals, don't model it. |
| Modular tile piece | 0.1k – 1.5k | 512² tiling | §5. |

- Anything that **deforms** → quad edge-loop topology via MARK/RINGS (§4.3). Static hard-surface
  props may ship as clean intentional tris.
- **LODs** only when the prototype shows a perf need; iso camera rarely needs more than LOD0–LOD1
  for props. Name them `_LOD0`, `_LOD1` (§9).
- Rig/skeleton conventions: define once per creature family and record in its spec so animations
  and future variants stay compatible.

---

## §8 — Materials, textures & the Ascent/Fall look

- **PBR contract**: `_albedo`, `_N`, `_ORM` (R=Occlusion, G=Roughness, B=Metallic), optional `_E`.
- **Palette & mood** come from the `ascent-fall-design-law` skill and the existing matcaps in
  `resources/matcaps/` — `dc_blood_gloss`, `dc_cold_bone`, `dc_void_chitin`. Sculpt/preview against
  these so a fresh chat lands the same look. Never introduce a new palette without updating the law.
- **Alphas / surface detail**: `resources/dc/` and `resources/alpha/` (chitin ribs, segment creases,
  scar/tear, flute grooves) are the canonical detail stamps — prefer these to keep surface language
  consistent across assets.
- Shared/tiling materials live in `assets/materials/` as small JSON defs (which maps, tiling, which
  matcap ref) so many assets cite one material instead of each redefining it.

---

## §9 — Naming conventions

`Type_Category_Name_Variant_LOD` — underscores only, no spaces, no special chars.

```
SM_Env_WallStraight_Ruin_LOD0.glb      SK_Char_Descendant_Hero.glb
SM_Prop_Brazier_Iron.glb               T_WallStraight_Ruin_albedo.png
T_WallStraight_Ruin_N.png              T_WallStraight_Ruin_ORM.png
TS_Env_CryptFloor.tsx  (tileset)       TM_Level_Crypt01.tmx  (tilemap)
```

Prefixes: `SM_` static mesh · `SK_` skeletal · `T_` texture · `M_` material · `TS_` tileset ·
`TM_` tilemap · `A_` animation · `FX_` effect. Texture suffixes per §0/§8.

---

## §10 — Three.js prototype rules (the viewer)

- **Reads `assets/` only. Writes nothing back to it.**
- Ortho camera locked to the iso contract: pitch 35.264°, yaw 45°, orthographic frustum.
- Loads meshes with `GLTFLoader` straight from `assets/**/*.glb`; loads tilemaps from the Tiled
  data in `assets/environment/tiles2d/`.
- Prototype-only helpers (grid overlay, spawner, perf HUD, camera rig) live in `prototype/src/`
  and are fair game to hack freely — they are not shipping code.
- If the prototype needs a variant of an asset, it requests a *new asset* through the pipeline;
  it does not fork the asset locally.

---

## §11 — Unity handoff (later)

When Unity begins (separate project):

- Import the neutral `.glb` (or re-export `.fbx` if a workflow needs it — keep the `.glb` as truth).
- **Scale factor = 1.0** (assets are already metric — a non-1 scale factor means a pipeline bug, fix upstream).
- **Import normals**, don't recalculate (preserves hard/soft edge intent from the forge).
- Colliders, LODGroups, prefabs, materials-as-Unity-assets: all authored **in Unity**, never
  written back into `assets/`.
- `_ORM` maps map straight to Unity's mask/metallic-smoothness workflow (invert G if using
  smoothness vs roughness — note it in the material def).

---

## §12 — Per-asset spec sheet (plan before you build)

Copy `assets/_manifest/spec-template.md` to `<asset>/spec.md` and fill it **before** modelling.
No asset gets built without a spec — that's how cohesion is enforced.

```md
# <Asset Name>
- id:            SM_Env_WallStraight_Ruin
- type:          static-mesh | skeletal | tileset | tilemap | material
- role:          what it is in the game / where it appears
- grid footprint: e.g. 1×1 m  (and 2D pairing: 1 tile 128×64, yes/no)
- scale:         real dimensions in metres
- tri budget:    target (class per §7)
- textures:      1024² — albedo / N / ORM / E?
- palette:       which design-law swatches / matcaps
- rig:           none | skeleton family <X>
- variants/LODs: planned
- pipeline:      sculpt→intake→(rings)→bake→glb  (which steps apply)
- status:        planned | sculpting | baking | in-library | in-prototype | unity-verified
```

---

## §13 — Protocol for every new Claude conversation

Do this at the **start** of any asset chat, in order:

1. **Read this file** (§0 contract especially) and, if present, load the
   `ascent-fall-design-law` and `ascent-fall-procedural-assets` skills for palette/lore/forge detail.
2. **Locate or write the spec** (§12) for what's being built. If scale, grid footprint, or budget
   is unclear — **ask David, don't guess.**
3. **Build through the pipeline** (§4 for organic, §5 for modular, §6 for 2D).
4. **Run the acceptance gate** (§3) and the validation gate (§14). State results honestly —
   if a box fails, say so; don't call it done.
5. **Promote to `assets/`** engine-neutral, name per §9, **register** in `registry.json`.
6. **Never** mix engine-specific code into `assets/`; the prototype and Unity are downstream.

**Cohesion is the whole point:** same scale, same iso angle, same palette, same naming, same budgets,
every time — so ten assets from ten chats look like one game.

---

## §14 — Validation gate (non-negotiables)

These fail the build outright, from the 3D-modeling discipline:

- **Apply all transforms before export.** Scale `1,1,1`, rotation `0`. No exceptions, ever.
- **No n-gons** in final geometry. Quads for deformation; intentional tris for hard surface.
- **No non-manifold geometry, no loose verts, normals outward** (INTAKE enforces; re-check after any edit).
- **Power-of-two textures**; correct suffixes; no overlapping UVs on baked maps.
- **Consistent texel density** across an asset (vary only intentionally hero-vs-background).
- **Every claim measured, not asserted** — cite the forge `RECEIPT`, real tri counts, real UV fill.
  If it wasn't verified this session, don't claim it.
```

