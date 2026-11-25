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
    document.body.classList.add('fs-missing');
    app.replaceChildren(el('h1', { text: K.missing.title }), el('p', { text: K.missing.text }));
    return;
  }
  document.title = K.name;
  const dark = el('div', { class: 'fs-dark', 'aria-hidden': 'true' });
  document.documentElement.append(dark);
  const light = (x, y) => { dark.style.setProperty('--mx', x + 'px'); dark.style.setProperty('--my', y + 'px'); };
  window.addEventListener('pointermove', (e) => light(e.clientX, e.clientY), { passive: true });
  document.addEventListener('focusin', (e) => { const r = e.target.getBoundingClientRect(); light(r.left + r.width / 2, r.top + r.height / 2); });
  try {
    if (sessionStorage.getItem('eye:cross')) { sessionStorage.removeItem('eye:cross'); document.documentElement.append(el('div', { class: 'fs-arrive', 'aria-hidden': 'true' })); }
  } catch (e) {   }
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
    app.replaceChildren(...view.filter(Boolean));
    const here = file || area || person ? null : location.hash.replace(/^#$/, '');
    navLinks.forEach((a) => a.setAttribute('aria-current', a.dataset.hash === here ? 'page' : 'false'));
    window.scrollTo(0, 0);
  }
  let timer = null;
  function renderHome() {
    const label = el('p', { class: 'fs-count-label' });
    const count = el('p', { class: 'fs-count', 'aria-live': 'off' });
    clearInterval(timer);
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
      if (!box.isConnected) return;
      const dt = last ? Math.min(now - last, 100) : 0;
      last = now;
      if (!paused && !still) x -= dt * 0.04;
      const first = track.firstElementChild;
      if (first && -x > first.offsetWidth) { x += first.offsetWidth; first.remove(); }
      fill();
      track.style.transform = `translateX(${x}px)`;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return box;
  }
  function note(n, extra) {
    return el('div', { class: ['fs-note', n.red ? 'is-red' : '', extra || ''].join(' ').trim() }, [
      n.image ? el('img', { src: n.image.src, alt: n.image.alt, loading: 'lazy' }) : null,
      ...window.EyeDom.paras(n.text),
      el('small', { text: n.by ? '— ' + n.by : '— ' })
    ]);
  }
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
  function renderArea(a) {
    return [el('div', { class: 'fs-area' }, [
      el('p', { class: 'fs-kicker', text: a.now }),
      el('h1', { text: a.title }),
      el('div', { class: 'fs-locked' }, [
        el('p', { class: 'fs-locked-title', text: B.lockedTitle }),
        ...window.EyeDom.paras(B.lockedText)
      ]),
      el('p', { class: 'fs-footer' }, el('a', { href: '#', text: B.lockedBack }))
    ])];
  }
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
  function figures(images) {
    return el('div', { class: 'fs-figures' }, images.map((image) => el('figure', {}, [
      el('img', { src: image.src, alt: image.alt, loading: 'lazy' }),
      image.caption ? el('figcaption', { text: image.caption }) : null
    ])));
  }
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
  function joinButton() {
    const status = el('p', { class: 'fs-status', role: 'status' });
    return el('div', { class: 'fs-join' }, [
      el('button', { type: 'button', class: 'fs-join-button', text: T.join, onclick: () => { status.textContent = T.joinDenied; } }),
      status
    ]);
  }
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
  function renderFile(file) {
    const back = el('p', { class: 'fs-footer' }, el('a', { href: 'index.html', text: T.back }));
    if (!(file.code || file.codeCheck) || lib.isOpen(P.load(), file)) {
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
      if (window.EyeEffects) window.EyeEffects.refresh();
      route();
    });
    return [el('h1', { text: file.title }), form, back];
  }
  function renderZone() {
    const back = el('p', { class: 'fs-footer' }, el('a', { href: 'index.html', text: T.back }));
    const p = P.load();
    if (!lib.messengerReady(p, C)) return [el('h1', { text: Z.title }), el('p', { class: 'fs-status', text: Z.denied }), back];
    const R = Z.roster;
    const first = p.events.map((id) => (C.effects.map.find((m) => m.requires === id) || {}).type).find(Boolean);
    const me = [R.player.year, R.player.name, R.firstSign[first] || '', R.player.pending];
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
    document.documentElement.append(shade);
    requestAnimationFrame(() => requestAnimationFrame(() => shade.classList.add('is-on')));
  }
  document.getElementById('fellowship-back').textContent = K.backToLab;
  document.getElementById('fellowship-top').replaceChildren(renderSearch());
  window.addEventListener('hashchange', route);
  route();
})();
