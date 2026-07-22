"""bake_out.py - BAKE-OUT gate v2 (Blender 4.0 headless, NO Cycles).

Bakes vertex paint -> albedo PNG by direct barycentric rasterization of UV
triangles (deterministic; no renderer involved), plus optional vertex-AO via
BVH hemisphere raycasts. Exports UV'd OBJ+MTL wired to the albedo.

Usage:
  blender -b -P bake_out.py -- --in sculpt.ply --outdir out [--res 1024]
      [--ao 0|1] [--ao-rays 24] [--margin 4] [--name asset]
"""
import bpy, bmesh, json, os, sys, math, random
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    d = {"in": None, "outdir": ".", "res": 1024, "ao": 0, "ao_rays": 24,
         "margin": 4, "name": "asset"}
    i = 0
    while i < len(a):
        d[a[i].lstrip("-").replace("-", "_")] = a[i + 1]; i += 2
    for k in ("res", "ao", "ao_rays", "margin"): d[k] = int(d[k])
    return d

def vert_colors(me):
    ca = me.color_attributes[0]
    cols = np.zeros((len(me.vertices), 3))
    if ca.domain == "POINT":
        for i, c in enumerate(ca.data): cols[i] = c.color[:3]
    else:
        cnt = np.zeros(len(me.vertices))
        for loop, c in zip(me.loops, ca.data):
            cols[loop.vertex_index] += c.color[:3]; cnt[loop.vertex_index] += 1
        cols /= np.maximum(cnt, 1)[:, None]
    return cols

def rasterize(me, values, res):
    """values: per-vertex (N,3) -> (res,res,3) image + coverage mask."""
    img = np.zeros((res, res, 3)); cover = np.zeros((res, res), bool)
    uvl = me.uv_layers.active.data
    me.calc_loop_triangles()
    for tri in me.loop_triangles:
        ls = tri.loops
        uv = np.array([uvl[l].uv[:] for l in ls]) * (res - 1)
        vc = np.array([values[me.loops[l].vertex_index] for l in ls])
        x0, y0 = np.floor(uv.min(0)).astype(int)
        x1, y1 = np.ceil(uv.max(0)).astype(int) + 1
        x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(res, x1), min(res, y1)
        if x1 <= x0 or y1 <= y0: continue
        xs, ys = np.meshgrid(np.arange(x0, x1) + 0.5, np.arange(y0, y1) + 0.5)
        d = ((uv[1,1]-uv[2,1])*(uv[0,0]-uv[2,0]) + (uv[2,0]-uv[1,0])*(uv[0,1]-uv[2,1]))
        if abs(d) < 1e-9: continue
        w0 = ((uv[1,1]-uv[2,1])*(xs-uv[2,0]) + (uv[2,0]-uv[1,0])*(ys-uv[2,1])) / d
        w1 = ((uv[2,1]-uv[0,1])*(xs-uv[2,0]) + (uv[0,0]-uv[2,0])*(ys-uv[2,1])) / d
        w2 = 1 - w0 - w1
        m = (w0 >= -1e-4) & (w1 >= -1e-4) & (w2 >= -1e-4)
        if not m.any(): continue
        col = (w0[..., None]*vc[0] + w1[..., None]*vc[1] + w2[..., None]*vc[2])
        yy, xx = np.where(m)
        img[ys.astype(int)[yy, xx], xs.astype(int)[yy, xx]] = col[yy, xx]
        cover[ys.astype(int)[yy, xx], xs.astype(int)[yy, xx]] = True
    return img, cover

def dilate(img, cover, n):
    for _ in range(n):
        empty = ~cover
        if not empty.any(): break
        for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
            src = np.roll(cover, (dy, dx), (0, 1))
            simg = np.roll(img, (dy, dx), (0, 1))
            take = empty & src
            img[take] = simg[take]; cover = cover | take
            empty = ~cover
    return img

def vertex_ao(obj, me, rays):
    bvh = BVHTree.FromObject(obj, bpy.context.evaluated_depsgraph_get())
    ao = np.zeros(len(me.vertices))
    rng = random.Random(7)
    for i, v in enumerate(me.vertices):
        n = Vector(v.normal); o = Vector(v.co) + n * 1e-4
        hits = 0
        for _ in range(rays):
            d = Vector((rng.gauss(0,1), rng.gauss(0,1), rng.gauss(0,1)))
            if d.length < 1e-6: continue
            d.normalize()
            if d.dot(n) < 0: d = -d
            if bvh.ray_cast(o, d, 10.0)[0] is not None: hits += 1
        ao[i] = 1.0 - hits / rays
    return np.stack([ao, ao, ao], -1)

def save_png(arr, path):
    res = arr.shape[0]
    img = bpy.data.images.new(os.path.basename(path), res, res)
    rgba = np.ones((res, res, 4)); rgba[:, :, :3] = np.clip(arr, 0, 1)
    img.pixels[:] = rgba[::-1].ravel()  # blender images are bottom-up
    img.filepath_raw = path; img.file_format = "PNG"; img.save()
    return img

def main():
    A = args()
    if not A["in"]: raise SystemExit("--in required")
    os.makedirs(A["outdir"], exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.ply_import(filepath=A["in"])
    obj = bpy.context.view_layer.objects.active
    me = obj.data
    if not me.color_attributes: raise SystemExit("no vertex colors to bake")
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=1.15708, island_margin=0.003)
    bpy.ops.object.mode_set(mode="OBJECT")

    cols = vert_colors(me)
    albedo, cover = rasterize(me, cols, A["res"])
    fill = round(float(cover.mean()), 3)
    albedo = dilate(albedo, cover.copy(), A["margin"])
    apath = os.path.join(A["outdir"], A["name"] + "_albedo.png")
    img = save_png(albedo, apath)
    rec = {"input": A["in"], "res": A["res"], "uv_fill": fill,
           "albedo": apath,
           "albedo_distinct_coarse": int(len(np.unique(
               (albedo[cover] * 10).astype(int), axis=0)))}

    if A["ao"]:
        aov = vertex_ao(obj, me, A["ao_rays"])
        aoimg, aocov = rasterize(me, aov, A["res"])
        aoimg = dilate(aoimg, aocov, A["margin"])
        aopath = os.path.join(A["outdir"], A["name"] + "_ao.png")
        save_png(aoimg, aopath)
        rec["ao"] = aopath
        rec["ao_range"] = [round(float(aov.min()), 3), round(float(aov.max()), 3)]

    # material wiring for OBJ+MTL export
    mat = bpy.data.materials.new("dc_mat"); mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    tex = nt.nodes.new("ShaderNodeTexImage")
    img.source = "FILE"; img.filepath = apath; tex.image = img
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    me.materials.clear(); me.materials.append(mat)
    opath = os.path.join(A["outdir"], A["name"] + ".obj")
    for o in bpy.context.selected_objects: o.select_set(False)
    obj.select_set(True); bpy.context.view_layer.objects.active = obj
    bpy.ops.wm.obj_export(filepath=opath, export_selected_objects=True,
                          export_materials=True, path_mode="COPY")
    rec["obj"] = opath
    print("RECEIPT " + json.dumps(rec))

main()
