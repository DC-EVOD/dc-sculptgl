DC FORGE — how the pipeline actually runs
=========================================
THE WORKFLOW (works today, nothing to install):
1) Sculpt on https://dc-evod.github.io/dc-sculptgl
2) For edge loops: hit MARK, paint the joints cyan, hit RINGS.
   For cleanup: hit INTAKE.  For UV+texture bake: hit BAKE.
3) Two files download: the mesh (.ply) + a job manifest (.json).
4) Drop BOTH into a Claude chat, say "run it". Claude runs the
   engine in headless Blender and hands back the processed .ply.
5) Load it on the sculpt site via the normal file open. Done.

The engines in this folder (intake.py / edge_rings.py / bake_out.py)
are what Claude runs — kept in the repo so the pipeline is versioned
with the addon.

OPTIONAL, LATER: forge_daemon.py makes the buttons instant by running
the engines on any machine with Blender + a reachable address (e.g. a
Colab session). Point the addon at it with:
  localStorage.setItem('dc-forge-daemon', 'https://your-forge-url')
in the browser console, then reload. Until then the dot stays grey —
that's honest, not broken.

HOTKEYS (v3.2): stock — 1-9/0 tools, E transform, X radius, C intensity,
N negative, S picker, Del delete, F/T/L views, Space reset, W wireframe.
Addon — M retopo mark, O iso 35.264deg ortho view, A masking, Q local scale.
