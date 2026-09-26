BLENDER — HOTKEYS AND OPERATIONS
================================
Drawn only from the four Blender sources. Anything not stated by a source is
absent rather than guessed.

MODES / VIEW
  Tab                 edit / object mode
  Numpad 1 / 7        front view / top view
  Alt+Z               x-ray toggle
  W                   select box tool
  C                   circle select (left-drag add, middle-drag remove,
                      right-click to finish)
  Ctrl+I              invert selection
  L / Ctrl+L          select linked (under cursor / from selection)
  Ctrl+click a 2nd face   select everything between the two
  F                   adjust brush size (sculpt)
  R                   remesh (sculpt)

TRANSFORM
  G / S / R           grab, scale, rotate
  G twice             EDGE SLIDE (slide a vertex/edge along the surface)
  S X 0               flatten a selection onto an axis
  S then Shift+Z      scale on X and Y only
  Alt+G               clear location (snap object to world origin)
  Ctrl+A              APPLY TRANSFORMS — required before remesh and solidify
  Period              pivot-point pie menu (3D Cursor / Median / Individual
                      Origins / Active Element)
  O                   proportional editing on/off; mouse-wheel sizes falloff
  Alt+S               adjust thickness (curves / shrink-fatten)

MESH EDITING
  E                   extrude
  I                   inset ("Individual" toggle for per-face)
  Ctrl+R              loop cut (mouse-wheel adds cuts)
  F                   fill / make face
  J                   connect two selected vertices with an edge
  M                   merge menu (At Center / By Distance)
  X > Dissolve Edges  remove an edge, KEEP the face
  X > Dissolve Vertex remove a vertex cleanly
  Shift+Ctrl+B        VERTEX bevel (splits a vertex into a triangle)
  P                   separate selection into a new object
  Ctrl+J              join objects
  Shift+N             recalculate normals
  Shift+D             duplicate
  ALT+D               LINKED duplicate — edit one, edit all. Prefer this for
                      rivets, chainmail, repeated hardware.

SNAPPING
  Snapping menu > Grid        then G+Z and hold Ctrl
  Snapping menu > Vertex      with Auto Merge for welding
  Snapping menu > Face  + "Project Individual Elements"
                        + "Align Rotation to Target"    <- the rivet setup
  Shift+S             snap pie (Cursor to Selected, etc.)
  Shift+C             reset the 3D cursor to origin

MODIFIERS / OPERATIONS NAMED IN SOURCES
  Mirror (clipping, bisect, Object target)
  Subdivision Surface — Advanced > KEEP CORNERS
  Shrinkwrap — modes: normal projection / OUTSIDE SURFACE; Offset;
               Vertex Group; must sit BELOW Subdivision, ABOVE Solidify
  Solidify, Bevel, Weighted Normals, Lattice (must be LAST), Array,
  Multiresolution, Remesh (voxel / quadriflow)
  Shade Auto Smooth — place ABOVE Weighted Normals
  Ctrl+L > Copy Modifiers     propagate a stack to many objects
  Object > Link/Transfer Data > Link Materials   (source ACTIVE LAST)
  Set Origin > Origin to 3D Cursor / Center of Mass (Volume)
  Select menu > SELECT SHARP EDGES -> right-click > Mark Sharp / Clear Sharp
  Select menu > Checker Deselect
  Edge menu > Subdivide  (with FRACTAL for random displacement)
  F3                  operator search (e.g. "Convert to Curve")

ADD-ONS USED (all ship with Blender; just enable them)
  LoopTools           right-click > LoopTools > Circle / Loft / Relax
  Extra Mesh Objects  Shift+A > Mesh > Extras > Wall Factory
  ANT Landscape       Shift+A > Mesh > Landscape (preset: Canyon)
  Enable via Edit > Preferences > Get Extensions > search > Install.

SCULPT-MODE ITEMS
  Tool > Advanced > Front Faces Only    back-face masking
  Brushes named in sources: Clay Buildup, Clay Strips, Flatten,
  FLATTEN CONTRAST (sharp edges), Trim, Box Trim, Crease Polish, Grab/Move,
  Polish, Smooth

BLENDER 5 SPECIFICS
  Preferences > Display Graphics > VULKAN backend (faster high-poly sculpt)
  Drag-and-drop an image straight into the viewport as a reference
  Reference image > Image properties > enable PERSPECTIVE
  Light data > TEMPERATURE node (replaces the blackbody hack)
  Render > Color Management > View Transform: Standard / AGX / ACES 1.3 / 2.0
  Radial tiling node
