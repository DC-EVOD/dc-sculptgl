ZBRUSH — ARMOUR WORKFLOW
========================
Sources: Gatz 3D (the spine), TriGon (the full build), Hristian Shyne (plates).

THE SPINE — Gatz's five stages, for a whole harness
  1. BLOCK OUT the character. Proportions, sizing, spacing correct BEFORE
     anything else. Everything downstream inherits this.
  2. 3D SKETCH. Draw placeholders for every piece directly on the model.
     Loose and fast. This is not the detail phase. Duplicate and hide the
     base mesh first so you have a backup.
  3. SPLIT every piece off. Mask one piece -> Polygroups > Group Masked ->
     Split Masked Points. Now each piece is independently editable.
     Gatz's Berserk armour was ~50 separate pieces. That is normal.
  4. THICKEN each piece (see below).
  5. REFINE and polish. No gaps showing, silhouette right, proportions right.

  Why this order: it stops you finishing one pauldron beautifully while the
  rest of the harness is still nothing. TriGon says the same thing outright —
  work everything a little, never finish one piece in isolation.

THICKENING A PIECE — the transpose method (Gatz)
  Ctrl+Shift+click the piece            isolate it, hide everything else
  Geometry > Modify Topology > Close Holes   fills the back, makes a new polygroup
  Transpose on, Ctrl+click the FRONT polygroup   masks every other polygroup
  Drag the centre of the three rings     extrudes it
  Deformation > Inflate                  recovers thickness if you thin it too far

  Faster alternative for simple/repeatable pieces: mask it and Subtool >
  Extract at 0.001. Gatz used extract for arms and legs, transpose for the
  torso. Many limb pieces are the same shape — build one, duplicate, move.

GETTING THE FIRST SHAPE — TriGon's extract route
  Mask on the body with mask lasso, then mask pen for precision. Do not fuss
  over the mask; you are freestyling a shape.
  Extract with smoothness 0, thickness 0, Tab Border off. Extract -> Accept.
  Then immediately:
      Polish > Polish By Features      cleans the border
      ZRemesher                        low count, topology you can push
      Polish By Features again
  Inflate slightly (right-click-drag the last ball), Auto Groups, Delete Hidden.

  You now have a cheap base you can shove around. That is the whole point.

FUNCTIONALITY DECIDES THE CUT
  A one-piece chest shell cannot be put on a body. TriGon slices the shell
  down the middle with Slice Curve, hides one half, Split Hidden -> a front
  and a back plate. Decide these splits from how the thing is worn, not from
  how it is convenient to sculpt.

DESIGN EXPLORATION — Dynamesh is the thinking tool
  Add thickness first: Geometry > Dynamic Subdiv, raise thickness, Apply.
  Make it THICK. Too thin creates holes when you Dynamesh. If it comes out
  thin, undo, raise thickness, lower offset (TriGon used offset -100).
  Dynamesh at a LOW resolution — low enough to move freely, not so low the
  form dies. Keep the active point count visible and work to it.

  Then explore. Move, pinch, H Polish, Standard. Re-Dynamesh whenever the
  topology stretches. TriGon: "this is the strength of sculpting over
  traditional poly modelling — it's so easy and fast to just explore."

  BACKTRACK CONSTANTLY. Ctrl+click the timeline to step back and compare.
  Take Shift+S screenshots of variants and judge them side by side.

EQUALIZE CURVE — the one brush setting that changes everything
  Brush > Curve > EQ Curve. Off (default) the Move brush makes ROUND pulls.
  On, it makes POINTED pulls. Turn it on when you want a sharp point or a
  triangular break in the silhouette; off for soft volume. TriGon toggles it
  constantly. This is the difference between fighting Move and steering it.

SILHOUETTE IS THE JOB
  Render > Flat kills all shading and colour so you see pure silhouette.
  Work in it deliberately. TriGon's rule: the armour's job is to BREAK the
  silhouette away from the body underneath. A near-straight line that mirrors
  the torso is the failure state.
  Corollary he states explicitly: do not let the high point of the armour sit
  at the same height on both sides — stagger them, or it reads flat and
  awkward. Same for strap spacing: equal gaps read boring, so break up the
  lengths deliberately.

  And check every angle, not just front and side. He repeats this more than
  any other instruction.

CLEANING THE BLOCKOUT INTO A REAL MESH
  Duplicate the folder. Keep "armour blockout" hidden; work on "armour".

  The goal of the cleanup ZRemesh is a mesh that FOLLOWS YOUR FEATURES:
    Slice Curve along each real crease           -> creates polygroups
    (Slice Curve ignores symmetry: Mirror And Weld after, every time)
    Crease the borders you want kept sharp
    ZRemesher with KEEP GROUPS on, target LOW    -> edges follow the groups
  TriGon: "even if we don't need to follow a line, we can still put in a
  polygroup to force ZBrush to follow that flow." That is the trick — extra
  polygroups are steering, not just selection.

  Then finish by hand: insert loops, Move vertices to catch small features,
  and use Mask By Features + Polish By Features to even out the density.

POLISH BY FEATURES — the workhorse
  It smooths everything BETWEEN masked features while leaving the features.
  Use it constantly. The pattern that recurs all through TriGon:
      Mask By Features  ->  (grow/shrink the mask)  ->  Polish By Features
  Mask the corners you want kept sharp first, or polish will round them off.
  It turns wobbly, lumpy, jagged geometry clean in one click. If ZRemesher
  produces a mess, Polish first and re-run it.

THICKNESS AND CREASES FOR PREVIEW
  Geometry > Crease PolyGroup, then Dynamic Subdiv with thickness on and
  smooth subdiv off, gives a live preview of the plate with hard edges.
  Crease level controls how tight the corner is (0 = soft, 2-3 = crisp).
  When you finally apply: turn smooth subdiv OFF first, apply, then
  Group By Normals (~70), Crease PolyGroup again, and subdivide. Applying
  with smoothing on rounds your corners and creates artifacts.

STAYING HONEST ABOUT DENSITY
  When several pieces sit together, their polygon density should match.
  TriGon's method is blunt and effective: Shift+S a screenshot of the first
  piece's wireframe, then match the others against it by eye.

ORDER OF OPERATIONS, COMPRESSED
  block out body -> 3D sketch every piece -> split -> thicken -> Dynamesh and
  explore design -> decide functional splits -> straps and buckles (they change
  the armour) -> clean up via polygrouped ZRemesh -> crease + apply subdiv ->
  surface noise and damage -> hardware (bolts, stitches) -> bake down.
