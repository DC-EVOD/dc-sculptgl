MACROS AND TOOLING
==================
What is worth automating, what is not, and what the forge now provides.

THE TEST FOR "SHOULD THIS BE A TOOL"
  Automate a sequence that is (a) identical every time, (b) long enough to
  be error-prone by hand, and (c) something you do on every piece.
  Do NOT automate judgement. Silhouette, proportion, where damage reads, how
  asymmetric to go — every source in this ledger spends most of its time on
  those, and they are exactly what a script cannot do for you.

BLENDER — THE ENGINES
  The repo convention is already headless Blender Python (forge/intake.py is
  a bpy script). New engines follow it exactly:
      blender -b -P <engine>.py -- --in X --out Y [...]
      measured stats() before and after
      print("RECEIPT " + json.dumps(...))    every claim measured
      registered in forge_daemon.py ENGINES so the sculpt buttons can call it

  panel_stack.py   THE big one. Builds the entire Baril modifier stack plus
                   the base-mesh copy and the wrap/offset vertex groups. This
                   sequence appears in both Baril videos, every single time a
                   new plate is started, and it is ~15 manual steps with an
                   order that matters. Highest-value automation in the set.

  Planned, in build order after it:
  offsets.py       add a vertex-group-driven Shrinkwrap (Outside Surface +
                   offset) for rolled lips, raised crests, recessed beds
  rivets.py        distribute rivets along an edge loop: raycast to surface,
                   align to normal, linked-instance. This is the manual
                   Face + Project Individual Elements + Align Rotation to
                   Target setup, done programmatically and evenly spaced
  pierce.py        checker-deselect a face row -> inset -> circularise ->
                   delete -> inset rim (Baril's helmet hole operation)
  lames.py         split a shell into N overlapping lames with the conical
                   kick-out so blows slide down and off
  wear.py          fractal subdivide, vertex-bevel chipping, and Abe Leal's
                   asymmetry-rises-toward-the-centre-line as a real falloff
  handoff.py       ZBrush crossing: remesh to target, apply transforms,
                   declared scale, +Z up, OBJ + _kit.json

  Composition with what you already own: mesh_lib.py in the procedural asset
  skill generates smooth base forms (grid+shell, loft, revolve_profile,
  bumps, rim_flare). Those are exactly what panel_stack wants as a BASE MESH.
      mesh_lib -> base form
      panel_stack -> panels wrapped onto it
      rivets / pierce / lames -> hardware
      wear -> age it
      handoff -> to ZBrush
  Nothing there duplicates the existing library; it sits on top of it.

ZBRUSH — MACROS, AND THE HONEST LIMIT
  The genuine win in ZBrush is not scripting, it is UI. Gatz makes the point
  directly: the transpose-extrude sequence "seems like a lot of steps but
  really this is a fast workflow once you set up some shortcuts."
      Preferences > Config > Enable Customize ON
      Ctrl+Alt+click-drag any button to dock it anywhere around the canvas
      Enable Customize OFF
      save the interface as a file
  Dock: Close Holes, Split Masked Points, Polish By Features, ZRemesher,
  Mirror And Weld, Crease PolyGroup, Dynamesh. Those are the buttons this
  ledger reaches for constantly.
  Also: load brushes you always want (Smooth Directional) into the ZBrush
  startup brushes folder so they are present in every session.

  BRUSH LIBRARIES ARE THE OTHER MACRO
    - one half-sphere IMM for bolts (Hristian)
    - one edge-trim IMM, sized to plate thickness (Hristian)
    - one stitch curve IMM (TriGon)
    - edge brushes and surface brushes for ornament (Royal Skies, who bases
      his shapes on a pentagon)
    - SAVED NOISE PRESETS. TriGon: "metal noise 1, metal noise 2" so the
      surface stack is repeatable instead of re-dialled every time.
  These are reusable assets, and building them once pays on every piece.

  ZSCRIPT — NOT WRITTEN FROM MEMORY
  A ZScript that duplicates a subtool, renames it _LP, polygroups by normal
  angle and ZRemeshes to a target would be genuinely useful. It is not in
  this ledger and will not be guessed, because ZScript interface paths are
  version- and build-specific and writing them from recall produces strings
  that silently do nothing.
  The method that works: record the macro ONCE by hand in your ZBrush. The
  recorded .txt contains your install's real interface paths. Send it over and
  it gets parameterised. One recording from you, zero invented strings.
  The same applies to Brush > Create InsertMultiMesh — the menu path is
  recorded in this ledger as reported by a source, not as verified on your
  build.

AI-DRIVEN BLENDER — what the tooling source actually shows
  The Stefan 3D AI video demonstrates driving Blender through MCP with model
  agents, plus in-viewport AI generation via a sponsor plugin. Treat its
  model-comparison claims as that video's claims, not as findings.
  Two observations from it worth keeping, because he shows the failures:
    - UV unwrapping came out poorly in both agents he tested: fragmented
      islands, wasted UV space. He calls one result "absolutely terrible".
      So: do not hand UVs to an agent and assume they are usable.
    - Retopology is the stage he argues will stay manual, because the
      topology needed for silhouette, deformation and optimisation is
      specific per model.
  Both line up with this ledger's craft sources, which spend real effort on
  exactly those two stages.
