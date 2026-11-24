// 研究單位網站：首頁、公開頁面、員工專區。內容見 content.js 的 lab
// 網址：index.html 是首頁，#staff 是員工專區（登入在這裡）。研究筆記放在遠端影像系統（sem.html）的儀器旁邊
(function () {
  'use strict';
  const C = window.EYE_CONTENT;
  const P = window.EyeProgress;
  const lib = window.EyeProgressLib;
  const main = document.getElementById('lab-app');
  if (!C || !C.lab || !P || !main || !window.EyeDom) return;
  const { el } = window.EyeDom;
  const L = C.lab;
  const H = L.home;
  const T = L.login;
  const N = L.notes;
  const F = L.fileTexts;
  const S = L.search;
  const D = L.dim;
  const CH = L.chat;
  const PT = L.portal;

  document.title = L.unitName;
  document.getElementById('lab-name').textContent = L.unitName;
  document.getElementById('lab-back').textContent = L.backToMain;
  // ---- 深色模式：玩家把裝置切成深色模式、而且已經登入時，首頁整個變黑，中間浮現一行平常看不到的字 ----
  // 黑幕擋住整頁，點一下才收起來；離開首頁再回來、或重新切成深色模式，就會再出現一次。
  // 本來就開深色模式的玩家不會卡住，但每次回首頁都要再點一次，不會一直開著深色模式玩、把眼疾效果看淡
  // 網頁讀不到螢幕亮度，但讀得到系統是不是深色模式。對應世界觀「光是眼睛的食物」
  const glow = el('p', { class: 'lab-glow', 'aria-live': 'polite' });
  const dark = window.matchMedia('(prefers-color-scheme: dark)');
  let dismissed = false; // 這一次待在首頁時點掉了
  function applyDim() {
    const home = location.hash.length < 2; // 只有首頁有字
    if (!home) dismissed = false;           // 離開首頁就重來，回首頁會再出現
    const show = dark.matches && !!member() && home && !dismissed;
    glow.textContent = show ? D.text : '';  // 平常不放進頁面，全選或搜尋都找不到
    glow.classList.toggle('is-shown', show);
  }
  glow.addEventListener('click', () => { dismissed = true; applyDim(); });
  dark.addEventListener('change', () => { dismissed = false; applyDim(); showSky(); });
  // 標誌旁的太陽／月亮：只顯示網頁讀到的是淺色還是深色，不能按。玩家切了系統設定、瀏覽器卻沒跟上時，看得出網站沒收到
  const sky = document.getElementById('lab-sky');
  function showSky() {
    sky.innerHTML = dark.matches
      ? '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  }
  if (sky) showSky();
  document.documentElement.append(glow); // 掛在 <body> 外面：眼疾效果會在 body 加濾鏡，裡面的 fixed 元素就不會貼著螢幕了
  document.getElementById('lab-footer').replaceChildren(el('p', { text: H.footer }), H.phone ? el('p', { text: H.phone }) : '');

  const member = () => L.members.find((m) => m.id === P.load().lab.user) || null;

  function route() {
    const file = L.files.find((x) => location.hash === '#file-' + x.id);
    const page = L.pages.find((x) => location.hash === '#' + x.id);
    const doc = L.docs.find((x) => location.hash === '#doc-' + x.id);
    const inside = /^#(staff|chat|file-|doc-|search=)/.test(location.hash); // 員工專區裡面的頁面
    renderNav(page, inside);
    document.getElementById('lab-search').replaceChildren(renderSearch()); // 搜尋框固定在頁首右上角，每一頁都有
    main.replaceChildren(...[inside && member() ? portalBar() : null, ...(file ? renderFile(file) : doc ? renderDoc(doc) : page ? renderPage(page) : location.hash.startsWith('#search=') ? renderResults(decodeURIComponent(location.hash.slice(8))) : location.hash.startsWith('#chat') ? renderChat() : location.hash === '#staff' ? renderStaff() : renderHome())].filter(Boolean)); // 沒有照片的地方會有空項目，要濾掉
    applyDim();
    window.scrollTo(0, 0);
  }

  // 頁首下方的導覽列：首頁與公開頁面（content.js 的 lab.pages）
  function renderNav(current, inside) {
    const home = location.hash.length < 2;
    document.getElementById('lab-nav').replaceChildren(
      el('a', { href: '#', 'aria-current': home ? 'page' : null, text: L.nav.home }),
      ...L.pages.map((p) => el('a', { href: '#' + p.id, 'aria-current': p === current ? 'page' : null, text: p.title })),
      el('a', { href: '#staff', class: 'lab-nav-staff', 'aria-current': inside ? 'page' : null, text: L.nav.staff })
    );
  }

  // 內部文件：登入後用搜尋框才找得到
  function renderDoc(doc) {
    const home = el('p', {}, el('a', { href: '#staff', text: T.toStaff }));
    if (!member()) return [el('p', { text: T.needLogin }), home];
    // 有 code 的文件要輸入密碼才看得到內文（打開後記下事件 doc.event）
    if (doc.code && !lib.hasEvent(P.load(), doc.event)) return [el('h1', { text: doc.title }), lockForm(doc), home];
    // stamp（選填）：蓋在標題下面的印章，例如「不予刊出」
    return [el('h1', { text: doc.title }), doc.stamp ? el('p', { class: 'lab-stamp', text: doc.stamp }) : null, ...doc.blocks.flatMap(renderBlock), home];
  }

  function renderPage(page) {
    return [el('h1', { text: page.title }), ...page.blocks.flatMap(renderBlock)];
  }

  function renderBlock(block) {
    switch (block.type) {
      case 'h': return el('h2', { text: block.text });
      case 'p': return window.EyeDom.paras(block.text);
      case 'ul': return el('ul', {}, block.items.map((text) => el('li', { text })));
      case 'table': return el('div', { class: 'lab-table-wrap' }, el('table', { class: 'lab-table' }, [
        el('thead', {}, el('tr', {}, block.head.map((text) => el('th', { text })))),
        el('tbody', {}, block.rows.map((row) => el('tr', {}, row.map((text) => el('td', { text })))))
      ]));
      case 'img': return figure(block);
      case 'file': { // 連到加密文件（lab.files）
        const file = L.files.find((x) => x.id === block.id);
        return el('p', { class: 'lab-file-link' }, el('a', { href: '#file-' + file.id, text: file.title }));
      }
      default: return null;
    }
  }

  // 照片：點了開原圖。src 是相對於 lab/ 的路徑
  // overlay（選填）是疊在圖上的幾行字，第一行最大。用在封面：圖片留白，書名和期數由網頁疊上去
  function figure(photo) {
    return el('figure', { class: 'lab-figure' + (photo.overlay ? ' lab-cover' : '') }, [
      el('a', { href: photo.src, target: '_blank', rel: 'noopener' }, [
        el('img', { src: photo.src, alt: photo.alt, loading: 'lazy' }),
        photo.overlay ? el('span', { class: 'lab-cover-text' }, photo.overlay.map((text) => el('span', { text }))) : null
      ]),
      photo.caption ? el('figcaption', { text: photo.caption }) : null
    ]);
  }

  // 首頁：主視覺（標語＋介紹＋按鈕，右邊是和標誌同一個圖形的色塊）→ 研究資源卡片 → 最新消息＋員工專區
  function renderHome() {
    return [
      el('section', { class: 'lab-hero' }, [
        el('div', {}, [
          el('p', { class: 'lab-hero-kicker', text: L.unitName }),
          el('h1', { text: H.tagline }),
          ...window.EyeDom.paras(H.intro),
          el('a', { class: 'lab-cta', href: '#' + L.pages[0].id, text: H.cta })
        ]),
        el('div', { class: 'lab-hero-art', 'aria-hidden': 'true' })
      ]),
      H.photo ? figure(H.photo) : null,
      el('h2', { text: H.equipmentTitle }),
      // equipment 每一項的 cells 依序是：名稱、來源、說明
      el('ul', { class: 'lab-cards' }, H.equipment.map(({ cells: [name, from, note] }) => el('li', {}, [
        el('h3', { text: name }), el('small', { text: from }), el('p', { text: note })
      ]))),
      el('h2', { text: H.newsTitle }),
      el('ul', { class: 'lab-news' }, H.news.map((n) => el('li', {}, [
        el('time', { datetime: n.date, text: n.date.replace(/-/g, '.') }),
        el('span', { text: n.text })
      ])))
    ];
  }

  // 員工專區最上面的系統列：系統名稱、登入的人、登出
  function portalBar() {
    const who = member();
    return el('div', { class: 'lab-portal-bar' }, [
      el('a', { href: '#staff', class: 'lab-portal-name', text: PT.name }),
      el('span', { class: 'lab-portal-who', text: `${who.name}（${who.staffId}）${PT.role}` }),
      el('button', { type: 'button', onclick: () => { P.labLogout(); location.hash = '#staff'; route(); }, text: T.logout })
    ]);
  }

  // 員工專區（#staff）：登入前是登入頁，登入後是入口網首頁（左邊是遠端影像系統、訊息、加密文件的入口，右邊是系統公告）
  function renderStaff() {
    const who = member();
    if (!who) return [renderLogin()];
    const link = (href, text, badge) => el('li', {}, el('a', { href }, [text, badge ? el('b', { class: 'lab-badge', text: String(badge) }) : null]));
    return [el('div', { class: 'lab-portal' }, [
      el('nav', { class: 'lab-portal-menu', 'aria-label': PT.menuTitle }, [
        el('h2', { text: PT.menuTitle }),
        el('ul', {}, [
          link('sem.html', T.semLink),
          link('#chat', CH.link, CH.threads.filter((t) => !isRead(t.id)).reduce((n, t) => n + (t.unread || 0), 0))
        ])
      ]),
      el('section', {}, [
        el('h1', { text: lib.format(T.hello, { name: who.name }) }),
        el('p', { class: 'lab-portal-last', text: PT.lastLogin }),
        el('h2', { text: PT.newsTitle }),
        el('table', { class: 'lab-portal-news' }, el('tbody', {}, PT.news.map((n) => el('tr', {}, [
          el('td', {}, el('time', { datetime: n.date, text: n.date.replace(/-/g, '/') })),
          el('td', { text: n.from }),
          el('td', { text: n.text })
        ]))))
      ])
    ])];
  }

  // 登入頁
  function renderLogin() {
    const name = el('input', { type: 'text', id: 'lab-login-name', autocomplete: 'off', spellcheck: 'false' });
    const staffId = el('input', { type: 'text', id: 'lab-login-id', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
    const status = el('p', { class: 'lab-status', role: 'status' });
    const form = el('form', { class: 'lab-login' }, [
      el('div', { class: 'lab-login-head' }, [el('h1', { text: PT.name }), el('small', { text: PT.version })]),
      el('div', { class: 'lab-login-body' }, [
        el('h2', { text: T.title }),
        el('label', { for: 'lab-login-name', text: T.nameLabel }), name,
        el('label', { for: 'lab-login-id', text: T.idLabel }), staffId,
        el('button', { type: 'submit', class: 'lab-button', text: T.button }),
        status,
        el('p', { class: 'lab-login-help', text: PT.help })
      ]),
      el('p', { class: 'lab-login-notice', text: PT.notice }),
      el('p', { class: 'lab-login-foot', text: PT.foot })
    ]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (P.labLogin(name.value, staffId.value).ok) route();
      else status.textContent = T.failed;
    });
    return form;
  }

  // 站內搜尋：要先登入才能用，登入後底字是暗號的格式提示（S.codeHint）。平常什麼都查不到；輸入暗號（深色模式才看得到）就進教團網站，並記下事件
  function renderSearch() {
    const locked = !member();
    const input = el('input', { type: 'search', id: 'lab-q', autocomplete: 'off', placeholder: locked ? S.label : S.codeHint, 'aria-label': S.label, disabled: locked });
    const status = el('p', { class: 'lab-status', role: 'status', text: locked ? S.needLogin : '' });
    const form = el('form', { class: 'lab-search', role: 'search' }, [
      status,
      input,
      el('button', { type: 'submit', class: 'lab-button', text: S.button, disabled: locked })
    ]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (locked) return;
      const q = input.value.trim();
      if (P.openLock(S, q).ok) { input.disabled = true; crossToCult(input, q); return; }
      // 不是暗號：到搜尋結果頁
      if (q) location.hash = '#search=' + encodeURIComponent(q);
    });
    return form;
  }

  // 搜尋結果頁（#search=關鍵字）：內部文件（關鍵字要完全打對）和外部連結（search.links），點了開新分頁
  function renderResults(q) {
    const home = el('p', {}, el('a', { href: '#staff', text: T.toStaff }));
    if (!member()) return [el('p', { text: T.needLogin }), home];
    const want = lib.normalizeCode(q);
    const hit = (words) => !!want && words.some((k) => lib.normalizeCode(k) === want);
    const found = L.docs.filter((d) => hit(d.keywords)).map((d) => ({ href: '#doc-' + d.id, title: d.title }))
      .concat((S.links || []).filter((x) => hit(x.keywords)));
    return [
      el('h1', { text: lib.format(S.resultTitle, { q }) }),
      found.length
        ? el('ul', { class: 'lab-results' }, found.map((x) => el('li', {}, [
          el('a', { href: x.href, target: '_blank', rel: 'noopener', text: x.title }), x.note ? el('small', { text: x.note }) : null
        ])))
        : el('p', { text: lib.format(S.empty, { q }) }),
      home
    ];
  }

  // ---- 輸入暗號後的過場（範例見 dev/cult-styles.html 的 D＋E）----
  // 研究中心的字一個個沉下去、糊掉，只剩暗號；暗號變紅，一滴暗紅色從搜尋框暈開吞掉整個畫面，才跳到教團。
  // 教團那邊接著從同一個暗紅色退成燭光（fellowship.js 讀 sessionStorage 的 eye:cross）
  function crossToCult(from, code) {
    const go = () => { location.href = S.href; };
    try { sessionStorage.setItem('eye:cross', '1'); } catch (e) { /* 讀寫不了就沒有接續的動畫 */ }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { go(); return; }
    // 字散：把頁面上的字拆成一個一個，每個字晚一點點、歪一點點往下沉
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeValue.trim() && !n.parentElement.closest('script, style') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => n.replaceWith(...Array.from(n.nodeValue).map((ch) => {
      if (!ch.trim()) return ch;
      const s = el('span', { class: 'lab-sink', text: ch });
      s.style.setProperty('--d', (Math.random() * 1.2).toFixed(2) + 's');
      s.style.setProperty('--r', (Math.random() * 40 - 20).toFixed(0) + 'deg');
      return s;
    })));
    document.body.classList.add('lab-crossing');
    // 暗號和墨滴掛在 <body> 外面，不受眼疾效果的濾鏡影響
    const r = from.getBoundingClientRect();
    const layer = el('div', { class: 'lab-cross', 'aria-hidden': 'true' }, [
      el('p', { class: 'lab-cross-code', text: code }),
      el('div', { class: 'lab-cross-ink' }, el('i'))
    ]);
    layer.style.setProperty('--ix', Math.round(r.left + r.width / 2) + 'px');
    layer.style.setProperty('--iy', Math.round(r.top + r.height / 2) + 'px');
    layer.insertAdjacentHTML('afterbegin', '<svg width="0" height="0" style="position:absolute"><filter id="lab-rough"><feTurbulence baseFrequency=".035" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="46"/></filter></svg>');
    document.documentElement.append(layer);
    setTimeout(go, 4700);
  }

  // 訊息（#chat、#chat-對象 id）：左邊是聊天對象，右邊是對話和輸入欄。帳號是唯讀的，送不出去。
  // 打開過的對象不再算未讀（記在進度的 ui.read，換頁、重新整理都一樣）
  const isRead = (id) => P.load().ui.read.indexOf(id) !== -1;
  function renderChat() {
    const home = el('p', {}, el('a', { href: '#staff', text: T.toStaff }));
    if (!member()) return [el('p', { text: T.needLogin }), home];
    const t = CH.threads.find((x) => location.hash === '#chat-' + x.id) || CH.threads[0];
    P.markRead(t.id);
    const avatar = (name) => el('span', { class: 'lab-avatar', 'aria-hidden': 'true', text: name.replace('@', '')[0].toUpperCase() });
    const input = el('input', { type: 'text', id: 'lab-chat-input', autocomplete: 'off', placeholder: CH.placeholder, 'aria-label': CH.placeholder });
    const status = el('p', { class: 'lab-status', role: 'status' });
    const composer = el('form', { class: 'lab-composer' }, [input, el('button', { type: 'submit', class: 'lab-button', text: CH.send }), status]);
    composer.addEventListener('submit', (event) => { event.preventDefault(); if (input.value.trim()) status.textContent = CH.readOnly; });
    return [
      el('h1', { text: CH.title }),
      el('div', { class: 'lab-messenger' }, [
        el('nav', { class: 'lab-contacts', 'aria-label': CH.title }, el('ul', {}, CH.threads.map((x) => {
          const last = x.messages[x.messages.length - 1];
          const unread = isRead(x.id) ? 0 : x.unread;
          return el('li', {}, el('a', { href: '#chat-' + x.id, 'aria-current': x === t ? 'page' : null }, [
            avatar(x.name),
            el('span', { class: 'lab-contact-name' }, [el('b', { text: x.name }), el('time', { text: last.time.split(' ')[0] })]),
            el('span', { class: 'lab-contact-last' }, [el('span', { text: last.text }), unread ? el('b', { class: 'lab-badge', text: String(unread) }) : null])
          ]));
        }))),
        el('section', { class: 'lab-thread' }, [
        el('header', { class: 'lab-thread-head' }, [el('b', { text: t.name }), el('span', { class: 'lab-tag', text: t.tag })]),
        el('ol', { class: 'lab-chat' }, t.messages.map((m) => {
          // 左右對話：對方在左邊（有頭像），自己在右邊
          return el('li', { class: m.me ? 'is-me' : null }, [
            m.me ? null : avatar(t.name),
            el('p', { class: 'lab-bubble', text: m.text }),
            m.time ? el('time', { class: 'lab-chat-time', text: m.time }) : null
          ]);
        })),
        t.end ? el('p', { class: 'lab-chat-end', text: t.end }) : null,
        composer
      ])
      ]),
      home
    ];
  }

  // 加密文件：密碼的提示是一行點字，解開後記下事件（content.js 的 lab.files）。底下的連結回到掛著它的內部文件
  function renderFile(file) {
    const from = L.docs.find((d) => d.blocks.some((b) => b.type === 'file' && b.id === file.id));
    const home = el('p', {}, from ? el('a', { href: '#doc-' + from.id, text: from.title }) : el('a', { href: '#staff', text: T.toStaff }));
    if (!member()) return [el('p', { text: T.needLogin }), home];
    if (lib.hasEvent(P.load(), file.event)) {
      const body = window.EyeDom.paras(file.paragraphs);
      return [el('h1', { text: file.title }), file.big ? el('div', { class: 'lab-maxim' }, body) : body, home].flat();
    }
    return [el('h1', { text: file.title }), lockForm(file), home];
  }

  // 上鎖的表單：加密文件（lab.files）和上了鎖的內部文件（lab.docs）共用。
  // item 是 { code 密碼, event 打開後記下的事件, hint 提示（選填）, hintBraille 點字提示（選填） }
  function lockForm(item) {
    const code = el('input', { type: 'text', id: 'lab-file-code', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
    const status = el('p', { class: 'lab-status', role: 'status' });
    const form = el('form', { class: 'lab-member' }, [
      el('h2', { text: F.locked }),
      item.hint ? el('p', { text: item.hint }) : null,
      item.hintBraille ? el('p', { class: 'lab-braille', lang: 'zxx', text: item.hintBraille }) : null,
      el('label', { for: 'lab-file-code', text: F.codeLabel }), code,
      el('button', { type: 'submit', class: 'lab-button', text: F.button }),
      status
    ]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!P.openLock(item, code.value).ok) { status.textContent = F.wrong; return; }
      if (window.EyeEffects) window.EyeEffects.refresh(); // 解開文件帶來的眼疾效果，馬上套用
      route();
    });
    return form;
  }

  window.addEventListener('hashchange', route);
  route();
})();
