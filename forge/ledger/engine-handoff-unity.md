ENGINE HANDOFF — WORKING IN UNITY WHEN THE SOURCES USE UNREAL
=============================================================
You work in Unity. The impression that "they always use Unreal" is largely
correct for this source set. Here is the measured picture, so you know which
sources are worth following to the end and which stop being relevant.

WHO ACTUALLY TARGETS WHAT (word-boundary counts over raw/)
  Ironbark  (game worlds)      Unity 4   Unreal 0   <- ends IN Unity
  learn3d   character course   Unity 7   Unreal 7   <- both, equally
  learn3d   environments       Unity 1   Unreal 15  <- Unreal-dominant
  Stefan    YouTube            Unity 1   Unreal 1
  Abe Leal                     Unity 0   Unreal 3
  Hristian Shyne               Unity 0   Unreal 0
  TriGon / Gatz / Royal Skies  Unity 0   Unreal 0   <- engine-agnostic

  (A caution worth recording: a case-insensitive substring search for "unity"
  also matches "community" and badly inflates the count. These numbers use
  word boundaries.)

WHAT THIS MEANS IN PRACTICE
  THE ENTIRE ZBRUSH TRACK IS ENGINE-AGNOSTIC. TriGon, Gatz, Hristian and
  Royal Skies never mention an engine because nothing they teach depends on
  one. Sculpting, damage, IMM hardware, polygroup IDs, bake-forward thinking
  — all of it lands the same in Unity as in Unreal. There is nothing to
  translate. This is the majority of the ledger.

  THE BLENDER ARMOUR TRACK IS ALSO ENGINE-AGNOSTIC. Baril never names an
  engine. Abe Leal names Unreal only in passing; his actual craft (panel
  seams, thickness, remesh, asymmetry, overlap-for-AO) is engine-neutral.

  IRONBARK IS YOUR BEST FOLLOW-THROUGH. His series is the one that actually
  terminates in Unity: he builds the modular kit in Blender and explicitly
  sculpts the terrain inside Unity, placing the assets on it. His background
  cliffs are built "not really terrain that you'll be running over... we're
  going to be making that terrain separately inside of Unity." If you want a
  worked Unity endpoint from this set, that is the one.

  ONLY THE learn3d ENVIRONMENTS COURSE IS GENUINELY UE5-SHAPED. Its final
  stage is "Export and Scene Setup in Unreal Engine 5" — importing meshes and
  textures, rebuilding materials, organising the level, configuring lighting
  and cameras. Everything BEFORE that stage (isometric master reference,
  low-poly-first generation, material-count reduction to ~20, palette
  unification, largest-to-smallest assembly) is engine-neutral and applies to
  Unity unchanged. Only the last stage needs substituting.

WHAT THE SOURCES SAY ABOUT EXPORT — and what they don't
  STATED: the learn3d character course lists proper export, preparing
  "textures and maps for engines", and lists UV, normal map and ORM among
  what you walk away with. It names Unity and Unreal equally.
  STATED: bake high-poly detail onto the optimised low-poly; PBR set consists
  of roughness, metallic and normal; cut total material count to roughly 20.
  STATED (Hristian): give plate / ornament / edge / bolts separate polygroup
  colour IDs so the texturing tool can split materials. That ID discipline is
  what makes a small material count achievable, and it is engine-independent.

  NOT STATED ANYWHERE IN THESE SOURCES: Unity-specific import settings,
  channel packing order, shader or URP/HDRP setup, scale-factor handling, or
  LOD configuration. None of the eleven transcripts covers it. Nothing on
  those topics is recorded here, because inventing it would be worse than the
  gap. If you want that written up, it needs a source — point me at one and
  it gets added with provenance like everything else.

WHAT THE REPO ALREADY DECIDES FOR YOU
  Your own ascent-fall-iso-pipeline skill already states the engine-portable
  law for this project: assets ship as STANDALONE FILES (GLB + PNG + JSON
  manifest) that both the web viewer and Unity load unchanged, with geometry
  never baked into JS. House standard 2:1 dimetric, 1 unit = 1 m = 1 tile.
  That is your engine handoff contract, and it already favours Unity.
  The bridge document's scale convention (+Z up, +Y front, 1.8-unit humanoid)
  has to agree with it. Fix the convention once, in one place.
