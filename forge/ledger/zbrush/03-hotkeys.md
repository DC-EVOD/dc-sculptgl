ZBRUSH — HOTKEYS, MENU PATHS AND UI
===================================
Only what appears in the transcripts. Nothing here is recalled from memory;
anything not stated by a source is absent rather than guessed.

SELECTION / VISIBILITY
  Ctrl+Shift+click piece      isolate that piece, hide the rest
  Ctrl+Shift+drag (Trim Lasso / Slice Curve)  cut visibility
  Ctrl+W                      group visible into one polygroup
  Visibility > Grow / Shrink  expand or contract the visible set
  Auto Groups                 polygroup per connected piece
  Delete Hidden               commit a visibility cut
  Split Hidden                split hidden part into its own subtool
  L (in Blender terms "linked") -> ZBrush equivalent is Auto Groups + hide

MASKING
  Ctrl+drag                   mask
  Ctrl+Alt+drag               unmask
  Ctrl+click background       invert mask
  Ctrl+Alt+click mask         SHARPEN the mask (used constantly)
  Mask By Features            mask the polygroup/edge features
  Mask By Smoothness          mask by surface smoothness
  Mask By Cavity              Masking > Cavity, then invert+sharpen+inflate
  Peaks and Valleys           mask generator used for noise breakup
  Back-face masking           Brush > Auto Masking > front faces only
                              (Abe Leal's Blender equivalent: Tool > Advanced
                              > Front Faces Only)

BRUSH MODIFIERS
  Alt (held)                  invert brush direction; also sharpens a
                              DamStandard stroke on a second pass
  Ctrl+drag with drag-rect IMM   place repeats at a LOCKED size
  Brush > Curve > EQ Curve    OFF = round Move pulls, ON = pointed pulls
  Brush > Depth               how deep an IMM inserts (negative sinks it)
  Brush > Auto Masking > Range   stops a Move affecting the far side (set ~7)
  Lazy Mouse                  on for any long clean stroke
  Preferences > Draw > Dynamic Brush Scale   turn down for very small brushes

GEOMETRY / TOPOLOGY
  Geometry > Dynamic Subdiv          live thickness + smoothing preview
  Geometry > Modify Topology > Close Holes
  Geometry > Crease PolyGroup        crease along polygroup borders
  Group By Normals (~70)             polygroup by angle
  ZRemesher + Keep Groups            remesh that FOLLOWS your polygroups
  Polish By Features                 the workhorse cleanup
  Polish > Polish By Features (opened) for a stronger pass
  Dynamesh (+ Groups on)             keeps polygroups from merging
  Subtool > Project > Project History  re-project an earlier history state
  Decimation Master                  cut density before export
  Deformation > Inflate / Unify      recover thickness / normalise size
  Subtool > Extract (0.001)          fast piece from a mask
  Polygroups > Group Masked -> Split Masked Points
  Subtool > Shift+up-arrow           send subtool to top (for Merge Down)
  Subtool > Merge Down               merge (keeps subdivisions if levels match)

STROKE / CURVES
  Stroke > Curve Functions > Frame Mesh By Border
  Stroke > Frame Mesh > creased edges
  Stroke > Curve Mode                enable curve placement
  Stroke > Curve Step                spacing along a curve (0.9 = tight)
  Brush > Create InsertMesh > New    make an IMM from the current tool
  Brush > Create InsertMultiMesh     a SET of pieces in one brush
                                     (menu path not verified on any specific
                                     build — harvest it from a recorded macro)

DISPLAY / VIEW
  Shift+S                     screenshot, for A/B comparison
  Render > Flat               kill all shading — pure silhouette
  Render > Properties > Shadows   toggle shadows off to see interactions
  Preferences > Draw > Front/Back Opacity   see through to a blockout
  Display Properties > Double    show backfaces
  Ctrl+click the timeline     step back through history / refresh a stuck op
  Solo mode                   isolate visually

UI CUSTOMISATION — the real macro win
  Preferences > Config > Enable Customize      turn ON
  Ctrl+Alt+click-drag any button               dock it anywhere on the canvas
  Enable Customize OFF                          lock it
  Save the interface as a file and reload it.
  Gatz: once you dock the transpose-extrude buttons, "really this is a fast
  workflow" — the step count only looks bad before you build the UI for it.
  Also load brushes you always use (Smooth Directional) into the ZBrush
  startup brushes folder so they are always present.

KNOWN FLAKINESS, from the sources
  - Live Boolean sometimes refuses; duplicating the subtool fixes it.
  - Slice Curve ignores symmetry; Mirror And Weld afterwards, every time.
  - Mirror And Weld misbehaves with Dynamic Subdiv on.
  - A stuck operation often recovers with a Ctrl+click on the timeline.
  - Save before any boolean and before projecting history.
