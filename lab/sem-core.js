/*
 * sem-core.js — 模擬 SEM 的純計算（不碰畫面）
 *
 * 瀏覽器：window.EyeSem
 * Node：module.exports，給 tests/check.js 測
 */
(function (root) {
  'use strict';

  // 可重現的亂數（mulberry32）：同一個 seed 每次產生同樣的樣品表面
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

  // 模擬多晶材料的 SEM 影像：每顆晶粒一個灰階，晶界較暗，再加一點雜訊。
  // cell 是晶粒的大約尺寸（像素）。回傳 RGBA 像素陣列，可直接做成 canvas 的 ImageData。
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
        var edge = Math.sqrt(d2) - Math.sqrt(d1); // 越小越靠近晶界
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

  var ASPECT = 4 / 3; // 樣品與畫面都是 4:3

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  // t：倍率滑桿位置 0~1。畫面縮放與顯示倍率都隨 t 指數增加，每一格放大的感覺一致
  function scaleAt(t, cfg) { return Math.pow(cfg.maxScale, clamp(t, 0, 1)); }
  function magAt(t, cfg) { return cfg.magMin * Math.pow(cfg.magMax / cfg.magMin, clamp(t, 0, 1)); }
  function tForMag(mag, cfg) { return clamp(Math.log(mag / cfg.magMin) / Math.log(cfg.magMax / cfg.magMin), 0, 1); }

  // 畫面中心（樣品座標 0~1）不能移到樣品外面
  function clampCenter(cx, cy, scale) {
    var half = 0.5 / scale;
    return { cx: clamp(cx, half, 1 - half), cy: clamp(cy, half, 1 - half) };
  }

  // size 是相對樣品寬度；樣品高度只有寬度的 3/4，所以換成高度方向要乘 4/3
  function clueAt(cx, cy, clues) {
    for (var i = 0; i < clues.length; i++) {
      var c = clues[i];
      if (Math.abs(cx - c.x) <= c.size / 2 && Math.abs(cy - c.y) <= c.size * ASPECT / 2) return c;
    }
    return null;
  }

  // 照片在畫面上佔畫面寬度的比例 = size × scale。佔 30% 開始淡入，佔 60% 完全顯示
  function revealOpacity(clue, scale) { return clamp((clue.size * scale - 0.3) / 0.3, 0, 1); }

  // 該對準哪個對焦值：畫面中心在已浮現一半以上的照片上就用照片的，否則用樣品表面的
  function focusTarget(state, cfg) {
    var clue = clueAt(state.cx, state.cy, cfg.clues);
    return clue && revealOpacity(clue, scaleAt(state.t, cfg)) >= 0.5 ? clue.focus : cfg.surfaceFocus;
  }

  // 對焦偏差換成畫面模糊（螢幕像素），最多 maxBlur
  function blurPx(state, cfg) {
    return Math.min(cfg.maxBlur, Math.abs(state.focus - focusTarget(state, cfg)) * cfg.blurPerUnit);
  }

  // 擷取影像判定，依序檢查：畫面中心在標記區域內 → 倍率夠 → 對焦夠準
  function captureCheck(state, cfg) {
    var clue = clueAt(state.cx, state.cy, cfg.clues);
    if (!clue) return { ok: false, reason: 'noRegion' };
    if (magAt(state.t, cfg) < clue.minMag) return { ok: false, reason: 'lowMag' };
    if (Math.abs(state.focus - clue.focus) > cfg.focusTolerance) return { ok: false, reason: 'blurry' };
    return { ok: true, clue: clue };
  }

  // 比例尺：SEM 習慣以 127 mm 寬的畫面定義倍率，所以畫面實際寬度 = 127 mm ÷ 倍率。
  // 取不超過畫面寬度五分之一的 1、2、5 整數倍
  function scaleBar(mag) { return barFor(127000 / mag); }

  // fieldUm：畫面實際寬度（µm）。單位隨大小換：µm、mm、m、km
  function barFor(fieldUm) {
    var target = fieldUm / 5;
    var p = Math.pow(10, Math.floor(Math.log10(target)));
    var um = p;
    [1, 2, 5].forEach(function (n) { if (n * p <= target) um = n * p; });
    var unit = [[1e9, ' km'], [1e6, ' m'], [1e3, ' mm'], [1, ' µm']].filter(function (u) { return um >= u[0]; })[0] || [1, ' µm'];
    return { um: um, fraction: um / fieldUm, label: Math.round(um / unit[0] * 1000) / 1000 + unit[1] };
  }

  // 「縮到最小之後還能再縮」：out 0~1，畫面寬度從最低倍率的寬度指數放大到 eye.fieldKm 公里
  function eyeField(out, cfg) {
    var start = 127000 / cfg.magMin;
    return start * Math.pow(cfg.eye.fieldKm * 1e9 / start, clamp(out, 0, 1));
  }

  function formatMag(mag) { return '×' + Math.round(mag).toLocaleString('en-US'); }

  // 真的 SEM 對焦就是在調工作距離，所以資料列的 WD 跟著對焦值變
  // 對焦值 82 剛好是 21.4 mm，和研究筆記那三張照片資訊列上的 WD 一樣
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
