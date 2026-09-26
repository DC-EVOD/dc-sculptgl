"""make_reference.py - builds the DC ARMOUR REFERENCE screen card (PDF).

16:9 landscape, dark, high-contrast: meant to sit open on a second screen
while you sculpt, not to be read front to back.

Palette matches the DC tooling reports (kitbash muster HTML):
    bg #0b0a10   text #d9d6e0   h1 #8F69E9   h2 #4BAFD1   rule #2F3138

Content is drawn from forge/ledger/. Every hotkey and setting on these pages
traces to a transcript in forge/ledger/raw/ -- see forge/ledger/sources.md.

  python3 make_reference.py [out.pdf]
"""
import sys
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import simpleSplit

W, H = 960, 540                       # 16:9 points
BG   = HexColor("#0b0a10")
TXT  = HexColor("#d9d6e0")
DIM  = HexColor("#8b869a")
H1   = HexColor("#8F69E9")
H2   = HexColor("#4BAFD1")
RULE = HexColor("#2F3138")
KEY  = HexColor("#e8e4f0")
WARN = HexColor("#E9A369")

M      = 34                            # margin
COLW   = (W - M*2 - 26) / 2            # two columns
LEAD   = 16.1                          # body leading
page_n = [0]

def page(c, title, sub=""):
    if page_n[0]: c.showPage()
    page_n[0] += 1
    c.setFillColor(BG); c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(H1); c.setFont("Helvetica-Bold", 27)
    c.drawString(M, H - M - 6, title)
    if sub:
        c.setFillColor(DIM); c.setFont("Helvetica-Oblique", 12.6)
        c.drawString(M, H - M - 21, sub)
    c.setStrokeColor(RULE); c.setLineWidth(1)
    c.line(M, H - M - 29, W - M, H - M - 29)
    c.setFillColor(DIM); c.setFont("Helvetica", 9.5)
    c.drawRightString(W - M, 15, "DC ARMOUR REFERENCE  ·  forge/ledger  ·  page %d" % page_n[0])
    return H - M - 48

class Col:
    def __init__(self, c, x, y): self.c, self.x, self.y = c, x, y
    def head(self, t, color=H2):
        self.y -= 4
        self.c.setFillColor(color); self.c.setFont("Helvetica-Bold", 15.2)
        self.c.drawString(self.x, self.y, t); self.y -= 19
    def row(self, k, v, kw=170):
        """monospace key + wrapped description"""
        self.c.setFillColor(KEY); self.c.setFont("Courier-Bold", 11.4)
        self.c.drawString(self.x, self.y, k[:24])
        self.c.setFillColor(TXT); self.c.setFont("Helvetica", 12.4)
        for i, ln in enumerate(simpleSplit(v, "Helvetica", 12.4, COLW - kw)):
            self.c.drawString(self.x + kw, self.y - i*LEAD, ln)
            n = i
        self.y -= LEAD * (n + 1) if v else LEAD
    def line(self, t, color=None, font="Helvetica", size=10.2, indent=0):
        self.c.setFillColor(color or TXT); self.c.setFont(font, size)
        for ln in simpleSplit(t, font, size, COLW - indent):
            self.c.drawString(self.x + indent, self.y, ln); self.y -= LEAD
    def step(self, n, t):
        self.c.setFillColor(H1); self.c.setFont("Helvetica-Bold", 12.6)
        self.c.drawString(self.x, self.y, str(n))
        self.c.setFillColor(TXT); self.c.setFont("Helvetica", 12.4)
        for i, ln in enumerate(simpleSplit(t, "Helvetica", 12.4, COLW - 17)):
            self.c.drawString(self.x + 17, self.y - i*LEAD, ln); n2 = i
        self.y -= LEAD * (n2 + 1)
    def gap(self, n=6): self.y -= n
    def rule(self):
        self.c.setStrokeColor(RULE); self.c.setLineWidth(0.6)
        self.c.line(self.x, self.y + 3, self.x + COLW, self.y + 3); self.y -= 8

def build(out):
    c = canvas.Canvas(out, pagesize=(W, H))
    c.setTitle("DC Armour Reference")

    # ---------------------------------------------------------------- COVER
    y = page(c, "DC ARMOUR REFERENCE", "Screen card. Distilled from 11 tutorials — forge/ledger/")
    L, R = Col(c, M, y), Col(c, M + COLW + 26, y)
    L.head("WHAT THIS IS")
    L.line("Eleven armour/asset tutorials transcribed in full and boiled down to the moves that transfer. "
           "Two tracks, kept separate on purpose: ZBrush leads, Blender runs alongside.")
    L.gap(); L.rule()
    L.head("PAGES")
    L.row("2", "ZBrush — armour workflow, step by step", 38)
    L.row("3", "ZBrush — hotkeys and menu paths", 38)
    L.row("4", "ZBrush — brush roster: what each is for", 38)
    L.row("5", "Blender — the shrinkwrap panel method", 38)
    L.row("6", "Blender — hotkeys", 38)
    L.row("7", "The bridge — ZBrush <-> Blender round trip", 38)
    L.row("8", "Laws worth memorising + dc-sculptgl keys", 38)
    L.gap(); L.rule()
    L.head("HOW TO READ IT", WARN)
    L.line("Nothing here is recalled. Every setting traces to a transcript in "
           "forge/ledger/raw/. Where a source states a number it is reproduced as stated; "
           "where none was stated, none was invented.")

    R.head("THE THREE LAWS ALL SOURCES AGREE ON")
    R.gap(2)
    R.line("1 · BUILD IT THE WAY IT WAS BUILT", H1, "Helvetica-Bold", 11)
    R.line("Separate pieces, real seams, real overlaps. Never sculpt a multi-part "
           "object from one blob. Decide splits from how the thing is WORN.")
    R.gap(4)
    R.line("2 · BIGGEST SHAPES FIRST", H1, "Helvetica-Bold", 11)
    R.line("Block the body before any piece; nail the primary form before any panel "
           "line. If the scale is wrong, fix the big shapes — never compensate downstream.")
    R.gap(4)
    R.line("3 · PERFECT READS FAKE", H1, "Helvetica-Bold", 11)
    R.line("Break the surface on purpose so it reads hand-hammered, not machine-made. "
           "Deliberate dents, deliberate asymmetry, deliberate wear.")
    R.gap(6); R.rule()
    R.head("NO TIMESTAMPS — WHY", WARN)
    R.line("YouTube's caption API refuses this network (IpBlocked), and the route that "
           "worked returns untimed text. So this is organised by technique, not timecode. "
           "To find a moment on screen, grep forge/ledger/raw/ for the phrase.")

    # ------------------------------------------------------ ZBRUSH WORKFLOW
    y = page(c, "ZBRUSH — ARMOUR WORKFLOW", "Gatz 3D (the spine) · TriGon (the full build)")
    L, R = Col(c, M, y), Col(c, M + COLW + 26, y)
    L.head("THE FIVE STAGES, FOR A WHOLE HARNESS")
    L.step(1, "BLOCK OUT the character. Proportions and spacing correct before anything else.")
    L.step(2, "3D SKETCH every piece straight onto the model. Loose and fast — not the detail phase. Duplicate and HIDE the base mesh first.")
    L.step(3, "SPLIT every piece off: mask → Polygroups > Group Masked → Split Masked Points. ~50 pieces is normal.")
    L.step(4, "THICKEN each piece (right column).")
    L.step(5, "REFINE: no gaps, silhouette right, proportions right.")
    L.gap(2)
    L.line("Why this order: it stops you finishing one pauldron while the rest of the "
           "harness is nothing. Work everything a little.", DIM)
    L.gap(); L.rule()
    L.head("FIRST SHAPE — the extract route")
    L.row("mask", "lasso for the gesture, pen for precision. Don't fuss.", 108)
    L.row("Extract", "smoothness 0, thickness 0, Tab Border OFF → Accept", 108)
    L.row("then", "Polish By Features → ZRemesher LOW → Polish again", 108)
    L.row("then", "Inflate slightly, Auto Groups, Delete Hidden", 108)

    R.head("THICKEN — the transpose method")
    R.row("Ctrl+Shift+clk", "isolate the piece", 134)
    R.row("Close Holes", "Geometry > Modify Topology — fills the back", 134)
    R.row("Transpose on", "Ctrl+click the FRONT polygroup = masks the rest", 134)
    R.row("drag centre", "of the three rings → extrudes it", 134)
    R.row("Inflate", "Deformation > Inflate recovers over-thinning", 134)
    R.gap(2)
    R.line("Faster for simple/repeatable pieces: mask → Subtool > Extract at 0.001. "
           "Many limb pieces are the same shape — build one, duplicate, move.", DIM)
    R.gap(); R.rule()
    R.head("DESIGN EXPLORATION — Dynamesh is the thinking tool")
    R.row("thickness", "make it THICK. Thin creates holes. Offset -100 if needed.", 108)
    R.row("Dynamesh", "LOW res — low enough to shove, not so low the form dies", 108)
    R.row("EQ Curve", "Brush > Curve. OFF = round pulls. ON = POINTED pulls.", 108)
    R.row("Render>Flat", "kills shading — judge pure silhouette", 108)
    R.row("Shift+S", "screenshot variants and compare side by side", 108)
    R.gap(2)
    R.line("The armour's job is to BREAK the silhouette away from the body. A near-straight "
           "line mirroring the torso is the failure state. Stagger the high points — equal "
           "heights and equal strap gaps read boring.", WARN)

    # ------------------------------------------------------- ZBRUSH HOTKEYS
    y = page(c, "ZBRUSH — HOTKEYS & MENU PATHS", "Only what the sources state. Nothing guessed.")
    L, R = Col(c, M, y), Col(c, M + COLW + 26, y)
    L.head("SELECTION / VISIBILITY")
    for k, v in [("Ctrl+Shift+click", "isolate piece, hide rest"),
                 ("Ctrl+W", "group visible into one polygroup"),
                 ("Auto Groups", "polygroup per connected piece"),
                 ("Delete Hidden", "commit a visibility cut"),
                 ("Split Hidden", "hidden part → own subtool"),
                 ("Visibility>Grow", "expand / Shrink contracts")]: L.row(k, v, 138)
    L.gap(4)
    L.head("MASKING")
    for k, v in [("Ctrl+drag", "mask   ·   Ctrl+Alt+drag unmask"),
                 ("Ctrl+click bg", "invert mask"),
                 ("Ctrl+Alt+click", "SHARPEN the mask — used constantly"),
                 ("Mask By Features", "mask the polygroup/edge features"),
                 ("Masking>Cavity", "then invert + sharpen + Inflate = fibres"),
                 ("backface mask", "Brush > Auto Masking > front faces only")]: L.row(k, v, 138)
    L.gap(4)
    L.head("BRUSH MODIFIERS")
    for k, v in [("Alt (held)", "invert; 2nd pass on DamStandard sharpens it"),
                 ("Ctrl+drag IMM", "place repeats at a LOCKED size"),
                 ("Brush>Depth", "how deep an IMM sinks (negative = in)"),
                 ("AutoMask>Range", "stops Move affecting the far side (~7)"),
                 ("Lazy Mouse", "on for any long clean stroke")]: L.row(k, v, 138)

    R.head("GEOMETRY / TOPOLOGY")
    for k, v in [("Dynamic Subdiv", "live thickness + smoothing preview"),
                 ("Crease PolyGroup", "Geometry > — crease on group borders"),
                 ("Group By Normals", "~70 — polygroup by angle"),
                 ("ZRemesher", "+ KEEP GROUPS = follows your polygroups"),
                 ("Polish By Feat.", "THE workhorse cleanup. Mask corners first."),
                 ("Dynamesh + Groups", "keeps polygroups from merging"),
                 ("Project History", "Subtool > Project — re-project earlier state"),
                 ("Extract 0.001", "fast piece from a mask"),
                 ("Merge Down", "keeps subdivs if levels match")]: R.row(k, v, 138)
    R.gap(4)
    R.head("STROKE / CURVES")
    for k, v in [("Frame Mesh", "Stroke > — by Border, or by creased edges"),
                 ("Curve Mode", "Stroke > — set Dots if it won't snap"),
                 ("Curve Step", "spacing along a curve. 0.9 = tight."),
                 ("Create InsertMesh", "Brush > — perspective OFF, view flat on")]: R.row(k, v, 138)
    R.gap(4)
    R.head("KNOWN FLAKINESS — from the sources", WARN)
    R.line("Live Boolean refuses → duplicate the subtool. Slice Curve ignores symmetry → "
           "Mirror And Weld after, every time. Mirror And Weld misbehaves with Dynamic "
           "Subdiv on. Stuck op → Ctrl+click the timeline. SAVE before any boolean.")

    # ------------------------------------------------------- ZBRUSH BRUSHES
    y = page(c, "ZBRUSH — BRUSH ROSTER", "What each one is actually for · Hristian Shyne, TriGon")
    L, R = Col(c, M, y), Col(c, M + COLW + 26, y)
    L.head("METAL SURFACE")
    for k, v in [("Flatten", "the main metal brush. High strength + metal 01 alpha. Facets the surface. It STOPS — it won't punch through. Hits backfaces: mask them."),
                 ("hPolish", "flattens, cleans, and breaks up noise that came out too uniform."),
                 ("Clay Buildup", "alpha 18 + spray, RGB off, ZAdd 2–3 = hammered metal. alpha 40/47 spray = fine dots."),
                 ("Slash", "low intensity — edge damage and jagged separation."),
                 ("DamStandard", "scratches and cracks. 2nd pass holding Alt sharpens. Transparent ON draws THROUGH a mesh."),
                 ("Trim Dynamic", "edge breakup alternative."),
                 ("Snake Hook", "pull individual stitches loose.")]: L.row(k, v, 108)

    R.head("THE LAYER DISCIPLINE — non-negotiable")
    R.row("new layer", "every damage pass gets one = one intensity dial", 134)
    R.row("morph target", "STORE it = selective undo for that pass", 134)
    R.row("then", "sculpt HARDER than you want, dial down after", 134)
    R.gap(2)
    R.line("You cannot judge coverage at low intensity. Work visible, then tone down. "
           "Bake layers when a pass is done — live layers bloat the ZTL.", DIM)
    R.gap(); R.rule()
    R.head("THE NOISE STACK — multiple scales, each on a layer")
    R.step(1, "Surface Noise at a LOW subdiv, strength very low → hammered dents.")
    R.step(2, "Surface Noise at the HIGHEST subdiv, lower still. 'I barely want to see it.'")
    R.step(3, "NoisePlug set to UV not 3D — stops it tiling perfectly, feels natural.")
    R.step(4, "One very large noise at the LOWEST subdiv (~0.2) to warp the plate.")
    R.gap(2)
    R.line("Mask it so it isn't uniform: Mask By Smoothness / Peaks and Valleys, paint by "
           "hand, then morph detail back out. Save presets — 'metal noise 1, 2'.", DIM)
    R.gap(4)
    R.head("BAKE-FORWARD — design for the bake", WARN)
    R.line("Break up the edge-to-plate junction so curvature/AO catches it. Give plate / "
           "ornament / edge / bolts SEPARATE POLYGROUP COLOUR IDs so Substance can split "
           "materials. Always ask how you'll retopo it before you detail it.")

    # ------------------------------------------------------ BLENDER PANELS
    y = page(c, "BLENDER — THE SHRINKWRAP PANEL METHOD", "Baril3D · the one worth automating (forge/panel_stack.py)")
    L, R = Col(c, M, y), Col(c, M + COLW + 26, y)
    L.head("THE IDEA")
    L.line("A BASE MESH carries the form. A WORKING PANEL carries the detail and is "
           "shrinkwrapped onto it. Now the panel's topology is FREE — cut loops, inset, "
           "punch holes — and curvature stays perfect, because curvature lives on the base.")
    L.gap(4)
    L.head("STACK ORDER — it matters")
    for k, v in [("Mirror", "clipping ON"),
                 ("Subdivision", "level 2 · Advanced > KEEP CORNERS"),
                 ("Shrinkwrap", "target = base copy · group 'wrap'"),
                 ("Solidify", "~3 mm"),
                 ("Bevel", "small, 1 segment"),
                 ("Weighted Normal", "Auto Smooth sits ABOVE this")]: L.row(k, v, 134)
    L.gap(4)
    L.head("THE BASE MESH COPY")
    L.row("Subdivision 5", "(4 if slow)", 134)
    L.row("Solidify", "DISABLED — a solidified edge corrupts projection", 134)
    L.row("hidden", "viewport + render", 134)
    L.gap(2)
    L.line("APPLY SCALE before Solidify or thickness is wrong. Start from ONE vertex and "
           "extrude the silhouette — low counts stay editable.", WARN)

    R.head("VERTEX-GROUP OFFSETS — the powerful part")
    R.row("'wrap'", "all verts → Shrinkwrap 1 (normal projection)", 96)
    R.row("'offset'", "a subset → Shrinkwrap 2:", 96)
    R.line("      Mode = OUTSIDE SURFACE   ·   Offset = 3 mm   ·   Vertex Group = offset", KEY, "Courier", 9.2)
    R.gap(3)
    R.line("Result: a rolled sheet-metal lip standing proud of the surface — fully "
           "re-tunable, and still flat in edit mode. Stack a third for 6 mm, or set it "
           "INSIDE for recessed rivet beds. Remove verts from the group to soften falloff.")
    R.gap(4)
    R.head("RIVETS")
    R.row("snapping", "magnet ON, snap to FACE", 96)
    R.row("tick BOTH", "Project Individual Elements + Align Rotation to Target", 96)
    R.row("Alt+D", "LINKED duplicate — edit one, edit all", 96)
    R.row("pivot", "Individual Origins to scale them independently", 96)
    R.gap(4)
    R.head("HOLES — LoopTools route")
    R.line("Select face row → Select > Checker Deselect → Inset → right-click > LoopTools > "
           "Circle → pivot Individual Origins → scale down → delete faces → extrude inward "
           "for a rim.  Tip: INSET TWICE up front and skip the extrude.")
    R.gap(4)
    R.head("LATTICE — last resort, and last in the stack", WARN)
    R.line("Select parts, Shift-select lattice LAST, Ctrl+P > Lattice Deform. Afterwards the "
           "mesh 'pops off' in edit mode. Use only at the end to fix proportions.")

    # ------------------------------------------------------ BLENDER HOTKEYS
    y = page(c, "BLENDER — HOTKEYS", "From the four Blender sources only")
    L, R = Col(c, M, y), Col(c, M + COLW + 26, y)
    L.head("TRANSFORM & SELECT")
    for k, v in [("G twice", "EDGE SLIDE along the surface"),
                 ("S X 0", "flatten a selection onto an axis"),
                 ("S then Shift+Z", "scale on X and Y only"),
                 ("Ctrl+A", "APPLY TRANSFORMS — before remesh & solidify"),
                 ("Alt+G", "clear location → object to world origin"),
                 ("Period", "pivot pie: 3D Cursor / Individual Origins"),
                 ("O", "proportional editing; wheel sizes falloff"),
                 ("Alt+Z", "x-ray   ·   C circle select   ·   Ctrl+I invert"),
                 ("L / Ctrl+L", "select linked"),
                 ("Ctrl+click 2nd", "select everything between two faces")]: L.row(k, v, 138)
    L.gap(4)
    L.head("MESH EDITING")
    for k, v in [("Ctrl+R", "loop cut (wheel adds cuts)"),
                 ("I", "inset — 'Individual' toggle for per-face"),
                 ("J", "connect two verts with an edge"),
                 ("Shift+Ctrl+B", "VERTEX bevel → chipped-stone corner"),
                 ("X > Dissolve", "remove edge, KEEP the face"),
                 ("M", "merge: At Center / By Distance"),
                 ("ALT+D", "LINKED duplicate — prefer for hardware"),
                 ("P", "separate   ·   Ctrl+J join   ·   Shift+N normals")]: L.row(k, v, 138)

    R.head("THE ENVIRONMENT MOVES — Ironbark")
    for k, v in [("radial dup", "Period → pivot 3D CURSOR → Shift+D, right-click, R Z 90 ×3"),
                 ("Spin tool", "front view, Y axis, then Steps 8 / Angle 90 / Centre X,Z"),
                 ("sharp edges", "Select > Select Sharp Edges → Mark Sharp → Shade Smooth"),
                 ("Fractal 1.2", "Edge > Subdivide with Fractal = instant stylised wear"),
                 ("re-centre", "Shift+S Cursor to Selected → Origin to 3D Cursor → Alt+G → Shift+C")]: R.row(k, v, 108)
    R.gap(4)
    R.head("ADD-ONS (all ship with Blender — just enable)")
    R.row("LoopTools", "right-click > LoopTools > Circle / Loft / Relax", 134)
    R.row("Extra Mesh Obj", "Shift+A > Mesh > Extras > Wall Factory", 134)
    R.row("ANT Landscape", "Shift+A > Mesh > Landscape — preset CANYON", 134)
    R.gap(4)
    R.head("SCULPT + BLENDER 5")
    R.row("Flatten Contrast", "small brush = genuinely SHARP sculpted edges", 126)
    R.row("Box Trim", "boolean cut — outperformed ZBrush in live test", 126)
    R.row("Front Faces Only", "Tool > Advanced — back-face masking", 126)
    R.row("Vulkan", "Preferences > Display Graphics — faster high-poly", 126)
    R.row("Temperature", "light colour node, replaces the blackbody hack", 126)
    R.row("remesh voxel", "0.01 typical. 0.001 gave 44 MILLION polys.", 126)

    # ----------------------------------------------------------- THE BRIDGE
    y = page(c, "THE BRIDGE — ZBRUSH ⇄ BLENDER", "The handoff, not a blend. One crossing each way.")
    L, R = Col(c, M, y), Col(c, M + COLW + 26, y)
    L.head("ZBRUSH OWNS")
    L.line("mask → extract shells off a body  ·  Dynamesh design exploration  ·  "
           "DamStandard / Trim / Slash / Flatten damage  ·  IMM hardware: trim, bolts, "
           "stitches, chainmail  ·  layers + morph target  ·  polypaint  ·  "
           "ZRemesher with polygroup steering")
    L.gap(4)
    L.head("BLENDER OWNS")
    L.line("the shrinkwrap panel method  ·  vertex-group offsets that stay parametric  ·  "
           "exact operations: Spin with known Angle/Centre, Array, Mirror  ·  precise "
           "re-centring and origin control  ·  lattice  ·  predictable booleans  ·  "
           "non-destructive stacks you can revisit months later")
    L.gap(4)
    L.line("Neither owns 'sculpting' or 'modelling' outright. Route by the OPERATION.", DIM)
    L.gap(4); L.rule()
    L.head("SCALE — the thing that bites", WARN)
    L.line("ZBrush is unit-agnostic; Blender is not. Fix ONE convention or the kit won't "
           "compose: +Z up, +Y front, humanoid = 1.8 units. Baril's mm values (3 mm plate, "
           "3.5 mm layered sheet, 6 mm deep offset) only mean something once it's fixed.")

    R.head("THE ONE THING THAT DECIDES IF THIS IS PLEASANT", H1)
    R.line("A raw ZBrush Extract is dense, uneven and triangulated. Blender's stack assumes "
           "even quads. Feed it a raw extract and every modifier fights you.")
    R.gap(3)
    R.line("SO: ZREMESH BEFORE YOU CROSS. Always.", WARN, "Helvetica-Bold", 11.6)
    R.line("Extract → Polish By Features → ZRemesher LOW → Polish again.  2–5k quads is a "
           "good crossing weight. TriGon already does this inside ZBrush for his own "
           "reasons — one step, two payoffs.")
    R.gap(4)
    R.head("THE STRONG MOVE")
    R.line("Use the ZBrush extract as the BASE MESH and shrinkwrap new panels onto it. It "
           "already follows the body, it's smooth, and you never edit it again. All the "
           "plate detail happens on panels above it.")
    R.gap(4)
    R.head("POLYPAINT SURVIVES")
    R.line("Polypaint is per-vertex colour → lands in Blender as a COLOR ATTRIBUTE. "
           "forge/intake.py already transfers vertex colours across a remesh by KDTree. "
           "Caveat: polypaint needs DENSITY — a 2k crossing mesh can't carry it. Paint "
           "after you're back at high subdiv, or bake to texture.")
    R.gap(4)
    R.line("Don't bounce repeatedly. If you're on the third crossing, the piece wants to "
           "live in one tool.", WARN)

    # ------------------------------------------------------------- THE LAWS
    y = page(c, "LAWS WORTH MEMORISING", "…and the keys for your own sculpt tool")
    L, R = Col(c, M, y), Col(c, M + COLW + 26, y)
    L.head("THE ASYMMETRY RULE — Abe Leal")
    L.line("The closer a detail is to the CENTRE LINE, the more obvious symmetry becomes — "
           "you can never see both far-side details at once. So details near the centre "
           "line need deliberate asymmetry; far-side ones can stay mirrored.")
    L.gap(4)
    L.head("THE OVERLAP LAW — Abe Leal")
    L.line("Where two pieces meet, build a deliberate OVERLAP and push the back section "
           "further in. Two payoffs: you can retopo the pair as ONE piece, and you get a "
           "much better AO bake / cast shadow.")
    L.gap(4)
    L.head("THE THICKNESS LAW — Abe Leal")
    L.line("Always make hard-surface pieces slightly THICKER than reality. Razor-thin edges "
           "alias badly in engine and read poorly. 'A little bit chunkier than the real world.'")
    L.gap(4)
    L.head("PANEL SEAMS — bevel then delete")
    L.line("For a TRUE gap between plates: select the real seam edge → BEVEL it very small → "
           "DELETE the resulting faces → then Solidify → then Subdivision.")
    L.gap(4)
    L.head("LEATHER IS SKIN — TriGon")
    L.line("When you punch INTO leather, the material beside the punch RAISES. After the "
           "indent pass, raise the surrounding area slightly. That's what kills the plastic look.")

    R.head("dc-sculptgl KEYS (v3.2)", H1)
    R.line("From your own forge/README.txt", DIM, "Helvetica-Oblique", 9.2)
    R.gap(3)
    R.row("1-9 / 0", "tools", 134)
    R.row("E", "transform      ·   X  radius", 134)
    R.row("C", "intensity      ·   N  negative", 134)
    R.row("S", "picker         ·   Del  delete", 134)
    R.row("F / T / L", "views          ·   Space  reset", 134)
    R.row("W", "wireframe", 134)
    R.gap(2)
    R.line("ADDON", H2, "Helvetica-Bold", 10.4)
    R.row("M", "retopo mark", 134)
    R.row("O", "iso 35.264° ortho view", 134)
    R.row("A", "masking        ·   Q  local scale", 134)
    R.gap(4); R.rule()
    R.head("THE FORGE ENGINES")
    R.row("intake", "clean → remesh → vertex-colour transfer", 96)
    R.row("rings", "edge rings from painted marks", 96)
    R.row("bake", "UV + texture bake", 96)
    R.row("panel", "the shrinkwrap armour-panel stack (new)", 96)
    R.gap(2)
    R.line("blender -b -P forge/panel_stack.py -- --out panel.blend", KEY, "Courier", 9.2)
    R.line("Verified on Blender 5.0.1: modifier order correct, offset group displaces by "
           "exactly the configured amount.", DIM)

    c.showPage(); c.save()
    return page_n[0]

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "dc-armour-reference.pdf"
    n = build(out)
    print("RECEIPT " + '{"engine":"make_reference","pages":%d,"out":"%s","page_pt":[%d,%d]}' % (n, out, W, H))
