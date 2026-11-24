/*
 * effects.js — 眼疾效果（白內障、青光眼、黃斑部病變、色覺異常）
 *
 * 對應世界觀「眼睛被免疫系統發現時會被攻擊」：每解鎖一個異常，網站多一種輕微症狀。
 * 瀏覽器：window.EyeEffects.apply([{ type, strength }])，並在載入時依進度自動套用。
 *         全站每一頁都載入，包含研究單位網站與教團網站：效果一旦出現，就疊在所有畫面上，直到通關結局。
 *         疊加層的樣式也寫在這支檔案裡（下面的 CSS），頁面不需要另外載入樣式。
 *         因為每一頁都有這支檔案，「解鎖新題目」和「多一種效果」的右下角提示也放在這裡（announceUnlocks）。
 * Node：module.exports 提供色盲模擬矩陣、紅綠與藍黃方向與矩陣計算，給 tests/check.js 與 js/plate.js 用。
 */
(function (root) {
  'use strict';

  // 綠色盲（deuteranopia）模擬矩陣：Machado、Oliveira、Fernandes（2009），嚴重度 1.0，線性 RGB。
  // SVG 的 feColorMatrix 預設就在線性 RGB 計算，可以直接使用。
  var DEUTAN = [
    0.367322, 0.860646, -0.227968,
    0.280085, 0.672501, 0.047413,
    -0.011820, 0.042940, 0.968881
  ];

  function applyMatrix(m, v) {
    return [0, 1, 2].map(function (r) { return m[r * 3] * v[0] + m[r * 3 + 1] * v[1] + m[r * 3 + 2] * v[2]; });
  }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function unit(v) { var l = Math.hypot(v[0], v[1], v[2]); return v.map(function (x) { return x / l; }); }

  // 3×3 矩陣的零空間方向：前兩列的外積（色盲模擬矩陣的秩是 2）
  function nullVector(m) { return unit(cross([m[0], m[1], m[2]], [m[3], m[4], m[5]])); }

  // 紅綠混淆方向：沿這個方向改變的顏色，綠色盲看起來完全一樣
  var N = nullVector(DEUTAN);
  // 線性 RGB 的亮度權重（Rec. 709）
  var LUMA = [0.2126, 0.7152, 0.0722];
  // 藍黃方向：同時垂直於紅綠混淆方向與亮度，所以沿它改變不影響亮度，綠色盲卻看得出差異
  var BY = unit(cross(N, LUMA));
  if (BY[2] < 0) BY = BY.map(function (x) { return -x; });

  function multiply(a, b) {
    var out = [];
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) out.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]);
    }
    return out;
  }

  // 色覺異常濾鏡的 3×3 矩陣。strength 0~1：在原色與完全綠色盲之間內插。
  // boost ≥ 1：模擬之後再把藍黃方向的差異放大 boost 倍（1＝不放大）。
  // 放大用斜投影：只拉長藍黃方向，灰階軸 (1,1,1) 不動，所以黑白灰不會被染色。
  function colorblindMatrix(strength, boost) {
    var s = Math.min(1, Math.max(0, Number(strength) || 0));
    var base = [];
    for (var i = 0; i < 9; i++) base.push((i % 4 === 0 ? 1 : 0) * (1 - s) + DEUTAN[i] * s);
    var g = 1 + (Math.max(1, Number(boost) || 1) - 1) * s;
    if (g === 1) return base;
    var u = unit(applyMatrix(DEUTAN, BY));
    var mean = (u[0] + u[1] + u[2]) / 3;
    var p = u.map(function (x) { return x - mean; });
    var pu = dot(p, u);
    p = p.map(function (x) { return x / pu; });
    var G = [];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) G.push((r === c ? 1 : 0) + (g - 1) * u[r] * p[c]);
    return multiply(G, base);
  }

  // 回傳 feColorMatrix 的 values 字串
  function matrixValues(strength, boost) {
    var m = colorblindMatrix(strength, boost);
    var v = [];
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) v.push(m[r * 3 + c].toFixed(5));
      v.push('0', '0');
    }
    v.push('0', '0', '0', '1', '0');
    return v.join(' ');
  }

  var api = {
    DEUTAN: DEUTAN,
    N: N,
    BY: BY,
    LUMA: LUMA,
    applyMatrix: applyMatrix,
    nullVector: nullVector,
    colorblindMatrix: colorblindMatrix,
    matrixValues: matrixValues
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }

  var doc = root.document;
  // 測驗頁的網址：這支檔案在 js/ 底下，測驗頁在它的上一層。研究單位和教團的頁面在子資料夾，不能寫死
  var quizUrl = doc.currentScript ? new URL('../quiz.html', doc.currentScript.src).href : 'quiz.html';

  var CSS = `
/* ---- 眼疾效果（js/effects.js）。強度由 --s（0~1）控制，所有疊加層都不攔截點擊 ---- */
.eye-fx, .eye-fx * { pointer-events: none; }
.eye-fx-defs { position: absolute; width: 0; height: 0; overflow: hidden; }
.eye-fx-cataract, .eye-fx-glaucoma { position: fixed; inset: 0; z-index: 2147483000; }
/* 白內障：一層偏暖的白霧，用 screen 混合讓畫面變亮、對比下降（泛黃在 effects.js 的 body 濾鏡） */
.eye-fx-cataract { background: #fff6e0; mix-blend-mode: screen; opacity: calc(.22 * var(--s, 1)); }
/* 青光眼：中央清楚，越往外越暗、越糊 */
.eye-fx-glaucoma {
  background: radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(20, 24, 28, calc(.3 * var(--s, 1))) 100%);
  -webkit-backdrop-filter: blur(calc(1.5px * var(--s, 1)));
  backdrop-filter: blur(calc(1.5px * var(--s, 1)));
  -webkit-mask-image: radial-gradient(ellipse 75% 70% at 50% 50%, transparent 50%, #000 95%);
  mask-image: radial-gradient(ellipse 75% 70% at 50% 50%, transparent 50%, #000 95%);
}
/* 黃斑部病變：游標附近一小塊淡淡的模糊（游標通常就是玩家正在看的地方） */
.eye-fx-macular {
  position: fixed; left: -45px; top: -45px; z-index: 2147483000;
  width: 90px; height: 90px; border-radius: 50%; visibility: hidden;
  background: rgba(60, 50, 40, calc(.06 * var(--s, 1)));
  -webkit-backdrop-filter: blur(calc(1.6px * var(--s, 1)));
  backdrop-filter: blur(calc(1.6px * var(--s, 1)));
  -webkit-mask-image: radial-gradient(circle, #000 35%, transparent 70%);
  mask-image: radial-gradient(circle, #000 35%, transparent 70%);
}
`;
  var NS = 'http://www.w3.org/2000/svg';
  var layerRoot = null;
  var cbMatrix = null;
  var layers = {};
  var macular = null;

  // 疊加層直接掛在 <html> 底下、<body> 外面：body 上的濾鏡才不會影響它們，position: fixed 也才正常
  function ensureRoot() {
    if (layerRoot) return;
    var style = doc.createElement('style');
    style.textContent = CSS;
    doc.head.appendChild(style);
    layerRoot = doc.createElement('div');
    layerRoot.className = 'eye-fx';
    layerRoot.setAttribute('aria-hidden', 'true');
    var svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'eye-fx-defs');
    var filter = doc.createElementNS(NS, 'filter');
    filter.setAttribute('id', 'eye-fx-colorblind');
    cbMatrix = doc.createElementNS(NS, 'feColorMatrix');
    cbMatrix.setAttribute('type', 'matrix');
    filter.appendChild(cbMatrix);
    svg.appendChild(filter);
    layerRoot.appendChild(svg);
    doc.documentElement.appendChild(layerRoot);
  }

  // strength > 0 就建立（或更新）該效果的疊加層，否則移除。回傳疊加層或 null
  function setLayer(type, strength) {
    if (!strength) {
      if (layers[type]) { layers[type].remove(); delete layers[type]; }
      return null;
    }
    if (!layers[type]) {
      layers[type] = doc.createElement('div');
      layers[type].className = 'eye-fx-' + type;
      layerRoot.appendChild(layers[type]);
    }
    layers[type].style.setProperty('--s', String(strength));
    return layers[type];
  }

  function moveMacular(e) {
    macular.style.transform = 'translate(' + e.clientX + 'px, ' + e.clientY + 'px)';
    macular.style.visibility = 'visible';
  }

  // options.colorblindBoost：色覺異常時藍黃對比放大倍數（content.js 的 effects.colorblindBoost）
  function apply(list, options) {
    ensureRoot();
    var by = {};
    (list || []).forEach(function (e) { if (e && e.strength > 0) by[e.type] = Math.min(1, e.strength); });

    // 套在 body 上的濾鏡：色覺異常，以及白內障的泛黃與對比下降
    var parts = [];
    if (by.colorblind) {
      cbMatrix.setAttribute('values', matrixValues(by.colorblind, options && options.colorblindBoost));
      parts.push('url(#eye-fx-colorblind)');
    }
    if (by.cataract) parts.push('sepia(' + (0.25 * by.cataract).toFixed(3) + ') contrast(' + (1 - 0.12 * by.cataract).toFixed(3) + ')');
    doc.body.style.filter = parts.join(' ');

    setLayer('cataract', by.cataract);
    setLayer('glaucoma', by.glaucoma);
    var m = setLayer('macular', by.macular);
    if (m && m !== macular) { macular = m; root.addEventListener('pointermove', moveMacular, { passive: true }); }
    if (!m && macular) { root.removeEventListener('pointermove', moveMacular); macular = null; }
  }

  // 色覺異常的藍黃放大倍數：教團網站單獨用 colorblindBoostFellowship（暖色頁面放大太多會太黃）
  function boost() {
    var fx = root.EYE_CONTENT.effects || {};
    return doc.body && doc.body.classList.contains('fellowship') && fx.colorblindBoostFellowship ? fx.colorblindBoostFellowship : fx.colorblindBoost;
  }

  // 依目前的進度重新套用一次。剛拿到新效果時呼叫，不用等換頁
  function refresh() {
    if (!root.EyeProgress || !root.EyeProgressLib || !root.EYE_CONTENT) return;
    var p = root.EyeProgress.load();
    // 通關後點了神奇眼藥水：效果全部關掉（效果本身的解鎖紀錄不動）
    apply(p.ui.eyedrops ? [] : root.EyeProgressLib.activeEffects(p, root.EYE_CONTENT),
      { colorblindBoost: boost() });
    announceUnlocks();
  }

  // 有新解鎖的異常題：右下角跳一則提示，點了去測驗頁，按 ✕ 才會關掉。每一題只提示一次。
  // 文字在 content.js 的 quiz.ui（unlockToast）
  function announceUnlocks() {
    var T = (root.EYE_CONTENT.quiz || {}).ui || {};
    if (!T.unlockToast || !root.EyeProgress.takeNewUnlocks) return;
    var lib = root.EyeProgressLib;
    var p = root.EyeProgress.load();
    // 畫面上的提示由下往上排；關掉一則，上面的往下補
    function restack() {
      Array.prototype.forEach.call(doc.querySelectorAll('.eye-toast'), function (t, i) { t.style.bottom = (16 + i * 56) + 'px'; });
    }
    function toast(text, href, font) {
      var t = doc.createElement('div');
      t.setAttribute('role', 'status');
      t.className = 'eye-toast';
      t.style.cssText = 'position:fixed;right:16px;z-index:2147483647;display:flex;align-items:center;gap:6px;margin:0;padding:6px 8px 6px 18px;border-radius:8px;background:#1c2b33;color:#fff;font:' + font + ';box-shadow:0 6px 20px rgba(0,0,0,.35)';
      var label = doc.createElement(href ? 'a' : 'span');
      if (href) label.href = href;
      label.textContent = text;
      label.style.cssText = 'color:inherit;text-decoration:none';
      var close = doc.createElement('button');
      close.type = 'button';
      close.textContent = '✕';
      close.setAttribute('aria-label', T.closeToast || '✕');
      close.style.cssText = 'padding:2px 8px;border:0;background:transparent;color:#cfd8dc;font:16px/1 sans-serif;cursor:pointer';
      close.addEventListener('click', function () { t.remove(); restack(); });
      t.appendChild(label);
      t.appendChild(close);
      doc.documentElement.appendChild(t); // 掛在 <body> 外面，才不會被套在 body 上的濾鏡影響
      restack();
    }
    // 點了神奇眼藥水之後（通關後才有），什麼提示都不跳，照樣記成提示過了
    var quiet = !!p.ui.eyedrops;
    if (root.EyeProgress.takeNewUnlocks().length && !quiet) toast(lib.format(T.unlockToast, lib.unlockCount(p, root.EYE_CONTENT)), quizUrl, '700 15px/1.5 sans-serif');
    // 多一種眼疾效果：用英文病名，像病歷上的字（content.js 的 effects.toast、effects.names）
    var fx = root.EYE_CONTENT.effects || {};
    var fresh = fx.toast && root.EyeProgress.takeNewEffects ? root.EyeProgress.takeNewEffects() : [];
    if (quiet) fresh = [];
    var have = lib.activeEffects(p, root.EYE_CONTENT).length - fresh.length;
    fresh.forEach(function (type) {
      have += 1;
      toast(lib.format(fx.toast, { name: (fx.names || {})[type] || type, n: have, total: (fx.map || []).map(function (m) { return m.type; }).filter(function (t, i, all) { return all.indexOf(t) === i; }).length }), null, '15px/1.5 ui-monospace, Consolas, monospace');
    });
  }

  // 【測試用】清除眼疾效果的按鈕：content.js 的 effects.devClear 有填才會出現，上線前把那一行刪掉。
  // 按了會清掉所有「事件」（所以教團網站、加密文件、靠事件解鎖的異常題也會重新鎖上），其他進度不動，然後重新整理
  function devButton() {
    var label = root.EYE_CONTENT && root.EYE_CONTENT.effects && root.EYE_CONTENT.effects.devClear;
    if (!label || !root.EyeProgress) return;
    var button = doc.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2147483647;padding:4px 10px;border:2px dashed #888;border-radius:999px;background:#fff;color:#333;font:13px sans-serif;cursor:pointer';
    button.addEventListener('click', function () {
      root.EyeProgress.update(function (p) {
        p.events = [];
        p.ui.announcedFx = []; // 效果的提示也重來
        // 靠事件解鎖的異常題也鎖回去（作答和「提示過了」的紀錄會跟著丟掉），才能再觸發一次
        p.unlocked = p.unlocked.filter(function (id) { return !(root.EyeProgressLib.findQuestion(root.EYE_CONTENT, id) || {}).unlockEvent; });
      });
      root.location.reload();
    });
    doc.documentElement.appendChild(button); // 掛在 <body> 外面，才不會被套在 body 上的濾鏡影響
    devAllButton(button);
    devLockButton(button);
  }

  // 【測試用】全權限：content.js 的 effects.devAll 有填才會出現（疊在清除按鈕上面），上線前把那一行刪掉。
  // 按了拿到四種眼疾效果的事件、解鎖全部異常題（不作答）、登入研究中心，提示都記成跳過了，然後跳到教團網站的使者專區
  function devAllButton(clear) {
    var C = root.EYE_CONTENT;
    if (!C.effects.devAll) return;
    var button = clear.cloneNode(false);
    button.textContent = C.effects.devAll;
    button.style.bottom = '44px';
    button.addEventListener('click', function () {
      root.EyeProgress.update(function (p) {
        var add = function (list, x) { if (x && list.indexOf(x) === -1) list.push(x); };
        C.effects.map.forEach(function (m) { add(p.events, m.requires); add(p.ui.announcedFx, m.type); });
        C.anomalyQuestions.forEach(function (q) { add(p.events, q.unlockEvent); add(p.unlocked, q.id); add(p.ui.announced, q.id); });
        add(p.events, C.lab.search.event);
        p.lab.user = C.lab.members[0].id;
      });
      var here = root.location.pathname;
      var base = /\/(lab|fellowship)\/[^/]*$/.test(here) ? '../' : '';
      root.location.href = base + 'fellowship/index.html#zone';
      if (/\/fellowship\//.test(here)) root.location.reload();
    });
    doc.documentElement.appendChild(button);
  }

  // 【測試用】退回這一頁的解鎖：content.js 的 effects.devLock 有填才會出現（疊在最上面），上線前把那一行刪掉。
  // 只鎖回目前這一頁解開的東西，然後重新整理：
  //   研究中心 #doc-／#file-：那份文件的密碼　SEM：看見眼睛和拍到的照片　教團 #file-：那份文件的密碼、#zone：最底下的彈窗
  //   論壇上鎖文章：登出　結果頁：通關
  // 拿掉事件時，靠那個事件解鎖的異常題（連同作答）和提示紀錄也一起拿掉，才能再觸發一次
  function devLockButton(clear) {
    var C = root.EYE_CONTENT;
    if (!C.effects.devLock) return;
    var button = clear.cloneNode(false);
    button.textContent = C.effects.devLock;
    button.style.bottom = '80px';
    button.addEventListener('click', function () {
      var path = root.location.pathname;
      var hash = decodeURIComponent(root.location.hash.slice(1));
      var id = hash.replace(/^(doc|file)-/, '');
      var byId = function (list) { return (list || []).filter(function (x) { return x.id === id; })[0] || {}; };
      var events = [];
      var resetPhotos = false;
      var logoutForum = false;
      if (/\/lab\/sem\.html$/.test(path)) { events = [C.lab.sem.eye.event]; resetPhotos = true; }
      else if (/\/lab\//.test(path)) events = [(hash.indexOf('doc-') === 0 ? byId(C.lab.docs) : hash.indexOf('file-') === 0 ? byId(C.lab.files) : {}).event];
      else if (/\/fellowship\//.test(path)) events = [hash === 'zone' ? C.cult.zone.event : hash.indexOf('file-') === 0 ? byId(C.cult.files).event : null];
      else if (/forum\.html$/.test(path)) {
        var lock = byId(C.forum.posts).lock || {};
        if (lock.type === 'login') logoutForum = true; else events = [lock.event];
      } else if (/result\.html$/.test(path)) events = [C.ending.event];
      events = events.filter(Boolean);
      root.EyeProgress.update(function (p) {
        events.forEach(function (ev) {
          var qs = (C.anomalyQuestions || []).filter(function (q) { return q.unlockEvent === ev; }).map(function (q) { return q.id; });
          var fx = C.effects.map.filter(function (m) { return m.requires === ev; }).map(function (m) { return m.type; });
          p.events = p.events.filter(function (e) { return e !== ev; });
          p.unlocked = p.unlocked.filter(function (q) { return qs.indexOf(q) === -1; });
          p.ui.announced = p.ui.announced.filter(function (q) { return qs.indexOf(q) === -1; });
          p.ui.announcedFx = p.ui.announcedFx.filter(function (t) { return fx.indexOf(t) === -1; });
          qs.forEach(function (q) { delete p.answers[q]; });
        });
        if (resetPhotos) p.photos = [];
        if (logoutForum) p.forum.user = null;
      });
      root.location.reload();
    });
    doc.documentElement.appendChild(button);
  }

  api.apply = apply;
  api.refresh = refresh;
  root.EyeEffects = api;
  refresh();
  devButton();
})(this);
