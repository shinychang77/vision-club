// 教團網站：內容見 content.js 的 cult。
// 要先在研究單位網站的搜尋框輸入暗號（記成事件 lab.search.event）才看得到，否則偽裝成找不到頁面。
// 網址：index.html 是首頁，index.html#file-文件id 是成員留下的文件（要在首頁搜尋那個人的名字才找得到連結），index.html#zone 是使者專區
(function () {
  'use strict';
  const C = window.EYE_CONTENT;
  const P = window.EyeProgress;
  const lib = window.EyeProgressLib;
  const app = document.getElementById('fellowship-app');
  if (!C || !C.cult || !P || !app || !window.EyeDom) return;
  const { el } = window.EyeDom;
  const K = C.cult;
  const T = K.search;
  const Z = K.zone;

  if (!lib.hasEvent(P.load(), C.lab.search.event)) {
    document.body.classList.add('fs-missing'); // 偽裝成普通的找不到頁面，不要露出燭光的樣子
    app.replaceChildren(el('h1', { text: K.missing.title }), el('p', { text: K.missing.text }));
    return;
  }

  document.title = K.name;

  // 燭光：整頁的暗由 .fs-dark 蓋著，亮的那一圈跟著滑鼠走；用鍵盤時跟著焦點走
  const dark = el('div', { class: 'fs-dark', 'aria-hidden': 'true' });
  document.documentElement.append(dark); // 掛在 <body> 外面：眼疾效果會在 body 加濾鏡，裡面的 fixed 元素就不會貼著螢幕了
  const light = (x, y) => { dark.style.setProperty('--mx', x + 'px'); dark.style.setProperty('--my', y + 'px'); };
  window.addEventListener('pointermove', (e) => light(e.clientX, e.clientY), { passive: true });
  document.addEventListener('focusin', (e) => { const r = e.target.getBoundingClientRect(); light(r.left + r.width / 2, r.top + r.height / 2); });
  // 從研究中心的墨滴過來（lab/lab.js 記下的）：畫面先是一片暗紅，再慢慢退成燭光
  try {
    if (sessionStorage.getItem('eye:cross')) { sessionStorage.removeItem('eye:cross'); document.documentElement.append(el('div', { class: 'fs-arrive', 'aria-hidden': 'true' })); }
  } catch (e) { /* 無痕模式之類讀不到就算了 */ }

  // 頁首、導覽列、頁尾：照研究中心網站的樣子翻版。首頁是聚會告示牆（範例見 dev/cult-layouts.html 的 B）
  const B = K.board;
  document.getElementById('fs-name').textContent = K.name;
  document.getElementById('fs-foot').textContent = K.footer;
  const navLinks = [['', B.nav], ['#about', K.aboutNav], ['#zone', Z.link]].map(([hash, text]) => el('a', { href: hash || '#', 'data-hash': hash, text }));
  document.getElementById('fs-nav').replaceChildren(...navLinks);

  function route() {
    const file = K.files.find((x) => location.hash === '#file-' + x.id);
    const area = B.areas.find((x) => location.hash === '#area-' + x.id);
    const person = (K.people || []).find((x) => location.hash === '#person-' + x.id);
    const view = file ? renderFile(file) : area ? renderArea(area) : person ? renderPerson(person)
      : location.hash.startsWith('#search=') ? renderResults(decodeURIComponent(location.hash.slice(8)))
      : location.hash === '#zone' ? renderZone() : location.hash === '#about' ? renderAbout() : renderHome();
    app.replaceChildren(...view.filter(Boolean)); // 沒有表格的文件會有空項目，要濾掉
    const here = file || area || person ? null : location.hash.replace(/^#$/, ''); // 文件頁、團契裡的地方不算導覽列上的任何一頁
    navLinks.forEach((a) => a.setAttribute('aria-current', a.dataset.hash === here ? 'page' : 'false'));
    window.scrollTo(0, 0);
  }

  // ---- 首頁：聚會告示牆 ----
  // 倒數 → 誰剛做了什麼（跑馬燈）→ 這一週的行事曆 → 成員貼的紙條和照片
  let timer = null;
  function renderHome() {
    const label = el('p', { class: 'fs-count-label' });
    const count = el('p', { class: 'fs-count', 'aria-live': 'off' });
    clearInterval(timer);
    // 聚會進行中就不倒數，改成已經到了幾個人
    const tick = () => {
      const m = meeting();
      label.textContent = m.live ? B.liveLabel : B.countdownLabel;
      count.textContent = m.live ? lib.format(B.live, { n: m.n }) : m.text;
      count.classList.toggle('is-live', m.live);
    };
    tick();
    timer = setInterval(() => { if (count.isConnected) tick(); else clearInterval(timer); }, 1000);
    const rsvp = el('button', { type: 'button', class: 'fs-rsvp', text: B.rsvp, onclick: () => { rsvp.textContent = B.rsvpDone; rsvp.disabled = true; } });
    return [
      el('section', { class: 'fs-hero' }, [
        el('div', {}, [
          el('p', { class: 'fs-kicker', text: K.kicker }),
          label,
          count,
          ...window.EyeDom.paras(B.when),
          rsvp
        ]),
        K.photo ? figures([K.photo]) : null
      ]),
      ticker(),
      el('ol', { class: 'fs-week', 'aria-label': B.weekLabel }, B.week.map((d) => el('li', { class: d.text ? 'is-on' : null }, [el('b', { text: d.day }), d.text || '']))),
      el('section', { class: 'fs-areas', 'aria-label': B.areasTitle }, [
        el('h2', { text: B.areasTitle }),
        el('ul', {}, B.areas.map((a) => el('li', {}, el('a', { href: '#area-' + a.id }, [
          el('b', { text: a.title }), el('span', { text: a.desc }), el('small', { text: a.now })
        ]))))
      ]),
      el('section', { class: 'fs-wall', 'aria-label': B.wallLabel }, B.notes.map((n) => note(n))),
      el('p', { class: 'fs-verse', text: K.verse })
    ];
  }

  // 跑馬燈：從名字和動作隨機組出一則一則的動態，捲出畫面的就拿掉、後面一直接新的，所以不會繞回同一串。
  // 只是字，點不進去（玩家好奇就自己去搜尋）。滑鼠移上去會停下來，方便讀
  function ticker() {
    const X = B.ticker;
    const box = el('div', { class: 'fs-ticker', role: 'marquee', 'aria-label': B.tickerLabel });
    const track = el('div');
    box.append(track);
    const recent = [];
    let count = 0;
    const pickName = () => {
      const pool = X.names.filter((n) => !recent.includes(n));
      const n = pool[Math.floor(Math.random() * pool.length)];
      recent.push(n);
      if (recent.length > Math.min(X.recent, X.names.length - 2)) recent.shift();
      return n;
    };
    const next = () => {
      count += 1;
      const special = count % X.every === 0;
      const list = special ? X.specials : X.actions;
      const a = list[Math.floor(Math.random() * list.length)];
      const text = a.replace('{name}', () => pickName()).replace('{name2}', () => pickName()).replace('{n}', () => String(1 + Math.floor(Math.random() * 5)));
      return el('span', { text });
    };
    let x = 0;
    let paused = false;
    let last = 0;
    const fill = () => { while (track.scrollWidth + x < box.clientWidth * 2) track.append(next()); };
    box.addEventListener('mouseenter', () => { paused = true; });
    box.addEventListener('mouseleave', () => { paused = false; });
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = (now) => {
      if (!box.isConnected) return; // 換頁了就停
      const dt = last ? Math.min(now - last, 100) : 0;
      last = now;
      if (!paused && !still) x -= dt * 0.04; // 每秒 40px
      const first = track.firstElementChild;
      if (first && -x > first.offsetWidth) { x += first.offsetWidth; first.remove(); }
      fill();
      track.style.transform = `translateX(${x}px)`;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return box;
  }

  // 牆上的一張紙條
  function note(n, extra) {
    return el('div', { class: ['fs-note', n.red ? 'is-red' : '', extra || ''].join(' ').trim() }, [
      n.image ? el('img', { src: n.image.src, alt: n.image.alt, loading: 'lazy' }) : null,
      ...window.EyeDom.paras(n.text),
      el('small', { text: n.by ? '— ' + n.by : '— ' })
    ]);
  }

  // 聚會：B.meetDay 星期幾、B.meetHour 幾點開始，進行 B.meetMinutes 分鐘。
  // 進行中回傳 { live: true, n 已經到的人數 }（照開始了多久算，重新整理也不會亂跳），不然回傳倒數的字
  function meeting() {
    const now = new Date();
    const t = new Date(now);
    t.setHours(B.meetHour, 0, 0, 0);
    t.setDate(t.getDate() + ((B.meetDay - t.getDay() + 7) % 7));
    const passed = (now - t) / 60000 / B.meetMinutes;
    if (passed >= 0 && passed < 1) return { live: true, n: B.liveFrom + Math.floor((B.liveTo - B.liveFrom) * Math.sqrt(passed)) };
    if (t <= now) t.setDate(t.getDate() + 7);
    let s = Math.floor((t - now) / 1000);
    const d = Math.floor(s / 86400);
    s %= 86400;
    const p = (n) => String(n).padStart(2, '0');
    return { live: false, text: lib.format(B.countdown, { d, hms: `${p(Math.floor(s / 3600))}:${p(Math.floor(s % 3600 / 60))}:${p(s % 60)}` }) };
  }

  // ---- 團契裡的地方：受邀者點得進來，但只看得到一扇關著的門 ----
  function renderArea(a) {
    return [el('div', { class: 'fs-area' }, [ // 整頁置中
      el('p', { class: 'fs-kicker', text: a.now }),
      el('h1', { text: a.title }),
      el('div', { class: 'fs-locked' }, [
        el('p', { class: 'fs-locked-title', text: B.lockedTitle }),
        ...window.EyeDom.paras(B.lockedText)
      ]),
      el('p', { class: 'fs-footer' }, el('a', { href: '#', text: B.lockedBack }))
    ])];
  }

  // ---- 我們是誰：原本首頁的介紹段落 ----
  function renderAbout() {
    return [
      el('h1', { text: K.aboutNav }),
      ...K.sections.map((section) => el('section', { class: 'fs-section' }, [
        el('h2', { text: section.title }),
        ...window.EyeDom.paras(section.paragraphs),
        section.images ? figures(section.images) : null
      ]))
    ];
  }

  // 照片：一張就單獨放，多張排成一列。src 是相對於 fellowship/ 的路徑
  function figures(images) {
    return el('div', { class: 'fs-figures' }, images.map((image) => el('figure', {}, [
      el('img', { src: image.src, alt: image.alt, loading: 'lazy' }),
      image.caption ? el('figcaption', { text: image.caption }) : null
    ])));
  }

  // 找人：頁首右邊，每一頁都有。要完全打對才找得到：文件（keywords，例如林永昇的本名）、團契裡的地方（board.areas 的 keywords）、
  // 成員（跑馬燈的名字，打全名）、使者專區。成員和地方都點得進去，只是受邀者進不了
  function renderSearch() {
    const input = el('input', { type: 'search', id: 'fs-q', autocomplete: 'off', placeholder: T.label, 'aria-label': T.label });
    const form = el('form', { class: 'fs-search', role: 'search' }, [
      el('div', {}, [input, el('button', { type: 'submit', text: T.button })])
    ]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const q = input.value.trim();
      if (q) location.hash = '#search=' + encodeURIComponent(q);
    });
    return form;
  }

  // 搜尋結果頁（#search=關鍵字）：文件、團契裡的地方、人物頁、成員、使者專區。點了開新分頁
  function renderResults(raw) {
    const q = lib.normalizeCode(raw).replace(/^@/, '');
    const hit = (words) => !!q && (words || []).some((k) => lib.normalizeCode(k) === q);
    const found = K.files.filter((file) => hit(file.keywords)).map((file) => ['#file-' + file.id, file.title])
      .concat(B.areas.filter((a) => hit(a.keywords.concat(a.title))).map((a) => ['#area-' + a.id, a.title]))
      .concat((K.people || []).filter((x) => hit([x.name])).map((x) => ['#person-' + x.id, lib.format(T.member, { name: x.name })]))
      .concat(B.ticker.names.filter((name) => hit([name])).map((name) => ['#area-members', lib.format(T.member, { name })]))
      .concat(hit(Z.keywords) ? [['#zone', Z.title]] : []);
    return [
      el('h1', { text: lib.format(T.resultTitle, { q: raw }) }),
      found.length
        ? el('ul', { class: 'fs-results' }, found.map(([href, text]) => el('li', {}, el('a', { href, target: '_blank', rel: 'noopener', text }))))
        : el('p', { class: 'fs-status', text: T.empty }),
      el('p', { class: 'fs-footer' }, el('a', { href: 'index.html', text: T.back }))
    ];
  }

  // 人物頁上的「加入」：按了只說要先成為團契的一員
  function joinButton() {
    const status = el('p', { class: 'fs-status', role: 'status' });
    return el('div', { class: 'fs-join' }, [
      el('button', { type: 'button', class: 'fs-join-button', text: T.join, onclick: () => { status.textContent = T.joinDenied; } }),
      status
    ]);
  }

  // 人物頁（#person-id）：頭像、名字、上線狀態、入會的時間、「加入」按鈕、自我介紹
  function renderPerson(x) {
    return [el('div', { class: 'fs-person' }, [
      el('img', { class: 'fs-avatar', src: x.avatar, alt: x.name }),
      el('h1', { text: x.name }),
      el('p', { class: 'fs-presence' + (x.online ? ' is-online' : '') }, [el('span', { class: 'fs-dot', 'aria-hidden': 'true' }), x.status]),
      el('p', { class: 'fs-joined', text: T.joined + '　' + x.joined }),
      joinButton(),
      el('div', { class: 'fs-bio' }, window.EyeDom.paras(x.bio)),
      el('p', { class: 'fs-footer' }, el('a', { href: 'index.html', text: T.back }))
    ])];
  }

  // 搜到的文件。有 code 的要用密碼打開（打開後記下事件），沒有的直接看
  function renderFile(file) {
    const back = el('p', { class: 'fs-footer' }, el('a', { href: 'index.html', text: T.back }));
    if (!file.code || lib.hasEvent(P.load(), file.event)) {
      const body = [
        el('h1', { text: file.title }),
        file.image ? figures([file.image]) : null,
        ...window.EyeDom.paras(file.paragraphs),
        file.table ? el('div', { class: 'fs-table-wrap' }, el('table', { class: 'fs-table' }, [
          el('thead', {}, el('tr', {}, file.table.head.map((text) => el('th', { text })))),
          el('tbody', {}, file.table.rows.map((row) => el('tr', {}, row.map((text) => el('td', { text })))))
        ])) : null,
        ...(file.after ? window.EyeDom.paras(file.after) : [])
      ].filter(Boolean);
      // paper: true 的文件排成一張紙的樣子（傳單、程序單、講義這類印出來發的東西）
      return file.paper ? [el('div', { class: 'fs-paper' }, body), back] : [...body, back];
    }
    const code = el('input', { type: 'text', id: 'fs-code', autocomplete: 'off', spellcheck: 'false' });
    const status = el('p', { class: 'fs-status', role: 'status' });
    const form = el('form', { class: 'fs-search' }, [
      el('p', { text: file.locked }),
      el('label', { for: 'fs-code', text: T.codeLabel }),
      el('div', {}, [code, el('button', { type: 'submit', text: T.codeButton })]),
      status
    ]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!P.openLock(file, code.value).ok) { status.textContent = T.codeWrong; return; }
      if (window.EyeEffects) window.EyeEffects.refresh(); // 打開文件帶來的眼疾效果，馬上套用
      route();
    });
    return [el('h1', { text: file.title }), form, back];
  }

  // ---- 使者專區：四種眼疾效果都出現、主線異常題全部解鎖才進得去 ----
  function renderZone() {
    const back = el('p', { class: 'fs-footer' }, el('a', { href: 'index.html', text: T.back }));
    const p = P.load();
    if (!lib.messengerReady(p, C)) return [el('h1', { text: Z.title }), el('p', { class: 'fs-status', text: Z.denied }), back];
    const R = Z.roster;
    // 最後一列是玩家自己：最先出現的眼疾效果，照事件發生的順序找第一個
    const first = p.events.map((id) => (C.effects.map.find((m) => m.requires === id) || {}).type).find(Boolean);
    const me = [R.player.year, R.player.name, R.firstSign[first] || '', R.player.pending];
    // 名冊下面留一大段空白，捲到最底下才會碰到這條線
    const end = el('div', { class: 'fs-zone-end', 'aria-hidden': 'true' });
    new IntersectionObserver((entries) => { if (entries[0].isIntersecting) summon(); }).observe(end);
    return [
      el('p', { class: 'fs-kicker', text: Z.title }),
      el('h1', { text: R.title }),
      figures([R.image]),
      ...window.EyeDom.paras(R.paragraphs),
      el('div', { class: 'fs-table-wrap' }, el('table', { class: 'fs-table' }, [
        el('thead', {}, el('tr', {}, R.head.map((text) => el('th', { text })))),
        el('tbody', {}, R.rows.concat([me]).map((row) => el('tr', {}, row.map((text) => el('td', { text })))))
      ])),
      ...window.EyeDom.paras(R.after),
      end
    ];
  }

  // 畫面慢慢變黑，跳出一個問句。按「是」記下事件、回測驗頁；按「否」畫面恢復（再捲到底會再出現）
  function summon() {
    if (document.querySelector('.fs-call')) return;
    const close = () => shade.remove();
    const shade = el('div', { class: 'fs-call' }, el('div', { class: 'fs-call-box', role: 'dialog', 'aria-modal': 'true', 'aria-label': Z.confirm }, [
      el('p', { text: Z.confirm }),
      el('div', {}, [
        el('button', { type: 'button', onclick: () => { P.addEvent(Z.event); location.href = '../quiz.html?call'; }, text: Z.yes }),
        el('button', { type: 'button', onclick: close, text: Z.no })
      ])
    ]));
    document.documentElement.append(shade); // 掛在 <body> 外面，蓋在眼疾效果上面
    requestAnimationFrame(() => requestAnimationFrame(() => shade.classList.add('is-on')));
  }

  document.getElementById('fellowship-back').textContent = K.backToLab;
  document.getElementById('fellowship-top').replaceChildren(renderSearch());
  window.addEventListener('hashchange', route);
  route();
})();
