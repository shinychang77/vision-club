// 眼球 Logo：全站只在這裡定義。頁面放 <span class="logo" data-logo> 就會自動填入
const EYE_SHAPE = 'M5 24 C12 13.5 18 11.5 24 11.5 C30 11.5 36 13.5 43 24 C36 34.5 30 36.5 24 36.5 C18 36.5 12 34.5 5 24 Z';
const EYE_LID = 'M3 24 C11 12 18 9 24 9 C30 9 37 12 45 24 C36 13.5 30 11.5 24 11.5 C18 11.5 12 13.5 3 24 Z';

function mountLogo(node) {
  node.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true">
    <defs><clipPath id="eye-clip"><path d="${EYE_SHAPE}"/></clipPath></defs>
    <circle class="logo-ticks" cx="24" cy="24" r="22.5" pathLength="60"/>
    <path class="logo-white" d="${EYE_SHAPE}"/>
    <g clip-path="url(#eye-clip)">
      <g class="logo-pupil">
        <circle class="logo-iris" cx="24" cy="24" r="9"/>
        <circle class="logo-fibers" cx="24" cy="24" r="6.4" pathLength="48"/>
        <circle class="logo-core" cx="24" cy="24" r="3.4"/>
        <circle class="logo-glint" cx="26.6" cy="21.4" r="1.2"/>
      </g>
    </g>
    <path class="logo-line" d="${EYE_SHAPE}"/>
    <path class="logo-upper" d="${EYE_LID}"/>
  </svg>`;
  return node;
}

window.EyeLogo = { shape: EYE_SHAPE, lid: EYE_LID, mount: mountLogo };
document.querySelectorAll('[data-logo]').forEach(mountLogo);

// 眼球 Logo 跟著游標看
const logo = document.querySelector('.site-header .logo');
const pupil = logo && logo.querySelector('.logo-pupil');
// 瞳孔偏離中心的上限（SVG 單位）。眼睛扁長，上下空間比左右小很多
const MAX_X = 8;
const MAX_Y = 2;
const EASE_DISTANCE = 160; // 游標距離小於此值（px）時，瞳孔偏移會按比例縮小

if (logo && pupil) {
  window.addEventListener('pointermove', (event) => {
    const box = logo.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    const distance = Math.hypot(dx, dy) || 1;
    const shift = Math.min(distance / EASE_DISTANCE, 1);
    pupil.setAttribute('transform', `translate(${dx / distance * shift * MAX_X} ${dy / distance * shift * MAX_Y})`);
  });
}

// 各頁面腳本共用的小工具：建立元素。文字一律用 textContent，不會被當成 HTML
window.EyeDom = {
  el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === false) return;
      if (key === 'text') node.textContent = value;
      else if (key === 'class') node.className = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : value);
    });
    [].concat(children || []).forEach((child) => {
      if (child === null || child === undefined || child === false) return;
      node.append(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  },
  // 一整格內文 → 一段一段的 <p>：空一行是新的一段，只換行就是段落裡換行（.txt 保留換行和連續空格）
  paras(text, cls) {
    return String(text || '').split(/\n[ \t　]*\n/).map((t) => window.EyeDom.el('p', { class: cls ? cls + ' txt' : 'txt' }, window.EyeDom.rich(t)));
  },
  // 文字裡用 [[ ]] 包起來的字畫成紅字：指 OPHANIM（眼睛）的「祂」「祂們」，讓玩家分得出是哪一方。回傳一串可以直接放進元素的子節點
  rich(text) {
    return String(text || '').split(/\[\[(.+?)\]\]/).map((part, i) => (i % 2 ? window.EyeDom.el('span', { class: 'oph', text: part }) : part)).filter((x) => x !== '');
  },
  // 指向選項的箭頭，代表兩股勢力：'dots' 點狀的、'red' 紅色的。只在玩家從使者專區的彈窗過來之後出現。
  // 眼疾效果的濾鏡套在 <body> 上，所以真正看得到的箭頭畫在 <body> 外面、蓋在效果上面，不受影響（眼睛最後的掙扎）；
  // 頁面裡只留一個看不見的佔位，每一格畫面把箭頭對齊到佔位的位置。佔位被拿掉，箭頭也跟著拿掉
  arrow(kind) {
    const make = () => {
      const node = document.createElement('span');
      node.className = 'eye-arrow eye-arrow-' + kind;
      node.setAttribute('aria-hidden', 'true');
      node.innerHTML = '<svg viewBox="0 0 44 20" width="44" height="20"><path d="M42 10H5M13 2L5 10l8 8" fill="none" stroke="currentColor" stroke-width="' +
        (kind === 'dots' ? '3.6" stroke-linecap="round" stroke-dasharray="0 5' : '2.4" stroke-linecap="round" stroke-linejoin="round') + '"/></svg>';
      return node;
    };
    const slot = make();
    slot.style.visibility = 'hidden';
    const shown = make();
    shown.classList.add('eye-arrow-float');
    document.documentElement.append(shown);
    floatingArrows.push([slot, shown]);
    if (floatingArrows.length === 1) requestAnimationFrame(syncArrows);
    return slot;
  }
};

const floatingArrows = [];
function syncArrows() {
  for (let i = floatingArrows.length - 1; i >= 0; i--) {
    const [slot, shown] = floatingArrows[i];
    if (!slot.isConnected) { shown.remove(); floatingArrows.splice(i, 1); continue; }
    const r = slot.getBoundingClientRect();
    shown.style.transform = `translate(${r.left}px, ${r.top}px)`;
  }
  if (floatingArrows.length) requestAnimationFrame(syncArrows);
}

// 頁首右上角的站內搜尋：視界的每一頁都有。送出後到知識庫頁顯示結果；
// 人已經在知識庫頁的話，由 js/wiki.js 直接接手（window.EyeSiteSearch），不換頁。
// 關鍵字放在 # 後面帶過去，不會送到伺服器
const siteSearch = document.getElementById('site-search');
if (siteSearch) {
  siteSearch.addEventListener('submit', (event) => {
    event.preventDefault();
    const q = document.getElementById('site-q').value.trim();
    if (window.EyeSiteSearch) window.EyeSiteSearch(q);
    else if (q) location.href = 'wiki.html#q=' + encodeURIComponent(q);
  });
}
