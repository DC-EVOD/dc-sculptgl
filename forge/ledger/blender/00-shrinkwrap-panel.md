BLENDER — THE SHRINKWRAP PANEL METHOD
=====================================
Source: Baril3D, both videos (armour + spangenhelm). This is the single most
reusable Blender technique in the ledger, and the one worth automating.

THE IDEA
  Split the job in two. A BASE MESH carries the smooth form. A WORKING PANEL
  carries the detail, and is shrinkwrapped onto the base. Now the panel's
  topology is free — you can cut loops, inset, punch holes, make a mess — and
  the surface curvature stays perfect, because the curvature lives on the base
  mesh, not on the panel.

  Baril, after deliberately making ugly topology: "even though this is really
  ugly topology, we have perfect reflections all over the mesh."

  This is the Blender analogue of what Dynamesh does for ZBrush: it decouples
  "what shape is it" from "what geometry describes it."

SETUP — exact order, both videos agree
  Working panel modifier stack, top to bottom:
      Mirror                  clipping ON
      Subdivision Surface     level 2; Advanced > KEEP CORNERS
      Shrinkwrap              target = the base-mesh copy
      Solidify                ~3 mm
      Bevel                   small, 1 segment
      Weighted Normals
  Plus Shade Auto Smooth, placed ABOVE the Weighted Normal modifier.

  Base mesh copy:
      same object duplicated into a "Base Mesh" collection
      Subdivision Surface raised to 5 (4 if the machine is slow)
      Solidify DISABLED  <- important. Baril: the final mesh "will try to
      project itself onto the solidified edge and that's not great."
      hidden in viewport and render

  KEEP CORNERS matters: it holds corners sharp instead of spending polygons
  tightening them.
  APPLY SCALE before Solidify or the thickness is wrong.

BUILDING THE PANEL SHAPE
  Start from ONE VERTEX. Delete everything else, then extrude to trace the
  silhouette in front and side view. Keep the vertex count minimal — Baril
  repeatedly says low counts make it easy to edit later, and that a cylinder
  cut in half is "a lot less flexible than just extruding single vertices."
  Mirror clipping: select the centre vertices and move on X so they clip back
  onto the axis.
  Shift+N to recalculate normals when shading goes wrong.
  S X 0 flattens a row onto an axis.
  Two extrusions instead of one where you need curvature.

VERTEX-GROUP OFFSETS — the part that makes it powerful
  A second (and third) Shrinkwrap, each driven by its own vertex group, moves
  geometry off the base surface WITHOUT touching a single vertex position.
    Group "wrap"   = all vertices      -> Shrinkwrap 1 (normal projection)
    Group "offset" = a subset          -> Shrinkwrap 2:
                                          Mode = OUTSIDE SURFACE
                                          Offset = 3 mm
                                          Vertex Group = offset
  Result: a rolled sheet-metal lip standing proud of the surface, fully
  re-tunable, and still flat in edit mode.
  Stack a third for deeper offsets (6 mm) or set it INSIDE for recessed
  rivet beds.
  Remove vertices from the group to soften the falloff where it's too strong.
  Baril uses exactly this for the greave's rolled top edge, the helmet's
  raised crest, and the recessed rivet holes.

SECOND SHEET / LAYERED PLATES
  Duplicate faces, P > Separate, then offset 3.5 mm rather than 3 — the half
  millimetre creates a visible gap so it reads as two sheets, not one.

BANDS AND LAMES — the spangenhelm logic
  On the helmet, Baril loop-cuts and SEPARATES each metal band into its own
  object, all shrinkwrapped to the SAME base mesh. That is literally how a
  spangenhelm is built (bands over plates), and it is why it reads as real.
  Generalise: separate along the real construction seams, not arbitrary ones.

RIVETS
  Geometry: circle with 6 vertices, scaled down, extruded twice, flattened.
  Pivot at the base. APPLY SCALE. Origin at the base of the rivet — or
  slightly below, so a lip sinks into the surface and it still reads on a
  curved panel.
  Placement: snapping magnet ON, snap to FACE, and tick BOTH
      Project Individual Elements
      Align Rotation to Target
  Then Alt+D (LINKED duplicate, not Shift+D) so editing one edits all — Baril
  notes it is both more performant and easier.
  Pivot = Individual Origins to scale them all independently.
  Mirror modifier with Object set to the armour piece.
  Rivets sit in LINES near edges. Turn snapping off before modelling anything
  else.

RIVET HOLES — the LoopTools route (helmet)
  Select the face row -> Select > Checker Deselect -> Inset -> right-click >
  LoopTools > Circle -> Pivot = Individual Origins -> scale down -> delete
  faces -> extrude inward and scale slightly for a protective rim.
  Tip Baril gives after doing it the long way: INSET TWICE up front and you
  skip the extrude step entirely.
  Fix ragged surrounds by selecting the loop, extruding slightly on X, filling.

CHAINMAIL LINKS
  Circle, 12-16 vertices, scaled down. In edit mode duplicate one vertex and
  reconnect after deleting the original -> an OPEN circle. Extrude once.
  Add Subdivision, convert to CURVE, apply scale, raise curve geometry depth,
  tick FILL CAPS to close the ends. Alt+D instances, rotate around the local
  axis. Propagate the mirror with Ctrl+L > Copy Modifiers.

LATTICE — last resort, and last in the stack
  Select all parts, Shift-select the lattice LAST, Ctrl+P > Lattice Deform.
  The lattice modifier must sit at the very END of the stack.
  Baril is explicit about the cost: afterwards the mesh "pops off" in edit
  mode and becomes annoying to edit. So:
      do not model with the intention of needing a lattice
      use it only at the end, to fix proportions you got wrong
      for a simple piece, just model the base mesh properly instead
  Propagate to rivets with Ctrl+L > Copy Modifiers (expect to fix a few).

STRAPS, HINGES, BUCKLES
  Duplicate a face, P > Separate, flatten, build the hinge, mirror.
  Strap: trace a rough circle profile, extrude keeping thickness consistent,
  curve it outward. Solidify + small Bevel + Weighted Normal + Auto Smooth.
  Apply scale; ~3 mm thickness.
  Buckle loop: duplicate an edge, F3 > Convert to Curve, thicken via curve
  geometry, Alt+S to adjust thickness, convert back to mesh to bevel.
  CYCLES SHORTCUT: use a Bevel NODE in the shader instead of a Bevel modifier
  — same look, far less geometry.

CUIRASS TOPOLOGY NOTES
  Trace the collar, extrude single vertices, S X 0 to flatten rows.
  Build a LOOP that runs around the shoulder and armpit — edges that follow
  the form give clean bands later; a straight edge there creates a weird band.
  The apex sits just below the sternum.
  Leave padding room. Baril: a knight would not wear plate directly on skin,
  there is always fabric or padding underneath. Model the gap.

ORGANISATION
  M > new collection per piece group (cuirass, greave, base mesh).
  Right-click collection > Select Objects to grab a whole group.
  RENAME EVERYTHING — shrinkwrap targets are referenced by name, and with 30+
  rivet objects an unnamed scene becomes unusable.
