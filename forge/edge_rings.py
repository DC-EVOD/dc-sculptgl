"""edge_rings.py - painted joint zones -> real edge rings (Blender 4.0 headless).

Reads a PLY whose vertex paint contains RETOPO MARKS (pure cyan by default:
r<0.25, g>0.75, b>0.75). For each connected cluster of marked verts:
  1. fit a plane set: limb axis = smallest-variance eigenvector (a painted
     band around a limb varies least along the limb)
  2. cut N parallel bisect planes through the mark zone, perpendicular to
     the axis - true continuous edge rings on any triangle soup
Marks are wiped from the output paint. RECEIPT json per cluster.

Usage:
  blender -b -P edge_rings.py -- --in marked.ply --out ringed.ply
      [--rings 3] [--mark-r 0.25 --mark-g 0.75 --mark-b 0.75]
"""
import bpy, bmesh, json, sys
import numpy as np

def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    d = {"in": None, "out": None, "rings": 3,
         "mark_r": 0.25, "mark_g": 0.75, "mark_b": 0.75}
    i = 0
    while i < len(a):
        d[a[i].lstrip("-").replace("-", "_")] = a[i + 1]; i += 2
    d["rings"] = int(d["rings"])
    for k in ("mark_r", "mark_g", "mark_b"): d[k] = float(d[k])
    return d

def main():
    A = args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.wm.ply_import(filepath=A["in"])
    obj = bpy.context.view_layer.objects.active
    me = obj.data
    if not me.color_attributes: raise SystemExit("no vertex colors / marks")
    ca = me.color_attributes[0]
    n = len(me.vertices)
    cols = np.zeros((n, 3))
    if ca.domain == "POINT":
        for i, c in enumerate(ca.data): cols[i] = c.color[:3]
    else:
        cnt = np.zeros(n)
        for loop, c in zip(me.loops, ca.data):
            cols[loop.vertex_index] += c.color[:3]; cnt[loop.vertex_index] += 1
        cols /= np.maximum(cnt, 1)[:, None]
    marked = (cols[:, 0] < A["mark_r"]) & (cols[:, 1] > A["mark_g"]) & (cols[:, 2] > A["mark_b"])
    midx = set(np.where(marked)[0].tolist())
    if not midx: raise SystemExit("no marked vertices found")

    # connected components over mesh edges
    adj = {}
    for e in me.edges:
        a_, b_ = e.vertices
        if a_ in midx and b_ in midx:
            adj.setdefault(a_, []).append(b_); adj.setdefault(b_, []).append(a_)
    seen, clusters = set(), []
    for s in midx:
        if s in seen: continue
        comp, stack = [], [s]; seen.add(s)
        while stack:
            v = stack.pop(); comp.append(v)
            for w in adj.get(v, []):
                if w not in seen: seen.add(w); stack.append(w)
        if len(comp) >= 8: clusters.append(comp)  # ignore stray dabs

    bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
    receipts = []
    for comp in clusters:
        P = np.array([me.vertices[i].co[:] for i in comp])
        c = P.mean(0)
        cov = np.cov((P - c).T)
        w, V = np.linalg.eigh(cov)
        axis = V[:, 0]                      # smallest variance = limb axis
        t = (P - c) @ axis
        lo, hi = np.percentile(t, 10), np.percentile(t, 90)
        cuts = np.linspace(lo, hi, A["rings"] + 2)[1:-1]  # interior positions
        # restrict cutting to geometry near the cluster
        r = float(np.linalg.norm(P - c, axis=1).max()) * 1.5
        ring_edges = []
        for tcut in cuts:
            co = c + axis * tcut
            geom = [el for el in list(bm.verts) + list(bm.edges) + list(bm.faces)
                    if hasattr(el, "co") and (np.linalg.norm(np.array(el.co[:]) - c) < r)
                    or (not hasattr(el, "co"))]
            # simpler + robust: cut faces whose center is within radius
            faces = [f for f in bm.faces
                     if np.linalg.norm(np.array(f.calc_center_median()[:]) - c) < r]
            edges = set(e for f in faces for e in f.edges)
            verts = set(v for f in faces for v in f.verts)
            res = bmesh.ops.bisect_plane(
                bm, geom=list(verts) + list(edges) + list(faces),
                plane_co=co.tolist(), plane_no=axis.tolist(),
                clear_inner=False, clear_outer=False)
            new_edges = [g for g in res["geom_cut"] if isinstance(g, bmesh.types.BMEdge)]
            ring_edges.append(len(new_edges))
            bm.verts.ensure_lookup_table()
        receipts.append({"cluster_verts": len(comp),
                         "axis": [round(float(x), 3) for x in axis],
                         "rings_cut": len(cuts),
                         "edges_per_ring": ring_edges})
    before_v = len(me.vertices)
    # merge any sliver rings from cuts coinciding with existing geometry
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.to_mesh(me); bm.free(); me.update()

    # wipe marks in output: repaint marked verts to neighbour-average grey base
    # wipe by VALUE (bmesh reorders indices; new ring verts inherit cyan)
    ca2 = me.color_attributes[0]
    wiped = 0
    if ca2.domain == "POINT":
        for d in ca2.data:
            c = d.color
            if c[0] < A["mark_r"] and c[1] > A["mark_g"] and c[2] > A["mark_b"]:
                d.color = (0.5, 0.5, 0.5, 1.0); wiped += 1

    bpy.ops.wm.ply_export(filepath=A["out"], export_selected_objects=False,
                          export_colors="SRGB", ascii_format=False)
    print("RECEIPT " + json.dumps({"input": A["in"], "output": A["out"],
          "marked_verts": len(midx), "clusters": receipts,
          "verts_before": before_v, "verts_after": len(me.vertices), "marks_wiped": wiped}))

main()
