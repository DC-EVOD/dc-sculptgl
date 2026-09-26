BLENDER — HIGH-POLY HARD-SURFACE SCULPT
=======================================
Source: Abe Leal 3D, "Blender 5.0! Modelling and Sculpting Armor" (livestream;
the craft is interleaved with chat — the raw file is 147,784 characters and
most of it is not technique).

THE GOVERNING LAW — build it the way it was built
  His headline instruction, stated as the one thing to pay attention to:
  "we need to think of this in the way it was built. Please look at how the
  thing was built."
  And later, as a portfolio-review note: always do this kind of object in
  MULTIPLE PIECES, "the way they would normally or traditionally be built,"
  because otherwise "your objects are not going to look as realistic."
  Never sculpt a multi-part object from one blob.

REFERENCE — museum collections
  Use museum collections (he used the Met). Real artefacts photographed
  square-on: front, side, back, plus close-ups of the engraving. Better than
  any photo pack. Auction sites also work.
  His subject: an Italian jousting helmet, c. 1475-1500.
  A real artefact is NOT symmetrical — pick the straighter side and model
  that; rotate the reference so it is axis-aligned first.

  Blender 5 reference handling:
    drag-and-drop an image straight into the viewport
    select the image > Image properties > enable PERSPECTIVE so it shows in
    perspective view, not only orthographic
    Blender 5 auto-hides a reference when you rotate away from it
    push the far reference plane back so it doesn't occlude your blockout

BLOCKOUT
  Start from a primitive matched to two extreme points in front view (he used
  a cylinder), then check it in side view.
  Delete one half's faces early; mirror later.
  Work in VERTEX mode with wireframe on to push silhouette. Add centre edge
  loops to capture curvature.
  RULE OF THUMB he states: edge spacing should be RELATIVELY uniform — "it
  doesn't have to be perfectly uniform, but relatively uniform always helps."

  Mirror prep: select centre vertices, S X 0, snap to grid, G X to origin,
  add Mirror, apply. He also uses Mirror with BISECT on X for a clean cut.

SCULPT-ASSISTED POLYMODELLING
  Jump to Sculpt mode with X symmetry and use Smooth + Grab to fix curvature
  that is painful in edit mode, then come back. Clean topology is what makes
  this viable. He moves back and forth constantly rather than committing to
  one mode.

SUPPORT EDGES
  A sharp edge under Subdivision needs a support edge beside it (or bevel the
  border). He adds support edges at every border before subdividing. Without
  them you get the "horrible looking" rounded mush.

PANEL SEAMS — bevel then delete
  To create a TRUE gap between two plates:
      select the edge that is the real seam
      BEVEL it very small
      DELETE the resulting faces
      then Solidify for thickness, then Subdivision
  This gives a real physical gap rather than a painted line.

THE THICKNESS LAW
  "You always want to make them a little bit thicker than they actually are
  in the real world." Razor-thin edges alias badly in engine and read poorly.
  "Making things just a little bit chunkier than they would be in the real
  world is a good way to get a nicer effect."

MULTIRES vs REMESH — when to use which
  MULTIRES when topology is already clean and even and you want to KEEP it
  (he cites Blender Foundation base meshes). He subdivided 1-2-3 to ~1M polys.
  REMESH otherwise — and he expects to retopologise later anyway, so dirty
  topology in the high poly is fine and normal.

  Voxel sizes he actually used: 0.01 typical. 0.001 produced 44 MILLION polys
  ("way too much"). 0.007-0.01 for smaller parts.
  APPLY TRANSFORMS (Ctrl+A) BEFORE REMESHING — otherwise you get stretched
  faces. He hit this live and called it out as very important.
  Apply modifiers before remesh.
  Separate pieces first: Edit > face mode > L (select linked) > right-click >
  Separate > Selection. This is Blender's equivalent of ZBrush subtools.

BRUSH ROSTER
  Clay Buildup / Clay Strips   volume, surface variation, form
  Flatten                      planar effect
  FLATTEN CONTRAST             sharpen the border of a dent; make the brush
                               very small for genuinely sharp edges — his
                               answer to "how do you get sharp edges in sculpt"
  Trim brushes                 sharpen and cut
  Crease Polish / knife        push a crease in
  Grab / Move                  silhouette
  Polish                       clean jagged remesh edges
  Box Trim                     boolean cut — and it outperformed ZBrush in his
                               live test ("Blender gets a point for me today")
  Tool > Advanced > Front Faces Only    back-face masking
  F                            adjust brush size
  R                            remesh shortcut

SURFACE IMPERFECTION
  "A very common mistake with 3D stuff is that it tends to look way too
  perfect." Add bumps, dents, hammered variation deliberately — it should read
  as cast and hammered metal, as if "someone actually hammered this thing."
  He also keeps blockout imperfections on purpose: "I feel like this can give
  it a little bit more history."
  Add a little noise/texture variation to nearly everything — skin, leather,
  metal — to make surfaces read as complex.

THE ASYMMETRY RULE — the sharpest idea in this source
  "The closer you are to the centre line of your object, the more obvious the
  symmetry looks." You can never see both far-side details at once, so those
  can stay mirrored. Details NEAR THE CENTRE LINE need deliberate asymmetry.
  So: turn symmetry off and rebuild centre details slightly differently.
  Corollary he applies: a part sitting very close to the centre line gets
  sculpted with symmetry off entirely.

THE OVERLAP LAW
  Where two pieces meet, create a deliberate OVERLAP, and push the back
  section further in. Two payoffs he names:
      1. easier retopology — you can retopo the pair as ONE piece
      2. a much better ambient-occlusion bake / cast shadow
  This is a high-poly decision made for the sake of the bake.

BOLTS AND RIVETS
  Never sculpt them from the main mesh — "the edge that you get there is
  really really bad."
  Instead: add a UV sphere, scale on Y to flatten, ROTATE to follow the
  surface curvature, apply transforms, mirror. It bakes far better.
  Then Trim brush for little hits so it reads hammered in.
  Snapping: Point on Surface / Face Project to attach them to the surface.
  REUSE: separate one finished bolt (L > Separate), Set Origin > Center of
  Mass (Volume), then duplicate and ROTATE each copy so a different face
  shows. "Work smart, not hard" — they all bake nearly flat anyway.

WHAT BELONGS IN TEXTURE, NOT SCULPT
  Micro detail — scratches and fine wear — goes in texturing, not the sculpt,
  "unless I'm doing something for 3D print." Don't burn sculpt time on it.

RENDERING (Blender 5)
  World > Color > Environment Texture > HDRI (he used Poly Haven).
  Strength ~0.1 to 0.2 — do not let the HDRI do all the work.
  Cycles, device GPU.
  LIGHTING: instead of the usual three-point, a very large AREA light
  overhead (product-render style), then Shift+D copies to each side as rim
  lights. That leaves a dark band down the centre, which is the look.
  Blender 5 adds a TEMPERATURE node for light colour — replaces the old
  blackbody hack.
  A FLOOR PLANE IS MANDATORY for metal: without it there is nothing to
  reflect. Make the background darker than a light subject so it pops.
  Color Management > View Transform: Standard blows out highlights; AGX tames
  them but flattens; ACES 1.3 / ACES 2.0 are new in Blender 5 (film-industry
  profile). AGX carries Look presets (high/medium/low contrast).
  Camera > View > Camera to View for framing.
  Material transfer: select all with the source ACTIVE LAST, then
  Object > Link/Transfer Data > Link Materials.

BLENDER 5 NOTES HE VERIFIED LIVE
  Preferences > Display Graphics > VULKAN backend. He sculpted 6 million
  points smoothly and reported a real improvement, including on an old laptop.
  Radial tiling node (feed it a tileable texture; centre distorts, cap it).
  Shade Smooth belongs on the small hard-surface sub-pieces.
