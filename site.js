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
const logo = document.querySelector('.site-header .logo');
const pupil = logo && logo.querySelector('.logo-pupil');
const MAX_X = 8;
const MAX_Y = 2;
const EASE_DISTANCE = 160;
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
  paras(text, cls) {
    return String(text || '').split(/\n[ \t　]*\n/).map((t) => window.EyeDom.el('p', { class: cls ? cls + ' txt' : 'txt' }, window.EyeDom.rich(t)));
  },
  rich(text) {
    return String(text || '').split(/\[\[(.+?)\]\]/).map((part, i) => (i % 2 ? window.EyeDom.el('span', { class: 'oph', text: part }) : part)).filter((x) => x !== '');
  },
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
const siteSearch = document.getElementById('site-search');
if (siteSearch) {
  siteSearch.addEventListener('submit', (event) => {
    event.preventDefault();
    const q = document.getElementById('site-q').value.trim();
    if (window.EyeSiteSearch) window.EyeSiteSearch(q);
    else if (q) location.href = 'wiki.html#q=' + encodeURIComponent(q);
  });
}
document.addEventListener('DOMContentLoaded', () => {
  const text = window.EYE_CONTENT && window.EYE_CONTENT.credit;
  const foot = document.querySelector('.site-footer .footer-inner, #lab-footer, #fs-foot');
  if (!text || !foot) return;
  const p = document.createElement('p');
  p.className = 'site-credit';
  p.textContent = text;
  p.setAttribute('style', 'margin:8px 0 0;font-size:12px;opacity:.65;');
  foot.append(p);
});
document.addEventListener('DOMContentLoaded', () => {
  const T = window.EYE_CONTENT && window.EYE_CONTENT.mobileNotice;
  if (!T) return;
  const ua = navigator.userAgent;
  const mobile = (navigator.userAgentData && navigator.userAgentData.mobile) ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ||
    (matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches);
  if (!mobile) return;
  try { if (localStorage.getItem('eye:mobile-notice')) return; } catch (e) {   }
  const shade = document.createElement('div');
  shade.setAttribute('style', 'position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.45);');
  const box = document.createElement('div');
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', T.title);
  box.setAttribute('style', 'width:min(360px,100%);padding:22px 20px 16px;border-radius:12px;background:#fff;color:#1f2328;box-shadow:0 8px 32px rgba(0,0,0,.3);font:15px/1.7 "Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif;text-align:center;');
  const h = document.createElement('p');
  h.textContent = T.title;
  h.setAttribute('style', 'margin:0 0 8px;font-size:18px;font-weight:700;');
  box.append(h);
  T.text.split('\n').forEach((line) => {
    const p = document.createElement('p');
    p.textContent = line;
    p.setAttribute('style', 'margin:0 0 6px;text-align:left;');
    box.append(p);
  });
  const ok = document.createElement('button');
  ok.type = 'button';
  ok.textContent = T.ok;
  ok.setAttribute('style', 'margin-top:10px;padding:8px 28px;border:0;border-radius:999px;background:#17606b;color:#fff;font:inherit;cursor:pointer;');
  ok.addEventListener('click', () => {
    try { localStorage.setItem('eye:mobile-notice', '1'); } catch (e) {   }
    shade.remove();
  });
  box.append(ok);
  shade.append(box);
  document.documentElement.append(shade);
  ok.focus();
});
