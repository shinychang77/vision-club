// 視界首頁的假廣告：設定上是高維存在偷偷塞進網站的干擾，玩起來只是好笑。
// 待在首頁超過 ads.delay 毫秒，左下角跳出一則（跑酷或阿嬤，隨機一個），點了在原本這一頁跳到 404.html。文字在 content.js 的 ads
(function () {
  'use strict';
  const C = window.EYE_CONTENT;
  const A = C && C.ads;
  if (!A || !window.EyeDom) return;
  const { el } = window.EyeDom;
  const go = () => { location.href = '404.html'; }; // 兩則廣告都在原本這一頁跳 404（跑酷撞到大魔王時已經不算玩家剛點擊，開新分頁會被瀏覽器擋）

  setTimeout(() => {
    const kind = Math.random() < 0.5 ? 'runner' : 'granny';
    const box = el('aside', { class: 'fake-ad', 'aria-label': A.label }, [
      el('div', { class: 'fake-ad-bar' }, [
        el('span', { text: A.label }),
        el('button', { type: 'button', class: 'fake-ad-x', 'aria-label': A.close, text: '✕', onclick: () => { box.remove(); shade.remove(); } })
      ]),
      kind === 'runner' ? runner(A.runner) : granny(A.granny)
    ]);
    // 第一次點廣告（✕ 以外）：從角落放大到畫面中間，之後才能玩；點旁邊的暗處就整個關掉
    const shade = el('div', { class: 'fake-ad-shade', onclick: () => { box.remove(); shade.remove(); } });
    box.addEventListener('click', (event) => {
      if (box.classList.contains('is-big') || event.target.closest('.fake-ad-x')) return;
      event.stopPropagation();
      event.preventDefault();
      const r = box.getBoundingClientRect();
      const scale = Math.min(1.7, (window.innerWidth - 32) / r.width, (window.innerHeight - 32) / r.height);
      box.style.transform = `translate(${window.innerWidth / 2 - (r.left + r.width / 2)}px, ${window.innerHeight / 2 - (r.top + r.height / 2)}px) scale(${scale})`;
      box.classList.add('is-big');
      document.documentElement.append(shade);
    }, true);
    // 掛在 <body> 外面：眼疾效果會在 body 加濾鏡，裡面的 fixed 元素就不會貼著螢幕角落了
    document.documentElement.append(box);
  }, A.delay);

  // ---- 跑酷：一群膠囊小人往前跑，迎面來三道門（每道左右兩扇加減門），終點是幾個方塊排成的一圈（3D 新手隨手拼的那種）----
  // 點畫面開始跑；滑鼠（或手指）左右移動決定走哪一扇，小人的數量真的會變（1～20 個）；最後圓環迎面撞上來，就開 404
  const MAX_MEN = 20;
  function runner(R) {
    const stage = el('div', { class: 'fake-ad-stage fake-ad-runner' });
    stage.innerHTML = `<svg viewBox="0 0 280 210" aria-hidden="true">
      <defs>
        <linearGradient id="fa-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fd0ff"/><stop offset="1" stop-color="#c9f1ff"/></linearGradient>
        <linearGradient id="fa-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa3ad"/><stop offset="1" stop-color="#5e6670"/></linearGradient>
      </defs>
      <rect width="280" height="210" fill="url(#fa-sky)"/>
      <polygon points="137,44 143,44 290,210 -10,210" fill="url(#fa-road)"/>
      <g class="fa-marks"></g>
      <g class="fa-boss"><g class="fa-ring">${ringCubes()}</g></g>
      ${R.gates.map((row) => `<g class="fa-gates">${gateRow(row)}</g>`).reverse().join('')}
      <g class="fa-crowd"><g class="fa-men"></g><text class="fa-count" x="0" y="-22" text-anchor="middle"></text></g>
    </svg>`;
    const svg = stage.querySelector('svg');
    const boss = stage.querySelector('.fa-boss');
    const rows = [...stage.querySelectorAll('.fa-gates')].reverse(); // 畫的時候遠的先畫，算的時候近的先算
    const crowdG = stage.querySelector('.fa-crowd');
    const menG = crowdG.querySelector('.fa-men');
    const countT = crowdG.querySelector('.fa-count');
    const hand = el('span', { class: 'fake-ad-hand', 'aria-hidden': 'true', text: '👆' });
    const op = (g) => {                   // 門上的字換成算法：+5、×2、−3
      const n = Number(g.replace(/[^\d]/g, '')) || 0;
      return g[0] === '×' ? (c) => c * n : /^[−-]/.test(g) ? (c) => c - n : (c) => c + n;
    };
    let count = 6;
    let lat = 0;        // 小人在跑道上的左右位置（−90～90，0 是正中間）
    let want = 0;       // 滑鼠指的左右位置
    let started = 0;
    let done = false;
    const crossed = rows.map(() => false);
    const setCount = (n) => {
      count = Math.max(1, Math.min(MAX_MEN, n));
      menG.innerHTML = men(count);
      countT.textContent = String(count);
    };
    setCount(count);

    // 鏡頭跟著小人：小人一直在畫面下方，跑道、門、大魔王依「離小人多遠」投影到畫面上。
    // dz＝物體在小人前方多遠（再加上鏡頭在小人後方 1 的距離），越遠越靠近地平線、越小
    const HORIZON = 44;
    const yAt = (dz) => HORIZON + 144 / dz;
    const sAt = (dz) => 1 / dz;
    const place = (g, dz, extra) => {
      const s = sAt(dz) * (extra || 1);
      g.setAttribute('transform', `translate(140 ${yAt(dz).toFixed(1)}) scale(${s.toFixed(3)})`);
    };
    const GATE_Z = [3, 5, 7];   // 三道門擺在跑道上的位置
    const BOSS_Z = 9;           // 大魔王在跑道盡頭
    const marksG = stage.querySelector('.fa-marks');
    let z = 0;                  // 小人跑到哪裡

    // 跑道中線的白線和兩旁的柱子：跟著小人往後退，看起來才像在往前跑
    function drawMarks() {
      let out = '';
      for (let k = Math.floor(z) + 1; k < z + 14; k += 0.7) {
        const dz = k - z + 1;
        const s = sAt(dz);
        const y = yAt(dz);
        out += `<rect x="${(140 - 2.5 * s).toFixed(1)}" y="${(y - 8 * s).toFixed(1)}" width="${(5 * s).toFixed(1)}" height="${(10 * s).toFixed(1)}" fill="#fff" opacity=".8"/>`;
        if (Math.round(k * 10) % 21 === 0) {
          [-1, 1].forEach((side) => {
            out += `<rect x="${(140 + side * 140 * s - 3 * s).toFixed(1)}" y="${(y - 34 * s).toFixed(1)}" width="${(6 * s).toFixed(1)}" height="${(34 * s).toFixed(1)}" fill="#ff8a00" stroke="#7a3d00" stroke-width="${(1 * s).toFixed(2)}"/>`;
          });
        }
      }
      marksG.innerHTML = out;
    }
    function drawWorld() {
      drawMarks();
      rows.forEach((row, i) => {
        const dz = GATE_Z[i] - z + 1;
        row.style.opacity = dz < 0.55 ? '0' : '';   // 已經跑過、到鏡頭後面的門不畫
        if (dz >= 0.55) place(row, dz);
      });
      place(boss, BOSS_Z - z + 1, 3);
      crowdG.setAttribute('transform', `translate(${(140 + lat).toFixed(1)} ${yAt(1)})`);
    }

    // 滑鼠或手指在畫面上的橫向位置，換成跑道上的左右位置
    const toLat = (event) => {
      const r = svg.getBoundingClientRect();
      return Math.max(-90, Math.min(90, (event.clientX - r.left) / r.width * 280 - 140));
    };
    stage.addEventListener('pointermove', (event) => { want = toLat(event); });
    stage.addEventListener('click', (event) => {
      want = toLat(event);
      if (started) return;
      started = performance.now();
      hand.remove();
      requestAnimationFrame(tick);
    });
    drawWorld();

    const TOTAL = 4800; // 從起點跑到大魔王要幾毫秒
    function tick(now) {
      if (done) return;
      z = Math.min(BOSS_Z, (now - started) / TOTAL * BOSS_Z);
      lat += (want - lat) * 0.12;
      GATE_Z.forEach((gz, i) => {
        if (crossed[i] || z < gz) return; // 跑到這道門：看在左邊還是右邊那扇
        crossed[i] = true;
        setCount(op(R.gates[i][lat < 0 ? 0 : 1])(count));
        countT.classList.remove('is-pop'); void countT.getBBox(); countT.classList.add('is-pop');
      });
      drawWorld();
      if (z >= BOSS_Z) {             // 撞上大魔王：小人消失，同一頁跳 404
        done = true;
        crowdG.style.opacity = '0';
        setTimeout(() => { location.href = '404.html'; }, 300);
        return;
      }
      requestAnimationFrame(tick);
    }

    return el('div', { class: 'fake-ad-body is-runner' }, [
      stage,
      el('p', { class: 'fake-ad-title fake-ad-neon', text: R.level }),
      el('p', { class: 'fake-ad-hint', text: R.hint }),
      hand,
      el('p', { class: 'fake-ad-foot', text: R.installs })
    ]);
  }

  // 一道門：左右兩扇半透明的色板＋白色大字，畫在原點，由 .fa-gates 整道移動、放大
  function gateRow(labels) {
    const colors = [['#39d353', '#1d8a2f'], ['#3a8bff', '#1f55b8']];
    return labels.slice(0, 2).map((label, i) => {
      const cx = i ? 50 : -50;
      const [fill, line] = colors[i];
      return `<g><rect x="${cx - 46}" y="-22" width="92" height="44" rx="4" fill="${fill}" fill-opacity=".55" stroke="${line}" stroke-width="2"/>
        <text x="${cx}" y="8" text-anchor="middle">${label.replace(/[<&>]/g, '')}</text></g>`;
    }).join('');
  }

  // 圓環：12 個方塊，每個是正面＋頂面＋側面三塊色片拼出來的假 3D，中間空著
  function ringCubes() {
    let out = '';
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      const x = Math.cos(a) * 30;
      const y = Math.sin(a) * 30;
      out += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
        <rect x="-5" y="-5" width="10" height="10" fill="#c45cff"/>
        <polygon points="-5,-5 -1,-9 9,-9 5,-5" fill="#e3a6ff"/>
        <polygon points="5,-5 9,-9 9,1 5,5" fill="#8a2fc2"/></g>`;
    }
    return out;
  }

  // 小人：n 個顏色亂配的膠囊，每排最多 5 個、排在原點附近（由 .fa-crowd 整群移動），跑步時上下晃
  function men(n) {
    const colors = ['#ff4d4d', '#ffb000', '#3ad15a', '#2f8cff', '#ff5ec4', '#00c2c7', '#ff7a00', '#7d5cff', '#ffe600'];
    let out = '';
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 5);
      const inRow = Math.min(5, n - row * 5);
      const x = ((i % 5) - (inRow - 1) / 2) * 9 - 3.5;
      const y = row * 7 - 12;
      out += `<rect class="fa-man" style="animation-delay:${(i % 3) * 0.08}s" x="${x.toFixed(1)}" y="${y}" width="7" height="13" rx="3.5" fill="${colors[i % colors.length]}" stroke="#222" stroke-width=".8"/>`;
    }
    return out;
  }

  // ---- 阿嬤：手遊廣告那種半寫實 3D 的可憐畫面（Gemini 生成的原創圖），字幕疊在圖片下緣。點哪個都直接 404，沒有別的畫面 ----
  function granny(G) {
    const stage = el('div', { class: 'fake-ad-stage fake-ad-granny' }, [
      el('img', { src: G.image, alt: G.alt }),
      el('p', { class: 'fake-ad-caption' }, [G.title, el('br'), G.question])
    ]);
    stage.addEventListener('click', go);
    return el('div', { class: 'fake-ad-body' }, [
      stage,
      el('div', { class: 'fake-ad-options' }, G.options.map((text) => el('button', { type: 'button', class: 'fake-ad-btn', text, onclick: go }))),
      el('p', { class: 'fake-ad-foot', text: G.installs })
    ]);
  }
})();
