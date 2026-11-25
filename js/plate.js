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
  function palette(options) {
    var o = Object.assign({ base: '#aaa290', axis: 'blueYellow', amount: 0.075, margin: 0.02 }, options || {});
    var bgBase = hexToLinear(o.base);
    var dir = o.axis === 'lightness' ? [1, 1, 1] : BY;
    var fgBase = bgBase.map(function (v, i) { return v + o.amount * dir[i]; });
    if (fgBase.some(function (v) { return v < 0 || v > 1; })) {
      throw new Error('前景底色超出色域，請調整底色或差異量');
    }
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
  var DOT_SIZES = [[10, 400], [8, 800], [6.5, 1400], [5, 2400], [4, 3500], [3, 5000], [2.2, 7000], [1.6, 8000]];
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
  function maskOf(width, draw, blur) {
    var c = document.createElement('canvas');
    c.width = width;
    c.height = width;
    var g = c.getContext('2d');
    if (blur) g.filter = 'blur(' + blur + 'px)';
    draw(g);
    return g.getImageData(0, 0, width, width).data;
  }
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
  function build(options) {
    var o = Object.assign({
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
