/*
 * plate.js — 反向色盲圖：正常視覺看到的是一片彩色圓點（或一個假數字），
 *            套用色覺異常效果（或真正的綠色盲）時，藏著的數字才浮現。
 *
 * 做法參考 Craig S. Kaplan〈Dichromatic Steganography〉(Bridges 2023) 的「隱藏圖」與「轉換圖」：
 *   1. 前景（藏的數字）與背景各有一個底色，兩者只差一點點，可以是藍黃方向（亮度不變）或明暗方向。
 *   2. 每個底色沿紅綠混淆方向拉成一條線段，拉到色域邊緣為止。線段上的顏色對綠色盲完全相同。
 *   3. 每個圓點只取所屬線段的其中一端：正常視覺看到強烈的紅綠跳動，綠色盲只看得到兩種顏色。
 *   4. 取哪一端由「干擾圖形」決定：假數字或弧線區域取偏紅的一端，其他取偏綠的一端（再加一點隨機翻轉），
 *      正常視覺會被這個醒目的圖形吸走注意力；干擾圖形在色盲模擬下完全消失。
 *   5. 圓點大小不一、隨機擠滿，縫隙填背景底色，避免白縫沖淡色盲模擬下的差異。
 * 這種圖不可能做到完美隱藏：綠色盲分得出的兩個顏色，正常人一定也分得出，只能用干擾去掩蓋。
 * 參數請用 dev/plate-lab.html 搭配六種預覽與盲測調整。
 *
 * 瀏覽器：window.EyePlate.build(options) 回傳圓點資料；EyePlate.render(svg, options) 畫進 svg。
 *         必須在 js/effects.js 之後載入。
 * Node：module.exports 提供顏色與排列計算，給 tests/check.js 測。
 */
(function (root) {
  'use strict';
  var isNode = typeof module !== 'undefined' && module.exports;
  var E = isNode ? require('./effects.js') : root.EyeEffects;
  var DEUTAN = E.DEUTAN;
  var N = E.N;
  var BY = E.BY;
  var LUMA = E.LUMA;
  var applyMatrix = E.applyMatrix;

  function hexToRgb(hex) {
    var h = String(hex).replace('#', '');
    return [0, 2, 4].map(function (i) { return parseInt(h.slice(i, i + 2), 16); });
  }
  function toLinear(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function toSrgb(v) {
    v = Math.min(1, Math.max(0, v));
    return Math.round((v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255);
  }
  function hexToLinear(hex) { return hexToRgb(hex).map(toLinear); }
  function linearToHex(lin) {
    return '#' + lin.map(function (v) { return ('0' + toSrgb(v).toString(16)).slice(-2); }).join('');
  }
  function luminance(lin) { return LUMA[0] * lin[0] + LUMA[1] * lin[1] + LUMA[2] * lin[2]; }

  // 底色沿紅綠混淆方向往兩邊最多能走多遠還留在色域內：回傳 [tLo, tHi]，tLo ≤ 0 ≤ tHi（兩邊可以不對稱）
  function segment(lin) {
    var lo = -Infinity;
    var hi = Infinity;
    for (var i = 0; i < 3; i++) {
      if (Math.abs(N[i]) < 1e-12) continue;
      var a = -lin[i] / N[i];
      var b = (1 - lin[i]) / N[i];
      lo = Math.max(lo, Math.min(a, b));
      hi = Math.min(hi, Math.max(a, b));
    }
    return [lo, hi];
  }

  // 調色盤。base 是背景底色；前景底色＝背景沿 axis 移動 amount（線性 RGB）。
  //   axis 'blueYellow'：藍黃方向，亮度不變（amount 正＝偏藍）　'lightness'：明暗方向（amount 負＝較暗）
  //   margin：線段兩端往內縮的比例，避免四捨五入後超出色域
  // 回傳 { fgBase, bgBase, fg: [偏綠端, 偏紅端], bg: [偏綠端, 偏紅端] }，都是線性 RGB
  function palette(options) {
    var o = Object.assign({ base: '#aaa290', axis: 'blueYellow', amount: 0.075, margin: 0.02 }, options || {});
    var bgBase = hexToLinear(o.base);
    var dir = o.axis === 'lightness' ? [1, 1, 1] : BY;
    var fgBase = bgBase.map(function (v, i) { return v + o.amount * dir[i]; });
    if (fgBase.some(function (v) { return v < 0 || v > 1; })) {
      throw new Error('前景底色超出色域，請調整底色或差異量');
    }
    // 前景與背景共用同一段範圍（兩條線段範圍的交集）：對應的兩端位移相同，
    // 藍黃方向時兩端就各自等亮，數字不會從亮度洩漏
    var sf = segment(fgBase);
    var sb = segment(bgBase);
    var k = 1 - o.margin;
    var green = Math.max(sf[0], sb[0]) * k;
    var red = Math.min(sf[1], sb[1]) * k;
    if (N[0] < 0) { var t = green; green = red; red = t; }
    function ends(b) {
      return [b.map(function (v, i) { return v + green * N[i]; }), b.map(function (v, i) { return v + red * N[i]; })];
    }
    return { fgBase: fgBase, bgBase: bgBase, fg: ends(fgBase), bg: ends(bgBase) };
  }

  // 可重現的亂數（mulberry32，和 lab/sem-core.js 同一個演算法；plate.js 是主站綁瀏覽器與眼疾效果的輔助檔，不該引入研究單位的 SEM 模組；這十行演算法複製一份比拉共用檔簡單）
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

  // 圓點大小與嘗試次數：大的先放，小的填縫（邊長 360 的圓盤）
  var DOT_SIZES = [[10, 400], [8, 800], [6.5, 1400], [5, 2400], [4, 3500], [3, 5000], [2.2, 7000], [1.6, 8000]];

  // 大小不一的圓隨機擠進直徑 width 的圓盤，彼此至少相隔 gap。回傳 [{ x, y, r }]
  function packCircles(width, rand, sizes, gap) {
    var R = width / 2 - 2;
    var cell = 8;
    var maxR = Math.max.apply(null, sizes.map(function (s) { return s[0]; }));
    var grid = {};
    var out = [];
    sizes.forEach(function (size) {
      var r = size[0];
      for (var n = 0; n < size[1]; n++) {
        var x = rand() * width;
        var y = rand() * width;
        if (Math.hypot(x - width / 2, y - width / 2) > R - r) continue;
        var gi = Math.floor(x / cell);
        var gj = Math.floor(y / cell);
        var span = Math.ceil((r + maxR + gap) / cell);
        var ok = true;
        for (var i = gi - span; i <= gi + span && ok; i++) {
          for (var j = gj - span; j <= gj + span && ok; j++) {
            var list = grid[i + ',' + j];
            if (!list) continue;
            for (var k = 0; k < list.length; k++) {
              var c = list[k];
              if (Math.hypot(c.x - x, c.y - y) < c.r + r + gap) { ok = false; break; }
            }
          }
        }
        if (!ok) continue;
        var dot = { x: x, y: y, r: r };
        out.push(dot);
        var key = gi + ',' + gj;
        (grid[key] = grid[key] || []).push(dot);
      }
    });
    return out;
  }

  // ---- 以下只在瀏覽器使用（需要 canvas 畫遮罩） ----

  function maskOf(width, draw, blur) {
    var c = document.createElement('canvas');
    c.width = width;
    c.height = width;
    var g = c.getContext('2d');
    if (blur) g.filter = 'blur(' + blur + 'px)';
    draw(g);
    return g.getImageData(0, 0, width, width).data;
  }

  // 數字遮罩。字重、描邊太粗會把 8/9、5/6 中間的缺口填掉，變得分不出來
  function drawDigit(g, text, width, o) {
    g.font = o.fontWeight + ' ' + o.fontSize + 'px ' + o.fontFamily;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    var y = width / 2 + o.fontSize * 0.05;
    if (o.stroke > 0) {
      g.lineWidth = o.fontSize * o.stroke;
      g.lineJoin = 'round';
      g.strokeText(text, width / 2, y);
    }
    g.fillText(text, width / 2, y);
  }

  function drawArcs(g, w) {
    g.strokeStyle = '#000';
    g.lineCap = 'round';
    g.lineWidth = w * 0.14;
    g.beginPath(); g.arc(w * 0.26, w * 0.30, w * 0.22, 0.2, 4.2); g.stroke();
    g.beginPath(); g.arc(w * 0.74, w * 0.72, w * 0.24, 3.4, 7.6); g.stroke();
    g.lineWidth = w * 0.12;
    g.beginPath(); g.moveTo(w * 0.10, w * 0.80); g.quadraticCurveTo(w * 0.5, w * 0.40, w * 0.92, w * 0.20); g.stroke();
  }

  // 計算整張圖的圓點。options：
  //   text 藏的數字　decoy 干擾：'digit' 假數字、'arcs' 弧線、'none' 不干擾　decoyText 假數字的內容
  //   base／axis／amount 見 palette()　flip 干擾圖形內外隨機翻轉的比例（0~0.5，越大越雜亂）
  //   soft 藏的數字邊緣模糊的像素（邊緣變成機率性的，減少銳利邊界）　gapFill 縫隙填背景底色
  //   width 邊長　fontSize 字級　fontWeight 字重（400／700／900）　stroke 描邊粗細（相對字級，0＝不描邊）
  //   fontFamily 字型　dotScale 圓點大小倍率（越小，數字的缺口越不會被大圓點蓋過）　seed 亂數種子
  // 回傳 { width, gap: 縫隙顏色或 null, gapLin, dots: [{ x, y, r, fill, lin, hidden, red: 取偏紅端, decoy }] }
  function build(options) {
    var o = Object.assign({
      // 預設值是作者 2026-11-11 在 dev/plate-lab.html 調定的（搭配 content.js 的 effects.colorblindBoost: 2.5）
      text: '7', decoy: 'digit', decoyText: '2', base: '#aaa290', axis: 'blueYellow', amount: 0.075,
      flip: 0.18, soft: 0.5, gapFill: false, width: 360, fontSize: 255, fontWeight: 700, stroke: 0,
      fontFamily: 'Arial, Helvetica, sans-serif', dotScale: 0.85, seed: 1
    }, options || {});
    var w = o.width;
    var pal = palette(o);
    var rand = rng(o.seed);
    var hidden = maskOf(w, function (g) { drawDigit(g, o.text, w, o); }, o.soft);
    var decoy = o.decoy === 'none' ? null : maskOf(w, function (g) {
      if (o.decoy === 'digit') drawDigit(g, o.decoyText, w, o);
      else drawArcs(g, w);
    });
    // 縮小圓點時多試幾次，才擠得滿
    var sizes = DOT_SIZES.map(function (s) { return [s[0] * o.dotScale, Math.round(s[1] / (o.dotScale * o.dotScale))]; });
    var dots = packCircles(w, rand, sizes, 0.6).map(function (d) {
      var idx = (Math.min(w - 1, Math.round(d.y)) * w + Math.min(w - 1, Math.round(d.x))) * 4 + 3;
      var isHidden = rand() < hidden[idx] / 255;
      var inDecoy = decoy ? decoy[idx] > 128 : rand() < 0.5;
      var red = decoy ? (inDecoy !== (rand() < o.flip)) : inDecoy;
      var lin = (isHidden ? pal.fg : pal.bg)[red ? 1 : 0];
      return { x: d.x, y: d.y, r: d.r, lin: lin, fill: linearToHex(lin), hidden: isHidden, red: red, decoy: !!(decoy && inDecoy) };
    });
    return { width: w, gap: o.gapFill ? linearToHex(pal.bgBase) : null, gapLin: pal.bgBase, dots: dots };
  }

  function render(svg, options) {
    var plate = build(options);
    var w = plate.width;
    var NS = 'http://www.w3.org/2000/svg';
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + w);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (plate.gap) {
      var bg = document.createElementNS(NS, 'circle');
      bg.setAttribute('cx', w / 2);
      bg.setAttribute('cy', w / 2);
      bg.setAttribute('r', w / 2 - 2);
      bg.setAttribute('fill', plate.gap);
      svg.appendChild(bg);
    }
    plate.dots.forEach(function (d) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', d.x.toFixed(1));
      c.setAttribute('cy', d.y.toFixed(1));
      c.setAttribute('r', d.r.toFixed(1));
      c.setAttribute('fill', d.fill);
      svg.appendChild(c);
    });
    return plate;
  }

  var api = {
    DEUTAN: DEUTAN,
    N: N,
    BY: BY,
    DOT_SIZES: DOT_SIZES,
    hexToRgb: hexToRgb,
    hexToLinear: hexToLinear,
    linearToHex: linearToHex,
    luminance: luminance,
    applyMatrix: applyMatrix,
    nullVector: E.nullVector,
    segment: segment,
    palette: palette,
    rng: rng,
    packCircles: packCircles,
    build: build,
    render: render
  };

  if (isNode) module.exports = api;
  else root.EyePlate = api;
})(this);
