# assets/ — the engine-neutral library (THE PRODUCT)

This folder is the source of truth for all game art. It is **engine-neutral by law**
(see `../CLAUDE.md` §1). Rules:

- Portable formats only: `.glb` (+`.obj` fallback), `.png`, tileset `.tmx/.tsx/.json`.
- **Nothing** Three.js- or Unity-specific goes in here — no shaders, no `.meta`, no prefabs.
- The Three.js `prototype/` reads from here and writes nothing back.
- Unity (later) imports the same files; Unity-only tweaks live in the Unity project, not here.

Layout:

```
_manifest/   registry.json (every asset) + spec-template.md
characters/  <Name>/{ mesh.glb, textures/, spec.md }
props/
environment/
  modular/   1 m-grid walls/floors/columns (CLAUDE.md §5)
  tiles2d/   2D isometric tilesets + tilemaps (CLAUDE.md §6)
materials/   shared PBR material json defs + matcap refs
textures/    shared/tiling textures
```

Every asset needs a `spec.md` (copy `_manifest/spec-template.md`) and a `registry.json` entry
before it counts as done. See `../CLAUDE.md` §3, §12, §13.
