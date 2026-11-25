(function () {
  const C = window.EYE_CONTENT;
  const P = window.EyeProgress;
  const L = window.EyeProgressLib;
  const { el } = window.EyeDom;
  const list = document.querySelector('.notice ol');
  if (!C || !P || !list) return;
  const grid = document.getElementById('type-grid');
  if (grid) grid.replaceChildren(...Object.values(C.result.types).map((type) => el('article', { class: 'type-card' }, [
    el('h3', { class: 'type-name', text: type.name }),
    el('p', { class: 'type-quote', text: `「${type.tagline}」` }),
    el('ul', { class: 'tags' }, type.tags.map((tag) => el('li', { text: tag })))
  ])));
  const progress = P.load();
  const notices = (C.notices || []).filter((n) => L.hasEvent(progress, n.requires));
  if (!notices.length) return;
  const today = L.todayISO();
  const items = notices.map((n, i) => ({ notice: n, date: P.noticeDate(n.id, today), order: i }));
  items.sort((a, b) => (a.date === b.date ? b.order - a.order : a.date < b.date ? 1 : -1));
  items.reverse().forEach(({ notice, date }) => {
    const li = el('li', { 'data-notice': notice.id }, [
      el('time', { datetime: date, text: L.isoToDots(date) }),
      notice.text,
      notice.link ? el('a', { href: notice.link.href, text: notice.link.text }) : null
    ]);
    list.prepend(li);
  });
})();
