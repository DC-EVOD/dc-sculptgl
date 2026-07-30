# prototype/ — Three.js isometric sandbox (THE VIEWER)

Disposable, read-only viewer for the neutral `../assets/` library. See `../CLAUDE.md` §10.

- **Reads `../assets/` only; writes nothing back.** Delete this folder and zero art is lost.
- Orthographic camera locked to the iso contract: pitch **35.264°**, yaw **45°**.
- Loads `.glb` via `GLTFLoader`; loads 2D tilemaps from Tiled data in `../assets/environment/tiles2d/`.
- Prototype-only helpers (grid overlay, spawner, perf HUD, camera rig) live in `src/` and are
  free to hack — they are not shipping code and never leak into `assets/`.
- If you need a variant of an asset, request a **new asset** through the pipeline; do not fork it here.

> Not built yet — scaffold only. When implemented: `index.html` + `src/` (scene, iso ortho camera,
> GLTFLoader, tilemap loader). Keep it a pure consumer of the library.
