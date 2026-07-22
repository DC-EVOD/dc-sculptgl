"""intake.py - INTAKE gate for the DC sculpt pipeline (Blender 4.0 headless).

Cleans a raw generated mesh (Rodin/Hyper3D etc.) BEFORE sculpt/paint work:
merge doubles -> delete loose -> dissolve degenerate -> fill holes ->
recalc normals -> optional remesh (voxel or quadriflow) with vertex-color
transfer from the original surface (KDTree nearest-vertex).

Usage:
  blender -b -P intake.py -- --in raw.ply --out clean.ply \
      [--remesh none|voxel|quad] [--target-faces 30000] [--voxel-size 0.02] \
      [--merge-dist 0.0001]

Prints a RECEIPT json block: before/after stats. Every claim measured.
"""
import bpy, bmesh, json, sys, os
from mathutils import kdtree

def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    d = {"remesh": "none", "target_faces": 30000, "voxel_size": 0.02,
         "merge_dist": 0.0001, "in": None, "out": None}
    i = 0
    while i < len(a):
        k = a[i].lstrip("-").replace("-", "_")
        d[k] = a[i + 1]; i += 2
    d["target_faces"] = int(d["target_faces"])
    d["voxel_size"] = float(d["voxel_size"])
    d["merge_dist"] = float(d["merge_dist"])
    return d

def load(path):
    ext = os.path.splitext(path)[1].lower()
    if ext == ".ply": bpy.ops.wm.ply_import(filepath=path)
    elif ext == ".obj": bpy.ops.wm.obj_import(filepath=path)
    elif ext in (".glb", ".gltf"): bpy.ops.import_scene.gltf(filepath=path)
    elif ext == ".stl": bpy.ops.import_mesh.stl(filepath=path)
    else: raise SystemExit("unsupported input: " + ext)
    obs = [o for o in bpy.context.selected_objects if o.type == "MESH"]
    if not obs: raise SystemExit("no mesh imported")
    if len(obs) > 1:  # join multi-part imports into one object
        bpy.context.view_layer.objects.active = obs[0]
        bpy.ops.object.join()
    return bpy.context.view_layer.objects.active or obs[0]

def stats(obj):
    bm = bmesh.new(); bm.from_mesh(obj.data)
    nonman = sum(1 for e in bm.edges if not e.is_manifold)
    loose = sum(1 for v in bm.verts if not v.link_faces)
    degen = sum(1 for f in bm.faces if f.calc_area() < 1e-12)
    boundary = sum(1 for e in bm.edges if e.is_boundary)
    s = {"verts": len(bm.verts), "faces": len(bm.faces),
         "nonmanifold_edges": nonman, "loose_verts": loose,
         "degenerate_faces": degen, "boundary_edges": boundary,
         "has_vertex_colors": bool(obj.data.color_attributes)}
    bm.free(); return s

def get_colors(obj):
    ca = obj.data.color_attributes
    if not ca: return None
    # normalize to per-vertex (POINT domain) color list
    src = ca[0]
    me = obj.data
    cols = [(0.0, 0.0, 0.0, 1.0)] * len(me.vertices)
    if src.domain == "POINT":
        for i, c in enumerate(src.data): cols[i] = tuple(c.color)
    else:  # CORNER domain -> average onto verts
        acc = [[0.0, 0.0, 0.0, 0.0, 0] for _ in me.vertices]
        for loop, c in zip(me.loops, src.data):
            a = acc[loop.vertex_index]
            for j in range(4): a[j] += c.color[j]
            a[4] += 1
        for i, a in enumerate(acc):
            if a[4]: cols[i] = tuple(a[j] / a[4] for j in range(4))
    return cols

def set_colors(obj, cols):
    me = obj.data
    for a in list(me.color_attributes): me.color_attributes.remove(a)
    attr = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for i in range(min(len(cols), len(me.vertices))):
        attr.data[i].color = cols[i]

def clean(obj, merge_dist):
    bm = bmesh.new(); bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=merge_dist)
    loose = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=loose, context="VERTS")
    bmesh.ops.dissolve_degenerate(bm, dist=1e-6, edges=bm.edges)
    bmesh.ops.holes_fill(bm, edges=bm.edges, sides=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(obj.data); bm.free()
    obj.data.update()

def remesh(obj, mode, target_faces, voxel_size, orig_verts_cols):
    if mode == "voxel":
        obj.data.remesh_voxel_size = voxel_size
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.voxel_remesh()
    elif mode == "quad":
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.quadriflow_remesh(target_faces=target_faces)
    if orig_verts_cols:
        verts, cols = orig_verts_cols
        kd = kdtree.KDTree(len(verts))
        for i, co in enumerate(verts): kd.insert(co, i)
        kd.balance()
        new_cols = []
        for v in obj.data.vertices:
            _, idx, _ = kd.find(v.co)
            new_cols.append(cols[idx])
        set_colors(obj, new_cols)

def export(obj, path):
    for o in bpy.context.selected_objects: o.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    ext = os.path.splitext(path)[1].lower()
    if ext == ".ply":
        bpy.ops.wm.ply_export(filepath=path, export_selected_objects=True,
                              export_colors="SRGB", ascii_format=False)
    elif ext == ".obj":
        bpy.ops.wm.obj_export(filepath=path, export_selected_objects=True)
    else:
        raise SystemExit("unsupported output: " + ext)

def main():
    A = args()
    if not A["in"] or not A["out"]: raise SystemExit("--in and --out required")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    obj = load(A["in"])
    before = stats(obj)
    cols = get_colors(obj)
    orig = None
    if cols and A["remesh"] != "none":
        orig = ([v.co.copy() for v in obj.data.vertices], cols)
    clean(obj, A["merge_dist"])
    if cols and A["remesh"] == "none":
        pass  # colors survive bmesh clean via mesh attrs? verify: re-fetch
    if A["remesh"] != "none":
        remesh(obj, A["remesh"], A["target_faces"], A["voxel_size"], orig)
    elif cols and not obj.data.color_attributes:
        # bmesh round-trip dropped attrs -> restore by index-nearest
        orig = ([v.co.copy() for v in obj.data.vertices], cols)
        remesh(obj, "none", 0, 0, orig)
    after = stats(obj)
    export(obj, A["out"])
    print("RECEIPT " + json.dumps({"input": A["in"], "output": A["out"],
          "remesh": A["remesh"], "before": before, "after": after}))

main()
