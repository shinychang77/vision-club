(function (root) {
  'use strict';
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function grainPixels(width, height, seed, cell) {
    var rand = rng(seed);
    var cols = Math.ceil(width / cell) + 2;
    var rows = Math.ceil(height / cell) + 2;
    var px = new Float32Array(cols * rows);
    var py = new Float32Array(cols * rows);
    var tone = new Float32Array(cols * rows);
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var k = j * cols + i;
        px[k] = (i - 1 + rand()) * cell;
        py[k] = (j - 1 + rand()) * cell;
        tone[k] = 70 + rand() * 120;
      }
    }
    var out = new Uint8ClampedArray(width * height * 4);
    for (var y = 0; y < height; y++) {
      var gj = Math.floor(y / cell) + 1;
      for (var x = 0; x < width; x++) {
        var gi = Math.floor(x / cell) + 1;
        var d1 = Infinity;
        var d2 = Infinity;
        var best = 0;
        for (var dj = -1; dj <= 1; dj++) {
          for (var di = -1; di <= 1; di++) {
            var n = (gj + dj) * cols + (gi + di);
            var dx = px[n] - x;
            var dy = py[n] - y;
            var d = dx * dx + dy * dy;
            if (d < d1) { d2 = d1; d1 = d; best = n; } else if (d < d2) { d2 = d; }
          }
        }
        var edge = Math.sqrt(d2) - Math.sqrt(d1);
        var v = tone[best] - (edge < 2 ? (2 - edge) * 45 : 0) + (rand() - 0.5) * 18;
        var o = (y * width + x) * 4;
        out[o] = v;
        out[o + 1] = v;
        out[o + 2] = v;
        out[o + 3] = 255;
      }
    }
    return out;
  }
  var ASPECT = 4 / 3;
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function scaleAt(t, cfg) { return Math.pow(cfg.maxScale, clamp(t, 0, 1)); }
  function magAt(t, cfg) { return cfg.magMin * Math.pow(cfg.magMax / cfg.magMin, clamp(t, 0, 1)); }
  function tForMag(mag, cfg) { return clamp(Math.log(mag / cfg.magMin) / Math.log(cfg.magMax / cfg.magMin), 0, 1); }
  function clampCenter(cx, cy, scale) {
    var half = 0.5 / scale;
    return { cx: clamp(cx, half, 1 - half), cy: clamp(cy, half, 1 - half) };
  }
  function clueAt(cx, cy, clues) {
    for (var i = 0; i < clues.length; i++) {
      var c = clues[i];
      if (Math.abs(cx - c.x) <= c.size / 2 && Math.abs(cy - c.y) <= c.size * ASPECT / 2) return c;
    }
    return null;
  }
  function revealOpacity(clue, scale) { return clamp((clue.size * scale - 0.3) / 0.3, 0, 1); }
  function focusTarget(state, cfg) {
    var clue = clueAt(state.cx, state.cy, cfg.clues);
    return clue && revealOpacity(clue, scaleAt(state.t, cfg)) >= 0.5 ? clue.focus : cfg.surfaceFocus;
  }
  function blurPx(state, cfg) {
    return Math.min(cfg.maxBlur, Math.abs(state.focus - focusTarget(state, cfg)) * cfg.blurPerUnit);
  }
  function captureCheck(state, cfg) {
    var clue = clueAt(state.cx, state.cy, cfg.clues);
    if (!clue) return { ok: false, reason: 'noRegion' };
    if (magAt(state.t, cfg) < clue.minMag) return { ok: false, reason: 'lowMag' };
    if (Math.abs(state.focus - clue.focus) > cfg.focusTolerance) return { ok: false, reason: 'blurry' };
    return { ok: true, clue: clue };
  }
  function scaleBar(mag) { return barFor(127000 / mag); }
  function barFor(fieldUm) {
    var target = fieldUm / 5;
    var p = Math.pow(10, Math.floor(Math.log10(target)));
    var um = p;
    [1, 2, 5].forEach(function (n) { if (n * p <= target) um = n * p; });
    var unit = [[1e9, ' km'], [1e6, ' m'], [1e3, ' mm'], [1, ' µm']].filter(function (u) { return um >= u[0]; })[0] || [1, ' µm'];
    return { um: um, fraction: um / fieldUm, label: Math.round(um / unit[0] * 1000) / 1000 + unit[1] };
  }
  function eyeField(out, cfg) {
    var start = 127000 / cfg.magMin;
    return start * Math.pow(cfg.eye.fieldKm * 1e9 / start, clamp(out, 0, 1));
  }
  function formatMag(mag) { return '×' + Math.round(mag).toLocaleString('en-US'); }
  function workingDistance(focus) { return (13.2 + focus * 0.1).toFixed(1) + ' mm'; }
  var lib = {
    ASPECT: ASPECT,
    rng: rng,
    grainPixels: grainPixels,
    scaleAt: scaleAt,
    magAt: magAt,
    tForMag: tForMag,
    clampCenter: clampCenter,
    clueAt: clueAt,
    revealOpacity: revealOpacity,
    focusTarget: focusTarget,
    blurPx: blurPx,
    captureCheck: captureCheck,
    scaleBar: scaleBar,
    barFor: barFor,
    eyeField: eyeField,
    formatMag: formatMag,
    workingDistance: workingDistance
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = lib;
  else root.EyeSem = lib;
})(this);
