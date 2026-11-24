// 模擬 SEM 介面：移動、放大、對焦、擷取影像。計算都在 sem-core.js，這裡只處理畫面與操作。
// 內容與數值見 content.js 的 lab.sem
(function () {
  'use strict';
  const C = window.EYE_CONTENT;
  const P = window.EyeProgress;
  const S = window.EyeSem;
  const view = document.getElementById('sem-view');
  if (!C || !C.lab || !P || !S || !view || !window.EyeDom) return;
  const { el } = window.EyeDom;
  const L = C.lab;
  const cfg = L.sem;
  const T = cfg.texts;
  const optics = document.getElementById('sem-optics');
  const stage = document.getElementById('sem-stage');
  const scan = document.getElementById('sem-scan');
  const databar = document.getElementById('sem-databar');
  const panel = document.getElementById('sem-panel');

  document.title = `${cfg.title}｜${L.unitName}`;
  document.getElementById('lab-name').textContent = L.unitName;
  document.getElementById('lab-back').textContent = L.backToMain;
  document.getElementById('sem-staff').textContent = L.login.toStaff;
  document.getElementById('sem-title').textContent = cfg.title;
  view.style.setProperty('--scan-ms', cfg.scanMs + 'ms');

  // 遠端影像系統只給登入的成員用（姓名＋工號，見 lab/lab.js）
  if (!P.load().lab.user) {
    document.querySelector('.sem-layout').replaceChildren(el('p', { class: 'sem-denied' }, [
      L.login.needLogin + ' ', el('a', { href: 'index.html#staff', text: L.login.toStaff })
    ]));
    return;
  }

  // ---- 研究筆記：放在儀器左邊，對照著操作（content.js 的 lab.notes）----
  const N = L.notes;
  const lib = window.EyeProgressLib;
  const who = L.members.find((m) => m.id === P.load().lab.user) || { name: '', staffId: '' };
  const notes = document.getElementById('sem-notes');
  const figure = (photo) => el('figure', { class: 'lab-figure' }, [
    el('a', { href: photo.src, target: '_blank', rel: 'noopener' }, el('img', { src: photo.src, alt: photo.alt, loading: 'lazy' })),
    photo.caption ? el('figcaption', { text: photo.caption }) : null
  ]);
  notes.append(
    el('h2', { text: N.title }),
    el('p', { class: 'lab-note-owner', text: lib.format(N.owner, { name: who.name, id: who.staffId }) }),
    ...N.entries.map((entry) => el('article', { class: 'lab-note' }, [
      el('h3', { text: entry.title }),
      ...window.EyeDom.paras(entry.paragraphs),
      entry.photo ? figure(entry.photo) : null
    ].filter(Boolean)))
  );
  // ---- SEM 能量強度紀錄（content.js 的 lab.semLog）：看見眼睛之後才出現在右邊面板「已擷取影像」下面（連線中斷的同時就接上去） ----
  // 把英文詞畫在一張看不見的畫布上，有顏色的地方取成資料點：橫向位置當能量、縱向位置當強度，
  // 再加一點雜訊、把先後順序打亂。所以照時間看是雜訊，強度對能量畫成散佈圖才看得到字。
  // 亂數有固定的種子，每次算出來的檔案都一樣
  function semLogRows(word) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const font = '400 80px Arial, Helvetica, sans-serif'; // 一般粗細：試算表預設的點很大，字太粗會糊成一團（P、A 的洞會被填掉）
    const gap = '22px'; // 字距拉開，散佈圖的點比較大時字母才不會黏在一起
    ctx.font = font;
    ctx.letterSpacing = gap;
    c.width = Math.ceil(ctx.measureText(word).width) + 30;
    c.height = 104;
    ctx.font = font; // 改了畫布大小，設定會被清掉，要再設一次
    ctx.letterSpacing = gap;
    ctx.textBaseline = 'middle';
    ctx.fillText(word, 15, 54);
    const px = ctx.getImageData(0, 0, c.width, c.height).data;
    let seed = 20261008;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const pts = [];
    for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) if (px[(y * c.width + x) * 4 + 3] > 128) pts.push([x + rnd() * 1.2, y + rnd() * 1.2]); // 抖一下，才不會排成整齊的格子
    for (let i = Math.round(pts.length * 0.02); i > 0; i--) pts.push([rnd() * c.width, rnd() * c.height]); // 少量雜點
    for (let i = pts.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [pts[i], pts[k]] = [pts[k], pts[i]]; }
    return pts.map(([x, y], i) => [(i * 0.2).toFixed(1), (0.5 + x / c.width * 9.5).toFixed(3), String(Math.round(180 + (1 - y / c.height) * 640))]);
  }

  function renderSemLog() {
    const G = L.semLog;
    if (!G || !lib.hasEvent(P.load(), G.event)) return null;
    const rows = semLogRows(G.word);
    const csv = [G.columns.join(',')].concat(rows.map((r) => r.join(','))).join('\r\n') + '\r\n';
    // 只給下載，玩家自己用試算表畫散佈圖
    return el('section', { class: 'lab-attachment' }, [
      el('h2', { class: 'sem-album-title', text: G.title }),
      el('p', { text: G.text }),
      el('p', {}, el('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: G.fileName, text: G.fileName }))
    ]);
  }

  // out：縮到最低倍率之後「繼續往回縮」的進度 0~1，三張照片都拍齊才動得了（見下面的眼睛）
  const state = { t: 0, out: 0, cx: 0.5, cy: 0.5, focus: cfg.startFocus };

  // ---- 樣品表面：有底圖就用底圖（真實照片），沒有才用程式產生的晶粒 ----
  let surface;
  if (cfg.surface.image) {
    surface = el('img', { class: 'sem-surface', src: cfg.surface.image, alt: '', draggable: 'false' });
  } else {
    surface = el('canvas', { class: 'sem-surface', width: cfg.surface.width, height: cfg.surface.height });
    surface.getContext('2d').putImageData(new ImageData(
      S.grainPixels(cfg.surface.width, cfg.surface.height, cfg.surface.seed, cfg.surface.cell),
      cfg.surface.width, cfg.surface.height), 0, 0);
  }
  stage.append(surface);

  // ---- 眼睛：照片拍齊後把倍率縮到最小再往回縮，樣品縮小成遠方的一塊地，一隻半透明的眼睛浮在上面 ----
  // 夢核（dreamcore）的做法：真實的眼睛照片只留眼型、去掉眼眶外的皮膚，黑白，貼在不該出現的地方
  const E = cfg.eye;
  const eye = el('div', { class: 'sem-eye', 'aria-hidden': 'true' });
  eye.innerHTML = `<svg viewBox="0 0 ${E.size[0]} ${E.size[1]}">
    <defs>
      <filter id="sem-eye-soft"><feGaussianBlur stdDeviation="4"/></filter>
      <mask id="sem-eye-mask"><path d="${E.outline}" fill="#fff" filter="url(#sem-eye-soft)"/></mask>
    </defs>
    <image href="${E.image}" width="${E.size[0]}" height="${E.size[1]}" mask="url(#sem-eye-mask)"/>
  </svg>`;
  view.insertBefore(eye, optics.nextSibling);
  let complete = false; // 三張照片都拍齊了沒（renderAlbum 更新）
  let shot = false;     // 拍到過照片沒有：還沒拍到之前，倍率鎖在 lockMag 以上（renderAlbum 更新）
  const floorT = () => (shot ? 0 : S.tForMag(cfg.lockMag, cfg));
  let lost = false;     // 被看見之後連線中斷，要重新整理才能再用

  // ---- 標記區域：低倍率是彩色框，放大後框淡出、照片淡入 ----
  const marks = cfg.clues.map((clue) => {
    const frame = el('div', { class: 'sem-frame' });
    const photo = el('img', { class: 'sem-photo', src: clue.photo, alt: '', draggable: 'false' });
    const box = el('div', { class: 'sem-mark' }, [photo, frame]);
    Object.assign(box.style, {
      left: (clue.x - clue.size / 2) * 100 + '%',
      top: (clue.y - clue.size * S.ASPECT / 2) * 100 + '%',
      width: clue.size * 100 + '%',
      height: clue.size * S.ASPECT * 100 + '%',
      color: clue.color
    });
    stage.append(box);
    return { clue, frame, photo };
  });

  // ---- 控制面板 ----
  const magSlider = el('input', { type: 'range', id: 'sem-mag', min: 0, max: 1000, step: 1, value: 0 });
  const focusSlider = el('input', { type: 'range', id: 'sem-focus', min: 0, max: 100, step: 0.5, value: state.focus });
  const captureBtn = el('button', { type: 'button', class: 'sem-capture', text: T.capture, onclick: capture });
  const status = el('p', { class: 'sem-status', role: 'status' });
  const album = el('ul', { class: 'sem-album' });
  const stepBtn = (text, label, dt) => el('button', { type: 'button', class: 'sem-step', text, 'aria-label': label, onclick: () => zoomBy(dt) });

  magSlider.addEventListener('input', () => { state.t = Math.max(floorT(), magSlider.value / 1000); if (magSlider.value / 1000 < floorT()) say(T.magLocked); state.out = 0; render(); });
  focusSlider.addEventListener('input', () => { state.focus = Number(focusSlider.value); render(); });

  panel.append(
    el('p', { class: 'sem-help', id: 'sem-help', text: T.help }),
    el('div', { class: 'sem-group' }, [
      el('label', { for: 'sem-mag', text: T.mag }), stepBtn('−', T.zoomOut, -cfg.zoomStep), magSlider, stepBtn('+', T.zoomIn, cfg.zoomStep)
    ]),
    el('div', { class: 'sem-group' }, [el('label', { for: 'sem-focus', text: T.focus }), focusSlider]),
    // 擺設用的參數：看起來能調，點了只會顯示「此功能無響應」
    el('div', { class: 'sem-knobs' }, cfg.dummyControls.map((d) =>
      el('button', { type: 'button', class: 'sem-knob', onclick: () => say(T.noResponse) }, [el('span', { text: d.name }), el('b', { text: d.value })]))),
    captureBtn,
    status,
    el('h2', { class: 'sem-album-title', text: T.album }),
    album
  );

  function say(text, red) { status.textContent = text; status.classList.toggle('is-red', !!red); }
  function zoomBy(dt) {
    if (lost) return;
    if (dt < 0 && state.t === 0 && complete) state.out = Math.min(1, state.out + cfg.eye.step);
    else if (dt > 0 && state.out > 0) state.out = Math.max(0, state.out - cfg.eye.step);
    else if (dt < 0 && state.t <= floorT() && !shot) say(T.magLocked);
    else state.t = Math.min(1, Math.max(floorT(), state.t + dt));
    render();
    if (state.out >= 1) seen();
  }

  // 整隻眼睛都露出來了：先是一行紅字，過幾秒連線中斷
  function seen() {
    lost = true;
    P.addEvent(E.event);
    if (window.EyeEffects) window.EyeEffects.refresh(); // 看見眼睛帶來的眼疾效果，馬上套用
    say(E.lines.join(''), true);
    // 右邊面板狀態列的那行紅字也一樣：原本的字變透明，在 <body> 外面疊一層紅字，眼疾效果蓋不到
    const echo = el('p', { class: 'sem-status-layer', 'aria-hidden': 'true', text: E.lines.join('') });
    const placeEcho = () => {
      const r = status.getBoundingClientRect();
      Object.assign(echo.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px' });
    };
    status.style.color = 'transparent';
    placeEcho();
    document.documentElement.append(echo);
    window.addEventListener('scroll', placeEcho, { passive: true });
    window.addEventListener('resize', placeEcho);
    // 字一行一行出現，每一行比上一行更往右下，排成階梯
    const text = el('p', { class: 'sem-eye-text' }, E.lines.map((line, i) => {
      const span = el('span', { text: line });
      span.style.marginLeft = i * 2.2 + 'em';
      span.style.animationDelay = i * E.lineDelay + 'ms';
      return span;
    }));
    // 紅字放在 <body> 外面一層，疊在畫面上：眼疾效果的濾鏡蓋不到，一直是紅的
    const layer = el('div', { class: 'sem-eye-layer', 'aria-hidden': 'true' }, text);
    const place = () => {
      const r = view.getBoundingClientRect();
      Object.assign(layer.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    };
    place();
    document.documentElement.append(layer);
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    setTimeout(() => {
      layer.remove();
      window.removeEventListener('scroll', place);
      window.removeEventListener('resize', place);
      cutOff();
      addLog(); // 系統在斷線前存下的紀錄，接在已擷取影像下面
    }, cfg.eye.lostDelay);
  }

  const addLog = () => { const log = renderSemLog(); if (log) panel.append(log); };

  // 連線中斷：黑畫面，儀器不能再操作；旁邊的筆記、已擷取影像和附件還可以看。看見眼睛之後就一直是這樣，重新整理也一樣
  function cutOff() {
    lost = true;
    view.append(el('div', { class: 'sem-lost' }, [el('p', { text: E.lost })]));
    document.querySelector('.sem-screen').inert = true;
    [...panel.children].forEach((c) => { if (!c.matches('.sem-album-title, .sem-album, .lab-attachment')) c.inert = true; });
  }

  function render() {
    const scale = S.scaleAt(state.t, cfg);
    Object.assign(state, S.clampCenter(state.cx, state.cy, scale));
    const w = view.clientWidth;
    const h = view.clientHeight;
    const s = scale * (1 - state.out * (1 - cfg.eye.minScale)); // 往回縮時樣品縮小，像從高空往下看的一塊地
    stage.style.transform = `translate(${w / 2 - state.cx * w * s}px, ${h / 2 - state.cy * h * s}px) scale(${s})`;
    view.classList.toggle('is-out', state.out > 0);
    view.style.setProperty('--out', state.out.toFixed(3));
    eye.style.opacity = state.out * cfg.eye.opacity;
    // 模糊放在沒有縮放的外層，模糊量才會是固定的螢幕像素
    optics.style.filter = `blur(${S.blurPx(state, cfg).toFixed(2)}px)`;
    marks.forEach((m) => {
      const o = S.revealOpacity(m.clue, scale);
      m.photo.style.opacity = o;
      m.frame.style.opacity = 1 - o;
      m.frame.style.borderWidth = 2 / scale + 'px'; // 抵銷縮放，框線在螢幕上維持 2px
    });
    magSlider.value = Math.round(state.t * 1000);
    focusSlider.value = state.focus;
    renderDatabar(w);
  }

  function renderDatabar(viewWidth) {
    const mag = S.magAt(state.t, cfg);
    const bar = state.out > 0 ? S.barFor(S.eyeField(state.out, cfg)) : S.scaleBar(mag);
    const lib = window.EyeProgressLib;
    databar.replaceChildren(
      el('span', { text: 'HV ' + cfg.kv }),
      el('span', { text: 'WD ' + S.workingDistance(state.focus) }),
      el('span', { text: 'Mag ' + (state.out > 0 ? T.magUnknown : S.formatMag(mag)) }),
      el('span', { text: cfg.detector }),
      el('span', { class: 'sem-bar' }, [el('i', { style: `width:${Math.round(bar.fraction * viewWidth)}px` }), bar.label]),
      el('span', { text: lib.isoToDots(lib.todayISO()) }),
      el('span', { text: L.unitNameShort })
    );
  }

  // ---- 擷取影像：慢速掃描一次，以按下當下的畫面判定 ----
  let scanning = false;
  function capture() {
    if (scanning || lost) return;
    const shot = { t: state.t, cx: state.cx, cy: state.cy, focus: state.focus };
    scanning = true;
    captureBtn.disabled = true;
    say(T.scanning);
    scan.classList.remove('is-scanning');
    void scan.offsetWidth; // 讓掃描線動畫每次都從頭播
    scan.classList.add('is-scanning');
    setTimeout(() => {
      scanning = false;
      captureBtn.disabled = false;
      scan.classList.remove('is-scanning');
      const result = S.captureCheck(shot, cfg);
      if (!result.ok) { say(T[result.reason]); return; }
      say(P.addPhoto(result.clue.id).added ? T.saved : T.already);
      renderAlbum();
      render(); // 第一次拍到照片，倍率解鎖
    }, cfg.scanMs);
  }

  function renderAlbum() {
    const have = P.load().photos;
    complete = cfg.clues.every((c) => have.includes(c.id));
    shot = cfg.clues.some((c) => have.includes(c.id));
    const items = cfg.clues.filter((c) => have.includes(c.id)).map((c) => el('li', {}, [
      el('a', { href: c.photo, target: '_blank', rel: 'noopener' }, el('img', { src: c.photo, alt: c.label })),
      el('span', { text: c.label })
    ]));
    album.replaceChildren(...(items.length ? items : [el('li', { class: 'sem-album-empty', text: T.albumEmpty })]));
  }

  // ---- 操作：拖曳移動、滾輪縮放、鍵盤 ----
  let drag = null;
  view.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || drag) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    view.setPointerCapture(e.pointerId);
    view.classList.add('is-dragging');
  });
  view.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const scale = S.scaleAt(state.t, cfg);
    state.cx -= (e.clientX - drag.x) / (view.clientWidth * scale);
    state.cy -= (e.clientY - drag.y) / (view.clientHeight * scale);
    drag.x = e.clientX; drag.y = e.clientY;
    render();
  });
  // 眼睛跟著游標微微移動（往回縮的時候才看得到）
  view.addEventListener('pointermove', (e) => {
    if (!state.out) return;
    const box = view.getBoundingClientRect();
    const dx = (e.clientX - box.left) / box.width * 2 - 1;
    const dy = (e.clientY - box.top) / box.height * 2 - 1;
    eye.style.transform = `translate(${(dx * 2).toFixed(2)}%, ${(dy * 2).toFixed(2)}%)`;
  });
  const endDrag = (e) => { if (drag && e.pointerId !== drag.id) return; drag = null; view.classList.remove('is-dragging'); };
  view.addEventListener('pointerup', endDrag);
  view.addEventListener('pointercancel', endDrag);
  view.addEventListener('wheel', (e) => { e.preventDefault(); zoomBy(e.deltaY < 0 ? cfg.wheelStep : -cfg.wheelStep); }, { passive: false });
  view.addEventListener('keydown', (e) => {
    const step = cfg.panStep /S.scaleAt(state.t, cfg);
    const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (move) { e.preventDefault(); state.cx += move[0]; state.cy += move[1]; render(); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(cfg.zoomStep); }
    else if (e.key === '-') { e.preventDefault(); zoomBy(-cfg.zoomStep); }
  });
  window.addEventListener('resize', render);

  renderAlbum();
  if (lib.hasEvent(P.load(), E.event)) { cutOff(); addLog(); }
  state.t = floorT(); // 從 lockMag 開始；已經拍過照片的話從最低倍率開始
  render();
})();
