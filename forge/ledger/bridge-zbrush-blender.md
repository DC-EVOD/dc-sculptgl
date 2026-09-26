THE BRIDGE — ZBRUSH <-> BLENDER ROUND TRIP
==========================================
This is the ONLY document where the two tracks touch. It covers the HANDOFF,
not a blend. Keep working in one tool at a time.

Your stated idea: mask-extract shapes in ZBrush, take them to Blender for
easier manipulation, come back to ZBrush for the topology brush, IMMs and
polypaint. That is a real working pipeline, not a compromise. Here is what
makes it smooth instead of miserable.

WHAT EACH TOOL IS ACTUALLY BETTER AT
  ZBRUSH OWNS
    mask -> extract: fastest way in existence to get an armour shell off a body
    Dynamesh design exploration — shove the form without topology guilt
    DamStandard / Trim / Slash / Flatten damage and metal storytelling
    IMM brushes: edge trim, bolts, stitches, chainmail, ornament stamps
    layers + morph target (non-destructive passes with an intensity dial)
    polypaint
    ZRemesher with polygroup steering

  BLENDER OWNS
    the shrinkwrap panel method — detail topology free of the form
    vertex-group-driven offsets (rolled lips, crests, recessed beds) that stay
      fully parametric and re-tunable
    exact parametric operations: Spin with known Angle/Centre, Array, Mirror
    precise re-centring and origin control
    lattice deformation
    booleans that are predictable
    non-destructive modifier stacks you can revisit months later

  Neither owns "sculpting" or "modelling" outright. Route by the OPERATION.

THE ONE THING THAT DECIDES WHETHER THIS IS PLEASANT
  A raw ZBrush Extract is dense, uneven and triangulated. Blender's modifier
  stack — Subdivision, Shrinkwrap, Solidify, Bevel — assumes reasonably even
  quad topology. Feed it a raw extract and every modifier fights you.

  SO: ZREMESH BEFORE YOU CROSS. Always.
      Extract -> Polish By Features -> ZRemesher LOW -> Polish By Features
  TriGon does exactly this inside ZBrush already, for his own reasons. It is
  also precisely what makes the mesh Blender-ready. One step, two payoffs.

  Low is right. Baril's whole method depends on low vertex counts being easy
  to push; Abe Leal says the same about avoiding dense blockouts. A 2-5k quad
  shell is a good crossing weight.

GOING ZBRUSH -> BLENDER
  1. ZRemesher low, with Keep Groups if you have creases worth preserving.
  2. Decimation Master only if the machine struggles — not for a shell.
  3. Export OBJ.
  4. In Blender: Ctrl+A apply transforms immediately. Check scale (below).
  5. Build the panel stack on it (see blender/00-shrinkwrap-panel.md), or use
     it as the BASE MESH and shrinkwrap new panels onto it.

  The second option is the strong one. A ZBrush extract is a perfect base
  mesh: it already follows the body, it is smooth, and you never edit it
  again. All the plate detail happens on shrinkwrapped panels above it.

GOING BLENDER -> ZBRUSH
  1. Apply the modifier stack (or apply a copy and keep the parametric one).
  2. Ctrl+A apply transforms.
  3. Export OBJ.
  4. Import into an empty ZTool, Dynamesh or subdivide, then detail/polypaint.
  If you are making an IMM from it: turn PERSPECTIVE OFF and view it flat on
  BEFORE Brush > Create InsertMesh > New. Both TriGon and Baril note this.

SCALE — the thing that bites
  ZBrush is unit-agnostic; Blender is not. Pick ONE convention and write it
  down, because the whole kit has to share it or pieces won't compose.
  The forge already declares one, and the procedural asset skill uses it:
      +Z up, +Y front, X left/right, humanoid = 1.8 units tall
  Baril works in MILLIMETRES for armour detail (3 mm plate, 3.5 mm for a
  layered sheet, 6 mm for a deep offset). Those numbers only mean anything if
  the scene scale is fixed. Set it once.
  In ZBrush, Deformation > Unify normalises a piece that comes in wildly
  sized; use it to recover, not as a substitute for a convention.

POLYPAINT SURVIVES THE ROUND TRIP
  Polypaint is per-vertex colour. Exported as OBJ/PLY vertex colours it lands
  in Blender as a COLOR ATTRIBUTE.
  The forge already handles this: forge/intake.py transfers vertex colours
  across a remesh by KDTree nearest-vertex. So polypaint is not lost when you
  clean or remesh a returning sculpt.
  Caveat stated honestly: polypaint needs DENSITY. A 2k crossing mesh cannot
  carry meaningful polypaint. Paint after you are back at high subdivision,
  or bake it to a texture instead.

WHAT NOT TO ROUND-TRIP
  Don't bounce a piece back and forth repeatedly. Each crossing costs topology
  fidelity and UVs. Decide the ORDER once:
      ZBrush block + extract  ->  Blender panel/parametric pass  ->
      ZBrush detail + polypaint  ->  retopo  ->  bake
  One crossing each way. If you find yourself on the third, the piece wants to
  live in one tool.

DOING IT WITHOUT THE ROUND TRIP
  Both tracks can finish a piece alone. The bridge is worth it when you want
  ZBrush's damage vocabulary AND Blender's parametric edge control on the same
  plate. For a piece that is mostly hand-damaged metal, stay in ZBrush. For a
  piece that is mostly precise repeated hardware, stay in Blender.
