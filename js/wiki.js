(function () {
  const C = window.EYE_CONTENT;
  const P = window.EyeProgress;
  const L = window.EyeProgressLib;
  const { el } = window.EyeDom;
  const app = document.getElementById('wiki-app');
  if (!C || !P || !app) return;
  const W = C.wiki;
  document.getElementById('page-title').textContent = W.title;
  document.getElementById('page-intro').textContent = W.intro;
  document.getElementById('wiki-index-title').textContent = W.historyTitle;
  const searchInput = document.getElementById('site-q');
  const results = document.getElementById('wiki-results');
  const historyList = document.getElementById('wiki-index-list');
  const link = (entry) => el('a', { href: entry.href || '#' + entry.id, target: '_blank', rel: 'noopener', text: entry.title });
  const isExtra = (entry) => !entry.href && entry.category !== '新聞' && entry.category !== '公告';
  const foundEntries = () => P.load().wiki.found.map((id) => W.entries.find((e) => e.id === id)).filter(Boolean);
  function renderHistory() {
    const found = foundEntries().filter((e) => !isExtra(e)).reverse();
    historyList.replaceChildren(...(found.length
      ? found.map((entry) => el('li', {}, [link(entry), el('small', { text: entry.summary })]))
      : [el('li', { class: 'muted', text: W.historyEmpty })]));
  }
  const norm = (s) => String(s || '').normalize('NFKC').toLowerCase().replace(/\s+/g, '');
  function search(query) {
    const q = norm(query);
    if (!q) return [];
    return W.entries.filter((entry) => {
      const words = [entry.title].concat(entry.keywords || []).map(norm).filter(Boolean);
      return words.some((w) => q.includes(w) || w.includes(q));
    });
  }
  window.EyeSiteSearch = runSearch;
  function runSearch(query) {
    if (!query) { results.replaceChildren(); return; }
    const found = search(query);
    P.recordSearch(query, found.map((entry) => entry.id));
    renderHistory();
    if (!location.hash.slice(1)) app.replaceChildren(renderIndex());
    results.replaceChildren(el('div', { class: 'search-results' }, [
      el('p', { class: 'search-title', text: L.format(W.searchResultTitle, { q: query }) }),
      found.length
        ? el('ul', {}, found.map((entry) => el('li', {}, [link(entry), el('small', { text: entry.summary })])))
        : el('p', { class: 'muted', text: L.format(W.searchEmpty, { q: query }) })
    ]));
  }
  function route() {
    let id = decodeURIComponent(location.hash.slice(1));
    if (id.startsWith('q=')) {
      const q = id.slice(2).trim();
      history.replaceState(null, '', location.pathname);
      searchInput.value = q;
      runSearch(q);
      id = '';
    }
    const entry = W.entries.find((e) => e.id === id);
    if (entry && !P.load().wiki.found.includes(id)) { P.recordSearch('', [id]); renderHistory(); }
    if (entry && entry.href) { location.replace(entry.href); return; }
    if (!id) app.replaceChildren(renderIndex());
    else if (!entry) app.replaceChildren(renderNotFound());
    else app.replaceChildren(renderEntry(entry));
  }
  function renderIndex() {
    const found = foundEntries().filter(isExtra);
    return el('div', { class: 'entry-list' }, [
      el('h2', { text: W.indexTitle }),
      found.length
        ? el('ul', {}, found.map((entry) => el('li', {}, [
          el('span', { class: 'entry-cat', text: entry.category }),
          link(entry),
          el('p', { text: entry.summary })
        ])))
        : el('p', { class: 'muted', text: W.foundEmpty })
    ]);
  }
  function renderNotFound() {
    return el('div', { class: 'panel' }, [
      el('p', { text: W.notFound }),
      el('a', { href: 'wiki.html', text: W.backToIndex })
    ]);
  }
  function renderEntry(entry) {
    return el('article', { class: 'entry', 'data-entry': entry.id }, [
      el('p', { class: 'entry-cat', text: entry.category }),
      el('h2', { text: entry.title }),
      el('p', { class: 'entry-meta', text: `${W.updatedLabel} ${L.isoToDots(entry.updated)}` }),
      ...entry.blocks.flatMap(renderBlock),
      el('p', {}, el('a', { href: 'wiki.html', text: W.backToIndex })),
      isExtra(entry) ? el('p', { class: 'entry-order', text: L.format(W.foundOrder, foundOrder(entry)) }) : null
    ]);
  }
  function foundOrder(entry) {
    const found = foundEntries().filter(isExtra);
    return { n: found.indexOf(entry) + 1 || found.length + 1, total: W.entries.filter(isExtra).length };
  }
  function renderBlock(block) {
    switch (block.type) {
      case 'h': return el('h3', { text: block.text });
      case 'p': return window.EyeDom.paras(block.text);
      case 'red': return el('p', { class: 'red-text', text: block.text });
      case 'img': return el('figure', { class: 'post-img entry-img' }, [
        el('a', { href: block.src, target: '_blank', rel: 'noopener' }, el('img', { src: block.src, alt: block.alt })),
        block.caption ? el('figcaption', { text: block.caption }) : null
      ]);
      case 'refs': return el('ol', { class: 'refs' }, block.items.map((item) => el('li', { text: item })));
      case 'clarity': return renderClarity(block);
      default: return null;
    }
  }
  function renderClarity(block) {
    const image = el('div', { class: 'clarity-image', role: 'img', 'aria-label': block.alt });
    if (block.src) image.append(el('img', { src: block.src, alt: '' }));
    else image.innerHTML = block.svg;
    if (block.requires && !L.hasEvent(P.load(), block.requires)) {
      return el('figure', { class: 'clarity' }, [el('div', { class: 'clarity-frame' }, image), el('figcaption', { text: block.lockedCaption || block.caption })]);
    }
    const reveal = el('div', { class: 'clarity-reveal', 'aria-hidden': 'true' });
    const fillReveal = () => reveal.replaceChildren(el('p', { class: 'ink-text', lang: 'la' }, window.EyeDom.rich(block.revealText)));
    reveal.addEventListener('transitionend', () => {
      if (!reveal.classList.contains('is-shown')) reveal.replaceChildren();
    });
    const output = el('output', { class: 'clarity-value' });
    const slider = el('input', { type: 'range', min: 0, max: 100, step: 1, value: 100, id: 'clarity-slider' });
    function apply() {
      const value = Number(slider.value);
      image.style.filter = value >= 100 ? 'none' : `blur(${((100 - value) / 100 * block.maxBlur).toFixed(2)}px)`;
      output.textContent = value + '%';
      const shown = !!block.revealText && value < block.revealBelow;
      if (shown && !reveal.children.length) {
        fillReveal();
        void reveal.offsetWidth;
      }
      reveal.classList.toggle('is-shown', shown);
      reveal.setAttribute('aria-hidden', shown ? 'false' : 'true');
    }
    slider.addEventListener('input', apply);
    apply();
    return el('figure', { class: 'clarity' }, [
      el('div', { class: 'clarity-frame' }, [image, reveal]),
      el('div', { class: 'clarity-control' }, [
        el('label', { for: slider.id, text: block.label }),
        slider,
        output
      ]),
      el('figcaption', { text: block.caption })
    ]);
  }
  window.addEventListener('hashchange', () => { route(); window.scrollTo(0, app.getBoundingClientRect().top + window.scrollY - 16); });
  renderHistory();
  route();
})();
