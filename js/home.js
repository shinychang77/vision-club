// 首頁：四種類型的貼紙卡（content.js 的 result.types）；
// 對應的事件發生後（例如通關），在「最新公告」最上面加入公告（content.js 的 notices）
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
  // 新的在上面；同一天的依 content.js 裡的順序，排後面的算比較新
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
