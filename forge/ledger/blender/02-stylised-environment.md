BLENDER — STYLISED MODULAR ENVIRONMENT
======================================
Source: Ironbark Games Studio, "How to Build Detailed Game Worlds in Blender".
NOTE: this series targets UNITY, not Unreal. Terrain is sculpted in Unity;
Blender builds the modular kit that sits on it.

PLANNING FIRST
  Decide type and art style, then collect reference. His scene: a desert with
  a river carved through canyon cliffs, ruined stone arches and bridges.
  Stated influences: Elden Ring and Horizon Zero Dawn for brick/column
  architecture; Journey for a lower-poly stylised look but "not quite as
  simplified."
  Do a simple BLOCKOUT of the scene, in engine or in Blender. It tells you
  what assets you need, what scale they are, and how they fit.

GRID SNAPPING
  Snapping menu > Grid. Then G + Z and hold Ctrl to snap to the grid floor.
  Used to seat every architectural piece on a clean plane.

THE ARCH / PILLAR — exact build
  1 m cube, S 0.5 -> a 1x1 m cube. Face-select the base, G Z -0.4 -> a 10 cm
  platform. Ctrl+R loop cuts (mouse-wheel up once = two loops), then
  S X 1.9 on one pair and S Y 1.9 on the other.
  Extrude E 0.5, then E 0.1 three times.
  Delete all back and base faces you'll never see.

  TRIANGLE FAN CLEANUP: turn on Auto Merge Vertices AND vertex snapping, then
  snap the top vertices together. They merge, forming a triangle fan. This
  saves polygons and makes later joins cleaner.

  RADIAL DUPLICATION — model ONE side, get four:
      press Period -> set Pivot to 3D CURSOR
      Shift+D, right-click (cancels the move), R Z 90
      repeat three times
  Auto-merge welds the seams. Period again to return the pivot to Median.

  Cylinder for the column: vertices = 20, delete top and bottom faces,
  S then SHIFT+Z to scale on X/Y only (not Z).
  Detail via loop cuts then scaling loops in and out.
  Ctrl+L selects linked — duplicate the base detail up to the capital.

THE SPIN TOOL — how the arches are made
  Select the top faces, go to front view (Numpad 1), pick the Spin tool, set
  it to the Y AXIS, drag out the curve, then fix it in the operator panel:
      Steps 8
      Angle 90            (or -90 for the bridge)
      adjust Centre X / Z arrows to place the arc
  For the bridge he knew the exact geometry, so: Angle -90, Centre Z = 3 for
  the small arch and Centre Z = 3.5 for the enlarged centre arch. Exact
  numbers beat eyeballing when the spacing is known.
  Then Mirror modifier, move the half across on G Z to set the gap.

SHADING — sharp edges are MARKED, not modelled
  Edge select > Select menu > SELECT SHARP EDGES > right-click > Mark Sharp
  -> Tab out -> right-click > Shade Smooth.
  Manually Mark Sharp anything it missed. Clear Sharp to soften.
  This is the whole stylised look: smooth curved surfaces, crisp hard edges,
  no wasted geometry.

BRICK WALL — the Wall Factory add-on
  Enable: Edit > Preferences > Get Extensions > search "extra mesh objects"
  > Install. Then Shift+A > Mesh > Extras > Wall Factory.
  His exact settings for a compact, tileable 2x2 m wall:
      start 0.01        end 2
      bottom 0          top 2
      edging 0.15       width 0.12
      variance 0.15     minimum 0.31
      height 0.16       height variance 0.15    height minimum 0.07
      depth 0.2         depth variance 0.04     depth minimum 1
      grout thickness 0.01   grout variance 0.01
      grout depth 0.16       grout depth variance 0
      openings OFF

  FRACTAL SUBDIVIDE — instant stylised wear:
      select all > Edge menu > Subdivide > set FRACTAL = 1.2
  Random per-vertex displacement, so you don't hand-vary every brick. Then
  hand-fix the outliers that poke too far.
  X > DISSOLVE EDGES (not Delete) removes a loop without killing the face.

  VERTEX BEVEL — the signature chipped-stone corner:
      Shift+Ctrl+B on a vertex -> splits it into a triangle
      double-tap G to slide the vertex
      select two opposite vertices of a 4-point bevel and press J to cut an
      edge across, giving a central vertex you can push for a chunk-out
  Over-beveling overlaps vertices: Alt+Z x-ray, marquee select, M > Merge By
  Distance — or leave Auto Merge on.

THE BRIDGE
  Plane size 3, rotate Y 90, G Z 1.5, G X -2. Loop cut centre, delete half,
  Mirror on X AND Y with clipping.

  RE-CENTRING A MESH PRECISELY — the trick worth memorising:
      select the two inner vertices
      Shift+S > Cursor to Selected
      Tab out, right-click > Set Origin > Origin to 3D Cursor
      Alt+G  (moves object to world centre)
      Shift+C (resets cursor)
  This is how he converts an APPLIED array back into a centred, mirrorable
  piece so the middle arch can be made bigger than the rest.

  Array modifier: count 5, offset X 1.1 for spacing. Apply, then re-centre.

  PROPORTIONAL EDITING (O): select the end edges, G Z, mouse-wheel to size
  the falloff circle -> a smooth bulge across the whole bridge deck.
  TURN IT OFF before other edits.
  S 0 flattens a face selection; then G Z + Ctrl to snap it down.

  Holes through the deck: place a loop cut so it intersects an arch, then
  push the vertices so the SEAM HIDES INSIDE the arch's bevel.
  Select one face, hold Ctrl, click another -> selects everything between.
  I to inset; tick INDIVIDUAL for per-face insets, untick for joined.
  M > Merge At Center; X > Dissolve Vertex.

CLIFFS — the ANT Landscape add-on
  Enable: Edit > Preferences > Get Extensions > search "landscape".
  Shift+A > Mesh > Landscape. Operator preset: CANYON.
      Y subdivisions 400        mesh size Y 4
      Offset Y slides along the canyon to find a section you like
      Shape: wave (long ridge) vs bump (individual peaks)

  HARVESTING a cliff section:
      top view (Numpad 7), C circle-select the region you want
      Ctrl+I to invert, X > delete vertices
      select the outer border vertices
      O proportional editing with a SMALL falloff, then S 0
        -> flattens the skirt down so it sits on the grid
      G Z to seat it, Subdivision modifier for more resolution
  These are BACKGROUND cliffs — not walkable, so the base never shows and
  rough edges don't matter. Scale them up at the end against the architecture.

THE SCALE DISCIPLINE (also stated by the pipeline sources)
  Work largest to smallest. If the scale is wrong, fix the big shapes first —
  never compensate downstream.
