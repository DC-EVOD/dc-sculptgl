DC KITBASH — asset muster and part pipeline
===========================================
Companion to forge/. Where forge/ processes ONE sculpt, kitbash/ builds the
modular parts LIBRARY that feeds it: heap of OBJ/GLB/FBX -> sanctioned parts ->
IMM brushes -> low-poly projection targets.

Runs on David's laptop (Ryzen 9 / RTX 5060, ZBrush live), not in a container.
The cloud container cannot see his disk, so the scanning/sorting stages are
local PowerShell by design.

muster.ps1  v1.1  -- STATUS: UNVERIFIED, never executed.
  Scans %USERPROFILE% for .obj/.fbx/.glb/.gltf and .zip, classifies each hit as
  LOOSE / PROJECT / CACHE, reports CSV+HTML, then sorts into
  %USERPROFILE%\DC-EVOD\{OBJ,FBX,GLB}\<name>__<hash8>\ with sidecars.

  Bare run writes NO assets, only its report. -Gather copies. -Move moves, and
  refuses to move anything in the PROJECT zone. Sidecars are always copied,
  never moved. Nothing is ever deleted. Program Files/ProgramData/Windows are
  hard-refused as scan roots. Zips are inventoried, never auto-extracted.

  Authored without PowerShell available: one guarded Move-Item, zero delete
  commands and balanced delimiters were verified by grep/count. That it PARSES
  was not verified. Do not describe it as working until a run says so.

LAWS (from MESHWEAVER_HANDOVER.md, 2026-07-26)
  - Reconstruct clean, never chop. "auto dice is gonna fuck us in the arse"
  - David reviews and sanctions parts BEFORE any dissection.
  - Never name a standard algorithm after the method it replaced.
  - Every number carries provenance. Emit a RECEIPT, like forge/*.py do.
  - Never modify sculptgl.js.
