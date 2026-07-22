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

    function slider(label, min, max, val, oninput) {
      var wrap = document.createElement('label');
      wrap.style.cssText = 'display:flex;align-items:center;gap:4px;color:#9ab;';
      wrap.textContent = label;
      var s = document.createElement('input');
      s.type = 'range'; s.min = min; s.max = max; s.step = 0.05; s.value = val;
      s.style.width = '64px';
      var out = document.createElement('span');
      out.textContent = Number(val).toFixed(2);
      out.style.cssText = 'width:30px;color:#cbd;';
      s.oninput = function () { out.textContent = Number(s.value).toFixed(2); oninput(parseFloat(s.value)); };
      wrap.appendChild(s); wrap.appendChild(out);
      return wrap;
    }
    var row2 = document.createElement('div');
    row2.style.cssText = 'display:flex;gap:8px;align-items:center;margin-left:6px;' +
      'padding-left:8px;border-left:1px solid #333;';
    row2.appendChild(slider('A-Scl', 0.25, 4, 1, function (v) { dcAlpha.scale = v; }));
    row2.appendChild(slider('A-Int', 0, 2, 1, function (v) { dcAlpha.intensity = v; }));
    var tl = document.createElement('label');
    tl.style.cssText = 'display:flex;align-items:center;gap:3px;color:#9ab;cursor:pointer;';
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.onchange = function () { dcAlpha.tile = cb.checked; };
    tl.appendChild(cb); tl.appendChild(document.createTextNode('TILE'));
    row2.appendChild(tl);
    panel.appendChild(row2);
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
  // Mesh PLY + a job manifest download; drop BOTH into a Claude chat and
  // say "run it" — the processed PLY comes back, load it via File > Add.
  function packageJob(op, params, plyBuf) {
    var stamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadBlob(new Blob([plyBuf]), 'dc_' + op + '_' + stamp + '.ply');
    downloadBlob(new Blob([JSON.stringify({
      op: op, params: params, file: 'dc_' + op + '_' + stamp + '.ply',
      note: 'DC FORGE JOB - upload this manifest + the .ply to Claude and say: run it'
    }, null, 2)], { type: 'application/json' }), 'dc_' + op + '_' + stamp + '.json');
    forgeStatus('job saved — send both files to Claude', '#4BAFD1');
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

    function poll() {
      fetch(DAEMON + '/health').then(function (r) { return r.json(); })
        .then(function (j) { dot.style.background = j.ok ? '#4BAFD1' : '#c96'; })
        .catch(function () { dot.style.background = '#666'; });
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
    panel.appendChild(btn('RINGS', 'cyan marks → edge rings', function () {
      forgeSend(app, 'rings', { rings: ringsSel.value });
    }));
    panel.appendChild(ringsSel);

    var resSel = sel(['512', '1024', '2048'], '1024');
    panel.appendChild(btn('BAKE', 'UV + albedo/AO → zip download', function () {
      forgeSend(app, 'bake', { res: resSel.value, ao: 1, name: 'dc_asset' });
    }));
    panel.appendChild(resSel);

    panel.appendChild(btn('MARK', 'RETOPO MARK — paint tool, exact cyan', function () {
      var sm = app.getSculptManager();
      sm.setToolIndex(TOOL_PAINT);            // GUI sidebar won't re-highlight
      var tool = sm.getTool(TOOL_PAINT);
      tool._color[0] = CYAN[0]; tool._color[1] = CYAN[1]; tool._color[2] = CYAN[2];
      forgeStatus('MARK armed — paint joints cyan', '#4BAFD1');
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
      buildPalettePanel(app);
      buildForgePanel(app);
      console.log('[DC] addon v3 active: ' + ALPHAS.length + ' alphas, sampler installed, ' +
                  PALETTE.length + ' swatches, forge panel up');
    } catch (e) {
      console.error('[DC] addon failed:', e);
    }
  };
})();
