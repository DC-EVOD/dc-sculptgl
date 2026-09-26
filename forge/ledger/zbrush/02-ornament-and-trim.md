ZBRUSH — EDGE TRIM, ORNAMENT AND HARDWARE
=========================================
Sources: Hristian Shyne (trim + ornament), Royal Skies (fast ornament),
TriGon (stitches, buckles, holes).

EDGE TRIM — the raised rim around a plate (Hristian)
  Make the trim geometry first: very simple geometry turned into an IMM brush
  WITHOUT the curve option.
  Then on the plate:
    1. Create an edge in the MIDDLE of the plate's thickness polygons.
    2. Crease it.
    3. Stroke > Frame Mesh > creased edges.   (may need re-creasing, then
       Frame Mesh again — he does it twice)
    4. Size the IMM so it FITS THE PLATE THICKNESS. This is back-and-forth;
       you can type an exact number instead of dragging.
    5. Split Masked, subdivide a couple of times, Dynamesh.
    6. Smooth it — "dynamesh gives you those funky edges for some reason."
  Fitting the trim afterwards: Move Topological plus the OI curve.
  When you Mirror And Weld, SELECT THE MIDDLE as well and nudge it sideways,
  or you get a seam instead of a perfect edge.

ORNAMENT — the fast route (Royal Skies, ~2 minutes)
  You want two brush TYPES: edge brushes and surface brushes. He bases his
  brush shapes on a pentagon.
    1. Stroke > Curve Functions > FRAME MESH BY BORDER.
    2. Pick a curve edge brush, left-click to create the borders.
       Free fallback if you have no edge brush: Curve Tubes (ships with
       ZBrush). "A little round but definitely better than nothing."
    3. For ornament shapes from a library: pick the brush, raise Brush
       Modifiers > Projection Strength, place them.
    4. For small details: custom surface brush, drag curves wherever.

ORNAMENT — the sculpted route (Hristian)
  1. Duplicate the plate mesh, clear its layers.
  2. NEGATIVE inflate it by about 0.3 — just enough to hide inside the
     original plate. Re-Dynamesh.
  3. Chisel brush, pulled to Z. KEEP THE INTENSITY LOW. His stated reason:
     the stronger it is, the more it inflates above the original plate, and
     that "can give you some problems while retopo."
  4. Always use Lazy Mouse. With a tablet, pressure takes you thin-to-thick.
  5. Re-Dynamesh (the stroke geometry is distorted), then Smooth Peaks to
     massage it down.
  6. Clay Buildup to FILL THE GAPS the stroke left and make it consistent.
     "After all, this is a sculpting program."
  7. Standard to sharpen strokes; DamStandard on top of the plate for depth.
  8. Standard with alpha 01 to add strokes that make the lines read as
     GRAFTED ON rather than stamped.
  9. Draw a line around the ornament (Standard + alpha) to create the
     embedded/inset effect — it bakes into a clean separation and lets you
     isolate that band in Substance later.
 10. Give the ornaments their own surface-detail pass, but don't go crazy —
     it's a small part of the plate.

  ORNAMENT SYMMETRY WARNING (Hristian, learned the hard way): when the plate
  underneath has asymmetric damage, symmetric ornaments stop looking
  symmetric — parts get hidden, parts get exposed. You have to go back and
  fix by hand. The retopo will be asymmetric too. Plan for it.

HOLES THROUGH LEATHER OR PLATE (TriGon)
  Append a cylinder, Group By Normals, Crease PolyGroup, subdivide, delete
  low. Live Boolean ON, set to SUBTRACT.
  Give the cylinder polypaint (dark) so you can see the hole while placing.
  Space them evenly; make the one the hook grabs more STRETCHED so it reads
  worn. Mirror And Weld the whole set.
  Then: duplicate before committing (boolean is destructive), Make Boolean
  Mesh, and SAVE FIRST — "booleans are complex operations and you never know."
  Afterwards the boolean mesh needs ZRemesher with polygroups steering it;
  build front/back/side polygroups by Visibility > Shrink + polygroup so the
  remesh keeps a clean middle edge you can later use as a UV seam.
  If the cutters don't penetrate all the way: layer + strong Polish, Adjust
  Last set small, offset to -5 grows them through; then deflate back to size
  and compare against the history.
  Finish with Geometry > Close Holes or the caps read wrong.

  Live Boolean is flaky. TriGon's workaround, used repeatedly: duplicate the
  subtool and it starts working again.

BUCKLES — modelled, not sculpted
  TriGon blocks buckles in ZBrush from a cube with Live Boolean, Bevel Arc
  (tap, drag, WAIT a second, then go back — that timing is the brush), then
  Dynamesh + polish. But the FINAL buckle he models in Maya/Blender, because
  he wants to reuse the first subdivision as the low poly.
  Key judgement he demonstrates: evaluate the buckle ZOOMED OUT, at the
  distance it will actually be seen. He picks the version that reads better
  at armour scale, not the one that looks better in close-up.

STITCHES — curve IMM (TriGon)
  Model one stitch in Maya/Blender: a curve, sweep mesh, sides ~4, distribute
  to 3 tubes, twist them, scale profile down. Keep it LOW — stitches multiply
  fast. A lattice deform pinches the ends.
  Import to an empty tool, turn PERSPECTIVE OFF, view it flat on, then
  Brush > Create InsertMesh > New. Save the brush.
  Use it: Stroke > Curve Mode on (set to Dots if it won't snap), Lazy Mouse
  on, tune brush Depth so they sink in.
  Stroke > Curve Step controls spacing — lower = tighter. He used 0.9.
  Hint the stitch lines FIRST with DamStandard + Lazy Mouse, then follow the
  lines. Don't run them too close to the border or too far from it.
  Finish: Snake Hook a few stitches loose to break the perfection, then two
  noise passes (a small one and a bigger one at ~0.2/0.04) so they aren't
  identical. Deflate if the noise fattened them.

THE LEATHER TRICK WORTH STEALING — cavity spikes
  On the rough middle layer of a strap:
    Masking > Cavity, low value (~2) > Mask By Cavity
    Ctrl+click to invert, Ctrl+Alt+click a few times to sharpen
    Inflate — at the RIGHT value you get fine fuzz/fibres
  TriGon tunes this precisely: 1.0 gives nothing, 2.0 is too much, 1.34 too
  little, 1.4 is correct. Then morph-brush some away for length variety.
  "It's like one of my favourite things to add because it's such an easy
  little thing and it adds so much."

LEATHER AS SKIN — the detail that sells it
  When you punch INTO leather, the material next to the punch RAISES. So
  after the indent pass, take Standard or Clay and raise the surrounding area
  slightly. "It's going to make it look very like fleshy and more like real
  skin instead of that plastic look."
