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
    ['resources/dc/alpha_scar_tear.png',      'DC Scar Tear']
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
      buildPalettePanel(app);
      console.log('[DC] addon active: ' + ALPHAS.length + ' alphas, ' +
                  PALETTE.length + ' swatches');
    } catch (e) {
      console.error('[DC] addon failed:', e);
    }
  };
})();
