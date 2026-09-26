"""panel_stack.py - PANEL gate for the DC armour pipeline (Blender 5.0 headless).

Builds the shrinkwrap armour-panel setup that Baril3D uses for every plate:
a smooth BASE MESH copy carries the form, and the working PANEL carries the
detail, shrinkwrapped onto it. That decouples topology from curvature -- you
can cut loops, inset and punch holes in the panel without wrecking the
surface, because the surface lives on the base mesh.

Builds, in this order (the order matters):
    Mirror (clipping)
    Subdivision Surface  (level 2, Keep Corners)
    Shrinkwrap           (-> base mesh, vertex group "wrap")
    Solidify             (thickness in mm)
    Bevel                (small, 1 segment)
    Weighted Normal
plus a hidden base-mesh copy at subdiv 5 with NO solidify (a solidified edge
corrupts the projection), and the "wrap" / "offset" vertex groups that drive
offset shrinkwraps for rolled lips and raised crests.

Usage:
  python3 panel_stack.py -- --in panel.obj --out panel_stacked.blend \
      [--thickness-mm 3] [--base-levels 5] [--panel-levels 2] \
      [--bevel-mm 0.5] [--offset-mm 3] [--offset-axis Z] [--offset-frac 0.15] \
      [--no-mirror] [--export out.obj]

  Omit --in to build a demo panel instead (self-test).

Prints a RECEIPT json block: modifier order, counts, group sizes. Every claim
measured. Source: forge/ledger/blender/00-shrinkwrap-panel.md
"""
import bpy, bmesh, json, sys, os

def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    d = {"in": None, "out": None, "export": None, "thickness_mm": 3.0,
         "base_levels": 5, "panel_levels": 2, "bevel_mm": 0.5,
         "offset_mm": 3.0, "offset_axis": "Z", "offset_frac": 0.15,
         "no_mirror": False}
    i = 0
    while i < len(a):
        k = a[i].lstrip("-").replace("-", "_")
        if k == "no_mirror":
            d[k] = True; i += 1; continue
        d[k] = a[i + 1]; i += 2
    for f in ("thickness_mm", "bevel_mm", "offset_mm", "offset_frac"):
        d[f] = float(d[f])
    for n in ("base_levels", "panel_levels"):
        d[n] = int(d[n])
    d["offset_axis"] = str(d["offset_axis"]).upper()
    return d

def wipe():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def load(path):
    ext = os.path.splitext(path)[1].lower()
    if   ext == ".obj":            bpy.ops.wm.obj_import(filepath=path)
    elif ext == ".ply":            bpy.ops.wm.ply_import(filepath=path)
    elif ext in (".glb", ".gltf"): bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".stl":            bpy.ops.wm.stl_import(filepath=path)
    else: raise SystemExit("unsupported input: " + ext)
    obs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not obs: raise SystemExit("no mesh imported")
    return obs[0]

def demo_panel():
    """A curved quad patch standing in for a traced armour panel."""
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=6, y_subdivisions=8, size=1.0)
    ob = bpy.context.active_object
    ob.name = "panel"
    me = ob.data
    for v in me.vertices:                       # bow it like a breastplate
        v.co.z = 0.18 * (1.0 - v.co.x * v.co.x * 4.0) * (1.0 - abs(v.co.y))
    return ob

def stats(obj, depsgraph=None):
    if depsgraph is not None:
        ev = obj.evaluated_get(depsgraph)
        me = ev.to_mesh()
        s = {"verts": len(me.vertices), "faces": len(me.polygons)}
        ev.to_mesh_clear(); return s
    bm = bmesh.new(); bm.from_mesh(obj.data)
    s = {"verts": len(bm.verts), "faces": len(bm.faces),
         "boundary_edges": sum(1 for e in bm.edges if e.is_boundary)}
    bm.free(); return s

def keep_corners(sub):
    """Baril's 'Keep Corners' -- sharp corners instead of spent polygons."""
    applied = {}
    for attr, val in (("boundary_smooth", "PRESERVE_CORNERS"),
                      ("uv_smooth", "PRESERVE_CORNERS")):
        if hasattr(sub, attr):
            setattr(sub, attr, val); applied[attr] = val
    return applied

def make_base(panel, levels):
    """Duplicate -> subdiv high -> NO solidify -> hide. The form lives here."""
    base = panel.copy(); base.data = panel.data.copy()
    base.name = panel.name + "_base"
    bpy.context.collection.objects.link(base)
    sub = base.modifiers.new("BaseSubdiv", "SUBSURF")
    sub.levels = levels; sub.render_levels = levels
    kc = keep_corners(sub)
    base.hide_viewport = True; base.hide_render = True
    return base, kc

def vgroups(panel, axis, frac):
    """'wrap' = every vertex. 'offset' = the top band, for a rolled lip."""
    for name in ("wrap", "offset"):
        if name in panel.vertex_groups:
            panel.vertex_groups.remove(panel.vertex_groups[name])
    idx = list(range(len(panel.data.vertices)))
    g_wrap = panel.vertex_groups.new(name="wrap")
    g_wrap.add(idx, 1.0, "REPLACE")
    ax = {"X": 0, "Y": 1, "Z": 2}[axis]
    co = [v.co[ax] for v in panel.data.vertices]
    g_off = panel.vertex_groups.new(name="offset")
    sel = []
    if co:
        lo, hi = min(co), max(co)
        cut = hi - (hi - lo) * frac
        sel = [i for i, c in enumerate(co) if c >= cut]
        if sel: g_off.add(sel, 1.0, "REPLACE")
    return len(idx), len(sel)

def build(panel, base, A):
    panel.modifiers.clear()
    order = []
    if not A["no_mirror"]:
        m = panel.modifiers.new("Mirror", "MIRROR")
        m.use_clip = True
        order.append("MIRROR")
    sub = panel.modifiers.new("Subdivision", "SUBSURF")
    sub.levels = A["panel_levels"]; sub.render_levels = A["panel_levels"]
    kc = keep_corners(sub); order.append("SUBSURF")

    sw = panel.modifiers.new("Shrinkwrap", "SHRINKWRAP")
    sw.target = base
    sw.wrap_method = "NEAREST_SURFACEPOINT"
    sw.vertex_group = "wrap"
    order.append("SHRINKWRAP")

    sol = panel.modifiers.new("Solidify", "SOLIDIFY")
    sol.thickness = A["thickness_mm"] / 1000.0
    order.append("SOLIDIFY")

    bev = panel.modifiers.new("Bevel", "BEVEL")
    bev.width = A["bevel_mm"] / 1000.0; bev.segments = 1
    order.append("BEVEL")

    wn = panel.modifiers.new("WeightedNormal", "WEIGHTED_NORMAL")
    if hasattr(wn, "keep_sharp"): wn.keep_sharp = True
    order.append("WEIGHTED_NORMAL")
    return order, kc

def add_offset_shrinkwrap(panel, base, offset_mm):
    """Second shrinkwrap: OUTSIDE SURFACE + offset on the 'offset' group.
    Rolled lip / raised crest without moving a single vertex."""
    sw = panel.modifiers.new("Shrinkwrap_Offset", "SHRINKWRAP")
    sw.target = base
    sw.wrap_method = "NEAREST_SURFACEPOINT"
    sw.wrap_mode = "OUTSIDE_SURFACE"
    sw.offset = offset_mm / 1000.0
    sw.vertex_group = "offset"
    # must sit directly after the base shrinkwrap, above Solidify
    names = [m.name for m in panel.modifiers]
    target_i = names.index("Shrinkwrap") + 1
    while names.index("Shrinkwrap_Offset") > target_i:
        bpy.ops.object.modifier_move_up(modifier="Shrinkwrap_Offset")
        names = [m.name for m in panel.modifiers]
    return sw.wrap_mode, sw.offset

def main():
    A = args()
    wipe()
    panel = load(A["in"]) if A["in"] else demo_panel()
    panel.name = panel.name or "panel"
    bpy.context.view_layer.objects.active = panel
    panel.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    before = stats(panel)
    base, base_kc = make_base(panel, A["base_levels"])
    n_wrap, n_off = vgroups(panel, A["offset_axis"], A["offset_frac"])
    order, kc = build(panel, base, A)
    off_mode, off_val = add_offset_shrinkwrap(panel, base, A["offset_mm"])
    order = [m.type for m in panel.modifiers]

    dg = bpy.context.evaluated_depsgraph_get()
    after = stats(panel, dg)

    if A["export"]:
        bpy.ops.object.select_all(action="DESELECT")
        panel.select_set(True)
        bpy.context.view_layer.objects.active = panel
        bpy.ops.wm.obj_export(filepath=A["export"], export_selected_objects=True)
    if A["out"]:
        bpy.ops.wm.save_as_mainfile(filepath=A["out"])

    print("RECEIPT " + json.dumps({
        "engine": "panel_stack",
        "blender": bpy.app.version_string,
        "input": A["in"] or "<demo panel>",
        "output": A["out"], "export": A["export"],
        "panel_before": before, "panel_after_eval": after,
        "modifier_order": order,
        "base_mesh": {"name": base.name, "levels": A["base_levels"],
                      "solidify": False, "hidden": True,
                      "keep_corners": base_kc},
        "panel_subdiv_keep_corners": kc,
        "vertex_groups": {"wrap": n_wrap, "offset": n_off},
        "solidify_thickness_m": A["thickness_mm"] / 1000.0,
        "offset_shrinkwrap": {"mode": off_mode, "offset_m": off_val,
                              "vertex_group": "offset"},
    }))

main()
