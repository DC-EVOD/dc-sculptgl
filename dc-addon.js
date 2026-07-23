/* dc-addon.js — DIMENSION//CONCEPT layer for SculptGL (Shape B pseudo-fork).
 * All customization lives here + resources/dc/. Upstream bundle untouched
 * except: window.dcApp handle in index.html, 3 matcap entries in the list.
 *
 * Verified seams (read from source 2026-07-22):
 *   - window.postprocessGui() called at end of Gui.initGui  (Gui.js:89)
 *   - app.onLoadAlphaImage(img, name) -> Picking.addAlpha + GUI combobox
 *   - app.getSculptManager().getTool(8)._color  (8 = Enums.Tools.PAINT)
 */
(function () {
  'use strict';

  var ALPHAS = [
    ['resources/dc/alpha_chitin_ribs.png',    'DC Chitin Ribs'],
    ['resources/dc/alpha_flute_groove.png',   'DC Flute Groove'],
    ['resources/dc/alpha_boss_row.png',       'DC Boss Row'],
    ['resources/dc/alpha_segment_crease.png', 'DC Segment Crease'],
    ['resources/dc/alpha_scar_tear.png',      'DC Scar Tear'],
    ['resources/dc/alpha_chitin_ribs_tile.png',  'DC Chitin Ribs TILE'],
    ['resources/dc/alpha_flute_groove_tile.png', 'DC Flute Groove TILE'],
    ['resources/dc/alpha_boss_row_tile.png',     'DC Boss Row TILE']
  ];

  // Canon swatches. First three hexes are PIL-gated reference reads
  // (armour charcoal, void-violet, Cherenkov cyan). The rest are
  // PROVISIONAL approximations of design-law palette words — David
  // corrects, then they harden.
  var PALETTE = [
    ['#2F3138', 'Armour Charcoal'],
    ['#8F69E9', 'Void Violet'],
    ['#4BAFD1', 'Cherenkov Cyan'],
    ['#D9CDB4', 'Cold Bone ~'],
    ['#6E1414', 'Blood Dryat ~'],
    ['#0B0A10', 'Gloam Black ~']
  ];

  var TOOL_PAINT = 8;

  var dcAlpha = { scale: 1.0, intensity: 1.0, tile: false };

  function mirrorWrap(v) {
    v = Math.abs(v) % 4.0;
    if (v > 2.0) v = 4.0 - v;
    return v - 1.0;
  }

  // Replaces Picking.getAlpha on BOTH picking instances (main + symmetry).
  // Defaults (scale 1, intensity 1, tile off) are bit-identical to stock
  // - verified against the transcribed stock formula, tests T1-T5.
  function installSampler(picking) {
    picking.getAlpha = function (x, y, z) {
      var alpha = this._alpha;
      if (!alpha || !alpha._texture) return 1.0;
      var m = this._alphaLookAt, rs = this._alphaSide;
      var S = dcAlpha.scale;
      var xn = S * alpha._ratioY * (m[0]*x + m[4]*y + m[8]*z + m[12]) / (this._xSym ? -rs : rs);
      var yn = S * alpha._ratioX * (m[1]*x + m[5]*y + m[9]*z + m[13]) / rs;
      var v;
      if (dcAlpha.tile) {
        xn = mirrorWrap(xn); yn = mirrorWrap(yn);
      } else if (Math.abs(xn) > 1.0 || Math.abs(yn) > 1.0) {
        v = 0.0;
      }
      if (v === undefined) {
        var aw = alpha._width;
        var xi = (0.5 - xn * 0.5) * aw;
        var yi = (0.5 - yn * 0.5) * alpha._height;
        xi = Math.min(aw - 1, Math.max(0, xi | 0));
        yi = Math.min(alpha._height - 1, Math.max(0, yi | 0));
        v = alpha._texture[xi + aw * yi] / 255.0;
      }
      return Math.max(0.0, Math.min(1.0, 1.0 - dcAlpha.intensity * (1.0 - v)));
    };
  }

  function loadAlphas(app) {
    ALPHAS.forEach(function (a) {
      var img = new Image();
      img.onload = function () { app.onLoadAlphaImage(img, a[1]); };
      img.onerror = function () { console.warn('[DC] alpha missing:', a[0]); };
      img.src = a[0];
    });
  }

  function hexToVec(hex) {
    return [1, 3, 5].map(function (i) {
      return parseInt(hex.substr(i, 2), 16) / 255;
    });
  }

  function buildPalettePanel(app) {
    var panel = document.createElement('div');
    panel.id = 'dc-palette';
    panel.style.cssText =
      'position:fixed;left:8px;bottom:8px;z-index:9999;display:flex;gap:6px;' +
      'padding:6px 8px;background:rgba(11,10,16,.85);border:1px solid #8F69E9;' +
      'border-radius:6px;font:11px sans-serif;color:#cbd;align-items:center;';
    var tag = document.createElement('span');
    tag.textContent = 'D//C';
    tag.style.cssText = 'color:#8F69E9;letter-spacing:1px;margin-right:2px;';
    panel.appendChild(tag);

    PALETTE.forEach(function (p) {
      var sw = document.createElement('div');
      sw.title = p[1] + ' ' + p[0];
      sw.style.cssText =
        'width:22px;height:22px;border-radius:4px;cursor:pointer;' +
        'border:1px solid #444;background:' + p[0] + ';';
      sw.onclick = function () {
        var tool = app.getSculptManager().getTool(TOOL_PAINT);
        var v = hexToVec(p[0]);
        tool._color[0] = v[0]; tool._color[1] = v[1]; tool._color[2] = v[2];
        sw.style.borderColor = '#4BAFD1';
        setTimeout(function () { sw.style.borderColor = '#444'; }, 350);
      };
      panel.appendChild(sw);
    });
    document.body.appendChild(panel);
    return panel;
  }

  /* ================= FORGE PANEL (v3) =================================
   * Bridge to the local DC FORGE DAEMON (forge_daemon.py, port 8571).
   * Seams verified against the DEPLOYED bundle 2026-07-22:
   *   - app.loadScene(arrayBuffer,'ply')  imports + pushStateAdd (undoable)
   *   - app.clearScene()  states reset, meshes emptied, camera reset
   *   - app.getMeshes(); mesh.getVertices/getColors/getFaces/getMatrix/
   *     getNbVertices/getNbFaces/getNbQuads/getNbTriangles
   *   - sculptManager.setToolIndex(i); TRI_INDEX = 4294967295
   * exportScenePLY is a TRANSCRIPTION of the stock Export.exportBinaryPLY
   * + Utils.mergeArrays (read from the bundle), since the Export module is
   * sealed inside the webpack closure. Little-endian always.
   * ==================================================================== */

  // Daemon address: override with localStorage.setItem('dc-forge-daemon', 'https://...')
  // (a future cloud forge is a settings change, not a redeploy)
  var DAEMON = (function () {
    try { return localStorage.getItem('dc-forge-daemon') || 'http://localhost:8571'; }
    catch (e) { return 'http://localhost:8571'; }
  })();
  var TRI_INDEX = 4294967295;
  var CYAN = [0.0, 1.0, 1.0];             // RETOPO MARK — pure (0,255,255)
  var forgeState = { busy: false, replace: true };

  function xformPoint(m, x, y, z, out, o) { // gl-matrix column-major, w=1
    out[o]     = m[0] * x + m[4] * y + m[8]  * z + m[12];
    out[o + 1] = m[1] * x + m[5] * y + m[9]  * z + m[13];
    out[o + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
  }

  function exportScenePLY(app) {
    var meshes = app.getMeshes();
    if (!meshes || !meshes.length) return null;
    var nv = 0, nf = 0, nq = 0, nt = 0, k;
    for (k = 0; k < meshes.length; ++k) {
      nv += meshes[k].getNbVertices(); nf += meshes[k].getNbFaces();
      nq += meshes[k].getNbQuads();    nt += meshes[k].getNbTriangles();
    }
    var V = new Float32Array(3 * nv);
    var C = new Float32Array(3 * nv);
    var F = new Uint32Array(4 * nf);
    var vOff = 0, fOff = 0, base = 0, i, h;
    for (k = 0; k < meshes.length; ++k) {
      var me = meshes[k];
      var v = me.getVertices(), c = me.getColors(), f = me.getFaces();
      var R = me.getNbVertices(), X = me.getNbFaces(), M = me.getMatrix();
      for (i = 0; i < R; ++i) {
        h = 3 * i;
        xformPoint(M, v[h], v[h + 1], v[h + 2], V, vOff + h);
        C[vOff + h] = c[h]; C[vOff + h + 1] = c[h + 1]; C[vOff + h + 2] = c[h + 2];
      }
      for (i = 0; i < X; ++i) {
        h = 4 * i;
        F[fOff + h]     = f[h] + base;
        F[fOff + h + 1] = f[h + 1] + base;
        F[fOff + h + 2] = f[h + 2] + base;
        F[fOff + h + 3] = (f[h + 3] === TRI_INDEX) ? TRI_INDEX : f[h + 3] + base;
      }
      base += R; vOff += 3 * R; fOff += 4 * X;
    }
    var head = 'ply\nformat binary_little_endian 1.0\ncomment created by SculptGL\n' +
      'element vertex ' + nv + '\n' +
      'property float x\nproperty float y\nproperty float z\n' +
      'property uchar red\nproperty uchar green\nproperty uchar blue\n' +
      'element face ' + nf + '\n' +
      'property list uchar uint vertex_indices\nend_header\n';
    var bytes = head.length + (12 + 3) * nv + (4 * nq + 3 * nt) * 4 + nf;
    var buf = new Uint8Array(bytes);
    var dv = new DataView(buf.buffer);
    var T = 0;
    for (T = 0; T < head.length; ++T) buf[T] = head.charCodeAt(T);
    for (i = 0; i < nv; ++i) {
      h = 3 * i;
      dv.setFloat32(T, V[h], true); T += 4;
      dv.setFloat32(T, V[h + 1], true); T += 4;
      dv.setFloat32(T, V[h + 2], true); T += 4;
      dv.setUint8(T, Math.round(255 * Math.min(1, Math.max(0, C[h]))));     T += 1;
      dv.setUint8(T, Math.round(255 * Math.min(1, Math.max(0, C[h + 1])))); T += 1;
      dv.setUint8(T, Math.round(255 * Math.min(1, Math.max(0, C[h + 2])))); T += 1;
    }
    for (i = 0; i < nf; ++i) {
      h = 4 * i;
      var quad = F[h + 3] !== TRI_INDEX;
      dv.setUint8(T, quad ? 4 : 3); T += 1;
      dv.setUint32(T, F[h], true); T += 4;
      dv.setUint32(T, F[h + 1], true); T += 4;
      dv.setUint32(T, F[h + 2], true); T += 4;
      if (quad) { dv.setUint32(T, F[h + 3], true); T += 4; }
    }
    return buf.buffer;
  }

  function downloadBlob(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  function forgeStatus(msg, color) {
    var el = document.getElementById('dc-forge-status');
    if (el) { el.textContent = msg; el.style.color = color || '#9ab'; }
  }

  // PRIMARY path on this machine: package the job for the Claude forge.
  // Mesh gzips in-browser (CompressionStream) so it survives a weak link;
  // with Chrome's download folder set to <repo>/jobs, the job lands in the
  // repo — run ./push-job.sh, tell Claude "pushed", Claude pulls it from
  // the repo, runs the engine, hands the result back.
  // === DC FORGE — self-describing job spec (auto-inserted) ===
  var DC_FORGE_INSTRUCTIONS = JSON.stringify({
    dc_forge_job: "1.0",
    read_this_first: "Self-describing. Do everything below in headless Blender WITHOUT asking the user to re-explain. User is on a 4GB Chromebook with unreliable uploads — do not make them re-send.",
    mesh_format: {
      container: "gzip (single .ply — chromebook upload-size workaround, NOT an archive)",
      ply: "SculptGL binary_little_endian: vertex = x,y,z float + red,green,blue uchar; faces = quad list. NO UVs, NO maps — material baked to VERTEX COLOR before export.",
      trailing_bytes: "SculptGL appends zero-padding after faces. Null-fill, not data — ignore."
    },
    environment: {
      blender: "Install blender 4.0.2 via apt if absent (version parity). Verify bpy imports headless first.",
      no_numpy_in_blender: "Blender python lacks numpy — parse/raster in pure python inside Blender, or use system python3 for the raster step.",
      cycles_broken: "DO NOT bake with Cycles — silent all-black map. Use a BARYCENTRIC RASTERIZER."
    },
    pipeline: [
      "1. Ungzip .ply. Parse SculptGL binary manually (xyz + rgb uchar; quad faces). Ignore trailing zero-padding.",
      "2. MEASURE + report: verts, faces (confirm quads), bounds, tallest axis (must be Y), vertex-color unique count.",
      "3. QUAD REMESH via QuadriFlow at params.target_faces (clean even quads, NOT subdivision). Confirm 100% quads.",
      "4. TRANSFER vertex color: each new vertex = nearest source vertex color (KD-tree). Retains baked paint.",
      "5. UV UNWRAP (Smart UV Project, angle_limit ~1.15, island_margin ~0.02) — own uvs, texture+density decoupled.",
      "6. BAKE albedo: barycentric-rasterize vertex color through UVs into 2048 PNG. Dilate edges ~4px. VERIFY non-black (unique>1000, coverage>5%); if black, FAILED — say so, don't ship.",
      "7. EXPORT: OBJ + UVs + normals + MTL, forward_axis Y up_axis Z (no axis flip). Gzip OBJ. Deliver OBJ.gz + albedo.png + preview."
    ],
    gotchas: [
      "OBJ export default axis-conversion lays model on its back — force forward Y / up Z.",
      "Cycles diffuse bake = all-black here — use rasterizer.",
      "trimesh fails on SculptGL PLY (assumes tris; faces are quads) — parse manually.",
      "Fewer verts = lower vertex-color res — that's why we give real UVs + albedo map."
    ],
    laws: [
      "AUDITER: no fidelity claim without a real tool-call receipt this session.",
      "Measure before claiming.",
      "No substitution — real op only, never a guess dressed as the result.",
      "Fail honestly over false success (black bake = FAILURE).",
      "State whose implementation it is (Claude's, not the user's intake.py unless supplied)."
    ],
    return_to_user: "Deliver files; state ACTUAL METHOD / RESULT / VERIFIED / LIMITATIONS. User re-uploads into the fork."
  }, null, 2);

  function packageJob(op, params, plyBuf) {
    var stamp = new Date().toISOString().replace(/[:.]/g, '-');
    var base = 'dc_' + op + '_' + stamp;
    function finish(blob, name) {
      downloadBlob(blob, name);
      downloadBlob(new Blob([JSON.stringify({
        op: op, params: params, file: name,
        spec: 'dc_forge_instructions.json',
        note: 'DC FORGE JOB - push jobs/ to the repo (./push-job.sh), then tell Claude: pushed. READ dc_forge_instructions.json FIRST — full pipeline; run it cold.'
      }, null, 2)], { type: 'application/json' }), base + '.json');
      downloadBlob(new Blob([DC_FORGE_INSTRUCTIONS], { type: 'application/json' }), 'dc_forge_instructions.json');
      forgeStatus('job saved — push jobs/, ping Claude', '#4BAFD1');
    }
    if (typeof CompressionStream !== 'undefined') {
      var stream = new Blob([plyBuf]).stream().pipeThrough(new CompressionStream('gzip'));
      new Response(stream).blob().then(function (gz) {
        finish(gz, base + '.ply.gz');
      }).catch(function () { finish(new Blob([plyBuf]), base + '.ply'); });
    } else {
      finish(new Blob([plyBuf]), base + '.ply');
    }
  }

  function forgeSend(app, op, params) {
    if (forgeState.busy) return;
    var ply = exportScenePLY(app);
    if (!ply) { forgeStatus('no mesh in scene', '#c66'); return; }
    var qs = Object.keys(params).map(function (k) {
      return k + '=' + encodeURIComponent(params[k]);
    }).join('&');
    forgeState.busy = true;
    forgeStatus(op.toUpperCase() + ' → forge…', '#4BAFD1');
    fetch(DAEMON + '/' + op + (qs ? '?' + qs : ''), {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: ply
    }).then(function (r) {
      var receipt = r.headers.get('X-DC-Receipt');
      if (receipt) console.log('[DC] forge receipt:', JSON.parse(receipt));
      if (!r.ok) return r.text().then(function (t) { throw new Error(t.slice(0, 300)); });
      return op === 'bake' ? r.blob() : r.arrayBuffer();
    }).then(function (res) {
      if (op === 'bake') {
        downloadBlob(res, (params.name || 'asset') + '_bake.zip');
        forgeStatus('bake zip saved', '#6c6');
      } else {
        if (forgeState.replace) app.clearScene();  // NOTE: also clears undo
        app.loadScene(res, 'ply');
        forgeStatus(op + ' done — mesh reloaded', '#6c6');
      }
    }).catch(function (e) {
      console.warn('[DC] forge:', e);
      if (e instanceof TypeError) packageJob(op, params, ply); // no daemon reachable
      else forgeStatus('engine error — see console', '#c66');
    }).finally(function () { forgeState.busy = false; });
  }

  function buildForgePanel(app) {
    var panel = document.createElement('div');
    panel.id = 'dc-forge';
    panel.style.cssText =
      'position:fixed;right:8px;bottom:8px;z-index:9999;display:flex;gap:8px;' +
      'padding:6px 8px;background:rgba(11,10,16,.85);border:1px solid #8F69E9;' +
      'border-radius:6px;font:11px sans-serif;color:#cbd;align-items:center;';

    var dot = document.createElement('span');
    dot.title = 'DC FORGE DAEMON (localhost:8571)';
    dot.style.cssText = 'width:9px;height:9px;border-radius:50%;background:#666;' +
      'display:inline-block;';
    panel.appendChild(dot);
    var tag = document.createElement('span');
    tag.textContent = 'FORGE';
    tag.style.cssText = 'color:#8F69E9;letter-spacing:1px;';
    panel.appendChild(tag);

    var pollFails = 0, pollTick = 0;
    function poll() {
      pollTick++;
      if (pollFails >= 3 && pollTick % 12 !== 0) return;  // back off: spam-free console
      fetch(DAEMON + '/health').then(function (r) { return r.json(); })
        .then(function (j) {
          pollFails = 0;
          dot.style.background = j.ok ? '#4BAFD1' : '#c96';
        })
        .catch(function () { pollFails++; dot.style.background = '#666'; });
    }
    poll(); setInterval(poll, 5000);

    function btn(label, title, fn) {
      var b = document.createElement('button');
      b.textContent = label; b.title = title;
      b.style.cssText = 'background:#1a1722;color:#cbd;border:1px solid #444;' +
        'border-radius:4px;padding:3px 7px;cursor:pointer;font:11px sans-serif;';
      b.onmouseenter = function () { b.style.borderColor = '#8F69E9'; };
      b.onmouseleave = function () { b.style.borderColor = '#444'; };
      b.onclick = fn;
      return b;
    }
    function sel(opts, val) {
      var s = document.createElement('select');
      s.style.cssText = 'background:#1a1722;color:#cbd;border:1px solid #444;' +
        'border-radius:4px;font:11px sans-serif;';
      opts.forEach(function (o) {
        var op = document.createElement('option');
        op.value = o; op.textContent = o; s.appendChild(op);
      });
      s.value = val;
      return s;
    }

    var remeshSel = sel(['none', 'voxel', 'quad'], 'none');
    panel.appendChild(btn('INTAKE', 'clean/remesh via daemon', function () {
      forgeSend(app, 'intake', { remesh: remeshSel.value });
    }));
    panel.appendChild(remeshSel);

    var ringsSel = sel(['2', '3', '4', '5'], '3');
    panel.appendChild(btn('RINGS', 'white LOOPS marks → edge rings', function () {
      forgeSend(app, 'rings', { rings: ringsSel.value, mark: 'white' });
    }));
    panel.appendChild(ringsSel);

    var resSel = sel(['512', '1024', '2048'], '1024');
    panel.appendChild(btn('EXPORT', 'UV unwrap + texture bake → zip (the Unity gate)', function () {
      forgeSend(app, 'bake', { res: resSel.value, ao: 1, name: 'dc_asset' });
    }));
    panel.appendChild(resSel);

    panel.appendChild(btn('LOOPS', 'Edge Loops brush — paint joint bands white (M)', function () {
      dcArmLoops(app);
    }));
    panel.appendChild(btn('ISO', 'orthographic 35.264\u00B0 isometric view (O)', function () {
      isoView(app);
    }));

    var mapsInput = document.createElement('input');
    mapsInput.type = 'file'; mapsInput.multiple = true; mapsInput.accept = 'image/*';
    mapsInput.style.display = 'none';
    mapsInput.onchange = function () {
      if (mapsInput.files.length) dcApplyMaps(app, mapsInput.files);
      mapsInput.value = '';
    };
    panel.appendChild(mapsInput);
    panel.appendChild(btn('MAPS', 'bake PBR maps (albedo/rough/metal PNGs) onto the mesh as paint', function () {
      mapsInput.click();
    }));

    var rl = document.createElement('label');
    rl.title = 'reload result into a cleared scene (clears undo history)';
    rl.style.cssText = 'display:flex;align-items:center;gap:3px;color:#9ab;cursor:pointer;';
    var rc = document.createElement('input');
    rc.type = 'checkbox'; rc.checked = forgeState.replace;
    rc.onchange = function () { forgeState.replace = rc.checked; };
    rl.appendChild(rc); rl.appendChild(document.createTextNode('REPL'));
    panel.appendChild(rl);

    var st = document.createElement('span');
    st.id = 'dc-forge-status';
    st.style.cssText = 'color:#9ab;max-width:180px;overflow:hidden;' +
      'text-overflow:ellipsis;white-space:nowrap;';
    panel.appendChild(st);

    document.body.appendChild(panel);
  }

  /* ============ SIDEBAR ALPHA CONTROLS (v3.2) =========================
   * Injects Alpha Radius / Alpha Intensity / TILE into the sidebar's
   * Alpha section, using yagui's own markup (read from the bundle):
   * rows are <li>, label.gui-label-side, input.gui-input-number +
   * div.gui-slider>div. Each alpha-capable tool builds its OWN Alpha
   * section (div.group-title "Alpha"), so we inject into every one and
   * keep all copies synced to the shared dcAlpha state.
   * ================================================================== */
  var dcSyncFns = [];

  function dcSliderRow(label, min, max, key) {
    var li = document.createElement('li');
    li.className = 'dc-alpha-row';
    var lab = document.createElement('label');
    lab.className = 'gui-label-side';
    lab.innerHTML = label;
    var num = document.createElement('input');
    num.className = 'gui-input-number';
    num.type = 'number'; num.min = min; num.max = max; num.step = 0.05;
    var track = document.createElement('div');
    track.className = 'gui-slider';
    var fill = document.createElement('div');
    track.appendChild(fill);
    function clamp(v) { return Math.min(max, Math.max(min, v)); }
    function paint() {
      var v = dcAlpha[key];
      fill.style.width = ((v - min) / (max - min) * 100) + '%';
      if (document.activeElement !== num) num.value = v.toFixed(2);
    }
    function setVal(v) {
      dcAlpha[key] = clamp(v);
      dcSyncFns.forEach(function (f) { f(); });
    }
    num.onchange = function () { setVal(parseFloat(num.value) || dcAlpha[key]); };
    function fromEvent(e) {
      var r = track.getBoundingClientRect();
      setVal(min + (max - min) * Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    }
    track.addEventListener('pointerdown', function (e) {
      track.setPointerCapture(e.pointerId); fromEvent(e); e.preventDefault();
    });
    track.addEventListener('pointermove', function (e) {
      if (e.buttons) fromEvent(e);
    });
    li.appendChild(lab); li.appendChild(num); li.appendChild(track);
    dcSyncFns.push(paint); paint();
    return li;
  }

  function dcTileRow() {
    var li = document.createElement('li');
    li.className = 'dc-alpha-row';
    var lab = document.createElement('label');
    lab.className = 'gui-label-side';
    lab.innerHTML = 'Tile (mirror wrap)';
    var cb = document.createElement('input');
    cb.className = 'gui-input-checkbox';
    cb.type = 'checkbox';
    function paint() { cb.checked = dcAlpha.tile; }
    cb.onchange = function () {
      dcAlpha.tile = cb.checked;
      dcSyncFns.forEach(function (f) { f(); });
    };
    li.appendChild(lab); li.appendChild(cb);
    dcSyncFns.push(paint); paint();
    return li;
  }

  function injectAlphaControls(app) {
    // yagui.css caps open folders at max-height:700px with overflow:hidden;
    // our injected rows push the Sculpting folder past it and the tail gets
    // clipped unreachable. Raise the ceiling (sidebar itself scrolls, and
    // 2000px keeps the open/close max-height transition animating).
    if (!document.getElementById('dc-css-fix')) {
      var st = document.createElement('style');
      st.id = 'dc-css-fix';
      st.textContent = '.gui-sidebar > ul[opened=true]{max-height:2000px !important;}';
      document.head.appendChild(st);
    }
    // idempotent: clear previous injections (e.g. GUI rebuilt on language change)
    dcSyncFns.length = 0;
    var old = document.querySelectorAll('.dc-alpha-row');
    for (var i = 0; i < old.length; ++i) old[i].parentNode.removeChild(old[i]);
    // ONE set of rows, docked in the Common section (exists once, shows for
    // every tool). Per-Alpha-section injection duplicated visibly because
    // stock rows hide/show via a per-tool registry ours can't join.
    // Anchor: GuiSculpting._ctrlTitleCommon (bundle-verified, locale-proof).
    var gui = app.getGui();
    var anchor = null;
    for (var k in gui) {
      var o = gui[k];
      if (o && typeof o === 'object' && o._ctrlSculpt && o._ctrlTitleCommon) {
        anchor = o._ctrlTitleCommon.domText;
        break;
      }
    }
    if (!anchor) { console.warn('[DC] Common title not found'); return 0; }
    var rows = [dcSliderRow('Alpha Radius', 0.25, 4, 'scale'),
                dcSliderRow('Alpha Intensity', 0, 2, 'intensity'),
                dcTileRow()];
    for (var r = rows.length - 1; r >= 0; --r)
      anchor.parentNode.insertBefore(rows[r], anchor.nextSibling);
    return 1;
  }

  /* ============ MAPS: bake PBR textures onto vertex data (v3.7) =======
   * SculptGL paints VERTEX colors, so "see my maps and paint over them"
   * means sampling each map at every vertex's UV and writing the result
   * into the vertex color / material arrays. OBJ UVs survive import
   * (importer parses vt + per-corner indices — bundle-verified); commit
   * chain is the paint tool's own: updateDuplicateColorsAndMaterials ->
   * updateDrawArrays -> render. Materials = [roughness, metalness, mask].
   * Resolution = mesh density: subdivide first for finer detail.
   * ================================================================== */
  function dcClassifyMap(name) {
    if (/rough/i.test(name)) return 'rough';
    if (/metal/i.test(name)) return 'metal';
    if (/albedo|diffuse|base|color|colour/i.test(name)) return 'albedo';
    return null;
  }

  function dcImageData(file) {
    return createImageBitmap(file).then(function (bmp) {
      var c = document.createElement('canvas');
      c.width = bmp.width; c.height = bmp.height;
      var ctx = c.getContext('2d');
      ctx.drawImage(bmp, 0, 0);
      return ctx.getImageData(0, 0, bmp.width, bmp.height);
    });
  }

  function dcSampleUV(img, u, v) {
    if (u < 0 || u > 1) u = u - Math.floor(u);           // wrap tiled UVs,
    if (v < 0 || v > 1) v = v - Math.floor(v);           // but keep exact 1.0
    var x = Math.min(img.width - 1, Math.round(u * (img.width - 1)));
    var y = Math.min(img.height - 1, Math.round((1 - v) * (img.height - 1)));
    return 4 * (y * img.width + x);                       // index into .data
  }

  function dcApplyMaps(app, fileList) {
    var mesh = app.getMesh();
    if (!mesh) { forgeStatus('no mesh selected', '#c66'); return; }
    if (!mesh.hasUV || !mesh.hasUV()) {
      forgeStatus('mesh has no UVs — import an OBJ that has them', '#c66');
      return;
    }
    var tc = mesh.getTexCoords();
    var nv = mesh.getNbVertices();
    if (!tc || tc.length < nv * 2) {
      forgeStatus('UV data shorter than vertex count — cannot sample', '#c66');
      return;
    }
    var jobs = [], names = { albedo: null, rough: null, metal: null };
    for (var i = 0; i < fileList.length; ++i) {
      var kind = dcClassifyMap(fileList[i].name);
      if (!kind && fileList.length === 1) kind = 'albedo';  // lone file = albedo
      if (kind && !names[kind]) {
        names[kind] = fileList[i].name;
        (function (k, f) {
          jobs.push(dcImageData(f).then(function (d) { return { kind: k, img: d }; }));
        })(kind, fileList[i]);
      }
    }
    if (!jobs.length) {
      forgeStatus('no usable maps (name them albedo/rough/metal)', '#c66');
      return;
    }
    forgeStatus('baking maps onto vertices…', '#4BAFD1');
    Promise.all(jobs).then(function (maps) {
      var colors = mesh.getColors();
      var mats = mesh.getMaterials();
      var applied = [];
      maps.forEach(function (m) {
        var d = m.img.data;
        for (var i = 0; i < nv; ++i) {
          var p = dcSampleUV(m.img, tc[2 * i], tc[2 * i + 1]);
          if (m.kind === 'albedo') {
            colors[3 * i]     = d[p] / 255;
            colors[3 * i + 1] = d[p + 1] / 255;
            colors[3 * i + 2] = d[p + 2] / 255;
          } else if (m.kind === 'rough') {
            mats[3 * i] = d[p] / 255;
          } else {
            mats[3 * i + 1] = d[p] / 255;
          }
        }
        applied.push(m.kind);
      });
      mesh.updateDuplicateColorsAndMaterials();
      mesh.updateDrawArrays();
      mesh.setShaderType(0);   // PBR — matcap ignores vertex color and hides the bake
      app.render();
      forgeStatus('baked: ' + applied.join(' + ') + ' → vertex data (PBR on)', '#6c6');
      console.log('[DC] maps baked onto ' + nv + ' verts:', names);
    }).catch(function (e) {
      console.warn('[DC] maps:', e);
      forgeStatus('map bake failed — see console', '#c66');
    });
  }

  /* ============ OBJECTS PANEL — scene outliner (v3.9) =================
   * Stock SculptGL has no scene list; imported meshes stack invisibly
   * (the "piled on and looks like shit" problem). This panel lists every
   * mesh: click = select, eye = show/hide (mesh.setVisible, renderer-
   * honored), x = delete (through the fixed delete path). Rebuilds when
   * the scene composition or selection changes.
   * ================================================================== */
  function buildObjectsPanel(app) {
    var panel = document.createElement('div');
    panel.id = 'dc-objects';
    panel.style.cssText =
      'position:fixed;left:8px;top:120px;z-index:9999;min-width:150px;' +
      'padding:6px 8px;background:rgba(11,10,16,.85);border:1px solid #8F69E9;' +
      'border-radius:6px;font:11px sans-serif;color:#cbd;';
    var tag = document.createElement('div');
    tag.textContent = 'OBJECTS';
    tag.style.cssText = 'color:#8F69E9;letter-spacing:1px;margin-bottom:4px;';
    panel.appendChild(tag);
    var list = document.createElement('div');
    panel.appendChild(list);
    document.body.appendChild(panel);

    var lastSig = '';
    function rebuild() {
      var meshes = app.getMeshes();
      var cur = app.getMesh();
      var sig = meshes.map(function (m) {
        return m.getID() + ':' + (m.isVisible() ? 1 : 0) + (m === cur ? '*' : '');
      }).join(',');
      if (sig === lastSig) return;
      lastSig = sig;
      list.innerHTML = '';
      if (!meshes.length) {
        var empty = document.createElement('div');
        empty.textContent = '(scene empty)';
        empty.style.color = '#667';
        list.appendChild(empty);
        return;
      }
      meshes.forEach(function (m) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:2px 3px;' +
          'border-radius:3px;cursor:pointer;' +
          (m === cur ? 'background:#2a2440;border:1px solid #4BAFD1;' : 'border:1px solid transparent;');
        var eye = document.createElement('span');
        eye.textContent = m.isVisible() ? '\u25C9' : '\u25CB';
        eye.title = m.isVisible() ? 'hide' : 'show';
        eye.style.cssText = 'cursor:pointer;color:' + (m.isVisible() ? '#4BAFD1' : '#555') + ';';
        eye.onclick = function (ev) {
          ev.stopPropagation();
          m.setVisible(!m.isVisible());
          app.render(); lastSig = ''; rebuild();
        };
        var label = document.createElement('span');
        var nv = m.getNbVertices();
        label.textContent = 'Mesh ' + m.getID() + ' \u00B7 ' +
          (nv > 999 ? (nv / 1000).toFixed(1) + 'k' : nv) + 'v';
        label.style.flex = '1';
        var del = document.createElement('span');
        del.textContent = '\u2715';
        del.title = 'delete this mesh';
        del.style.cssText = 'cursor:pointer;color:#c66;padding:0 2px;';
        del.onclick = function (ev) {
          ev.stopPropagation();
          app.setMesh(m);
          app.deleteCurrentSelection();
          app.render(); lastSig = ''; rebuild();
        };
        row.onclick = function () {
          app.setMesh(m); app.render(); lastSig = ''; rebuild();
        };
        row.appendChild(eye); row.appendChild(label); row.appendChild(del);
        list.appendChild(row);
      });
    }
    rebuild();
    setInterval(rebuild, 1500);
    return panel;
  }

  /* ============ DC WORLD — lookdev defaults (v3.10) ===================
   * Stock SculptGL lookdev was always the weak wall: exposure 1, the dim
   * "Mpumalanga veld" env, curvature 20, filmic off. This pass resets the
   * world through the Rendering panel's OWN controls (GUI stays synced)
   * and only touches knobs still at FACTORY values — one manual tweak by
   * the user and that knob is theirs forever.
   *   exposure 1 -> 2.2 | env 0 -> 2 (Studio small 01)
   *   curvature 20 -> 50 (the cavity-depth read) | filmic on
   * ================================================================== */
  function applyWorldDefaults(app) {
    var gui = app.getGui();
    var gr = null;
    for (var k in gui) {
      var o = gui[k];
      if (o && typeof o === 'object' && o._ctrlExposure) { gr = o; break; }
    }
    if (!gr) { console.warn('[DC] WORLD: rendering gui NOT FOUND — nothing set'); return; }
    // David's spec, landed every boot: Studio small 01 / exposure 1.8 / curvature 10
    function knob(name, ctrl, val) {
      try { ctrl.setValue(val); console.log('[DC] WORLD ' + name + ' -> ' + val); }
      catch (e) { console.warn('[DC] WORLD ' + name + ' FAILED:', e); }
    }
    if (gr._ctrlEnv) knob('environment', gr._ctrlEnv, 2); else console.warn('[DC] WORLD no _ctrlEnv');
    if (gr._ctrlExposure) knob('exposure', gr._ctrlExposure, 1.8);
    if (gr._ctrlCurvature) knob('curvature', gr._ctrlCurvature, 10); else console.warn('[DC] WORLD no _ctrlCurvature');
    app.render();
  }

  // every mesh that ENTERS the scene lands in PBR (once per mesh — switch it
  // yourself after and the addon never touches that mesh's shader again)
  var dcPbrSeen = {};
  function dcPbrOnArrival(app) {
    setInterval(function () {
      var ms = app.getMeshes();
      var changed = false;
      for (var i = 0; i < ms.length; ++i) {
        var id = ms[i].getID();
        if (!dcPbrSeen[id]) {
          dcPbrSeen[id] = true;
          try { ms[i].setShaderType(0); changed = true; } catch (e) {}
        }
      }
      if (changed) app.render();
    }, 1000);
  }

  /* ---- draggable panels, positions persisted ------------------------- */
  function makeDraggable(panel, grip, storeKey) {
    try {
      var saved = localStorage.getItem(storeKey);
      if (saved) {
        var p = JSON.parse(saved);
        // clamp restored position into the current viewport — a stale save
        // from a different window size can park the panel off-screen
        var x = Math.min(Math.max(0, p.x), Math.max(0, window.innerWidth - 60));
        var y = Math.min(Math.max(0, p.y), Math.max(0, window.innerHeight - 30));
        panel.style.left = x + 'px'; panel.style.top = y + 'px';
        panel.style.right = 'auto'; panel.style.bottom = 'auto';
      }
    } catch (e) {}
    grip.style.cursor = 'move';
    grip.style.touchAction = 'none';
    grip.addEventListener('pointerdown', function (e) {
      var r = panel.getBoundingClientRect();
      var dx = e.clientX - r.left, dy = e.clientY - r.top;
      grip.setPointerCapture(e.pointerId);
      function move(ev) {
        var x = Math.min(window.innerWidth - 40, Math.max(0, ev.clientX - dx));
        var y = Math.min(window.innerHeight - 20, Math.max(0, ev.clientY - dy));
        panel.style.left = x + 'px'; panel.style.top = y + 'px';
        panel.style.right = 'auto'; panel.style.bottom = 'auto';
      }
      function up(ev) {
        grip.removeEventListener('pointermove', move);
        grip.removeEventListener('pointerup', up);
        var rr = panel.getBoundingClientRect();
        try { localStorage.setItem(storeKey, JSON.stringify({ x: rr.left, y: rr.top })); }
        catch (err) {}
      }
      grip.addEventListener('pointermove', move);
      grip.addEventListener('pointerup', up);
      e.preventDefault();
    });
  }

  /* ============ QOL PATCHES (v3.2) ====================================
   * 1) DELETE FIX — upstream removeMeshes does splice(getIndexMesh(m),1);
   *    getIndexMesh returns -1 on a miss and splice(-1,1) deletes the LAST
   *    mesh in the scene: failed lookup silently kills the wrong object.
   *    Patched with an index guard; deleteCurrentSelection also made to
   *    work when a mesh is active but _selectMeshes is empty.
   * 2) ISO VIEW — camera.setOrbit(atan(1/sqrt(2)), 45deg) + orthographic:
   *    the true 35.264deg isometric, built with the camera's own preset
   *    math (verified from the bundle; top-down is +rotX).
   * 3) HOTKEYS — stock build already has: 1-9 tools, 0 Move, E Transform,
   *    X radius, C intensity, N negative, S picker, Del delete,
   *    F/T/L front/top/left, Space reset, W wireframe, R remesh.
   *    Addon adds: M = RETOPO MARK, O = iso view, A = Masking,
   *    Q = Local Scale (all verified unbound in the stock map).
   * ================================================================== */
  var ISO_PITCH = Math.atan(1 / Math.sqrt(2));   // 0.6154797 rad = 35.264deg

  function fixDeleteSelection(app) {
    app.removeMeshes = function (arr) {
      for (var r = 0; r < arr.length; ++r) {
        var i = this.getIndexMesh(arr[r]);
        if (i >= 0) this._meshes.splice(i, 1);   // guard: no splice(-1) footgun
      }
    };
    app.deleteCurrentSelection = function () {
      if (!this._mesh) return;
      if (!this._selectMeshes.length) this._selectMeshes.push(this._mesh);
      this.removeMeshes(this._selectMeshes);
      this._stateManager.pushStateRemove(this._selectMeshes.slice());
      this._selectMeshes.length = 0;
      this.setMesh(null);
    };
  }

  function isoView(app) {
    var cam = app.getCamera();
    cam.setProjectionType(1);                    // Enums.Projection.ORTHOGRAPHIC
    cam.setOrbit(ISO_PITCH, Math.PI / 4);
    app.render();
    forgeStatus('ISO 35.264\u00B0 ortho', '#4BAFD1');
  }

  // Switch tools through the GUI's own combobox (_ctrlSculpt.setValue) — the
  // same path the stock hotkeys use — so the Radius/Intensity sliders rebind
  // to the new tool and the sidebar re-highlights. Direct setToolIndex left
  // the sliders bound to the previous tool (the "brush size won't change" bug).
  function dcSetTool(app, idx) {
    var gui = app.getGui();
    for (var k in gui) {
      var o = gui[k];
      if (o && typeof o === 'object' && o._ctrlSculpt && o._ctrlSculpt.setValue) {
        o._ctrlSculpt.setValue(idx);
        return true;
      }
    }
    app.getSculptManager().setToolIndex(idx);    // fallback, shouldn't happen
    app.render();
    return false;
  }

  var LOOP_WHITE = [1.0, 1.0, 1.0];   // pure white: fixed point in the
                                       // colorspace conversion that killed teal
  function dcArmLoops(app) {
    dcSetTool(app, TOOL_PAINT);
    var tool = app.getSculptManager().getTool(TOOL_PAINT);
    tool._color[0] = LOOP_WHITE[0]; tool._color[1] = LOOP_WHITE[1]; tool._color[2] = LOOP_WHITE[2];
    if ('_intensity' in tool) tool._intensity = 1.0;
    forgeStatus('LOOPS brush — paint joint bands white', '#4BAFD1');
  }
  var dcArmMark = dcArmLoops;  // hotkey M keeps working
  function installHotkeys(app) {
    window.addEventListener('keydown', function (e) {
      if (e.handled === true || e.ctrlKey || e.altKey || e.metaKey) return;
      if (app._focusGui) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      switch (e.which) {
        case 77: dcArmMark(app); e.handled = true; break;                 // M
        case 79: isoView(app); e.handled = true; break;                   // O
        case 65: dcSetTool(app, 10); e.handled = true; break;             // A masking
        case 81: dcSetTool(app, 11); e.handled = true; break;             // Q local scale
      }
    }, false);
  }

  // postprocessGui fires inside app.start() after the GUI exists;
  // dcApp is assigned before start() in index.html, so it's ready here.
  var prev = window.postprocessGui;
  window.postprocessGui = function () {
    if (prev) prev();
    var app = window.dcApp;
    if (!app) { console.warn('[DC] dcApp missing'); return; }
    try {
      loadAlphas(app);
      installSampler(app.getPicking());
      installSampler(app.getPickingSymmetry());
      var pal = buildPalettePanel(app);
      buildForgePanel(app);
      var alphaSections = injectAlphaControls(app);
      fixDeleteSelection(app);
      installHotkeys(app);
      if (pal) makeDraggable(pal, pal.firstChild, 'dc-pos-palette');
      var fp = document.getElementById('dc-forge');
      if (fp) makeDraggable(fp, fp.children[1], 'dc-pos-forge');
      var op = buildObjectsPanel(app);
      makeDraggable(op, op.firstChild, 'dc-pos-objects');
      applyWorldDefaults(app);
      dcPbrOnArrival(app);
      console.log('[DC] hotkeys: M mark, O iso, A masking, Q localscale ' +
                  '(stock: 1-9/0 tools, E transform, X/C radius/intensity, ' +
                  'N negative, S picker, Del delete, F/T/L views, Space reset)');
      console.log('[DC] alpha controls docked in Common (' + alphaSections + ')');
      console.log('[DC] addon v3.11 active: ' + ALPHAS.length + ' alphas, sampler installed, ' +
                  PALETTE.length + ' swatches, forge panel up');
    } catch (e) {
      console.error('[DC] addon failed:', e);
    }
  };
})();
