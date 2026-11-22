// 結果頁：結果卡（canvas 畫的一張圖，畫面顯示和下載 PNG 共用）與分享文字。文案與欄位設定在 content.js 的 result
(function () {
  const C = window.EYE_CONTENT;
  const P = window.EyeProgress;
  const L = window.EyeProgressLib;
  const { el } = window.EyeDom;
  const app = document.getElementById('result-app');
  if (!C || !P || !app) return;
  const R = C.result;

  document.getElementById('page-title').textContent = R.title;
  const progress = P.load();

  if (!L.isNormalComplete(progress, C)) {
    app.replaceChildren(el('div', { class: 'panel' }, [
      el('p', { text: R.incompleteText }),
      el('div', { class: 'actions' }, el('a', { class: 'button', href: 'quiz.html', text: R.incompleteLink }))
    ]));
    return;
  }

  // ---- 結局 ----
  // 主線的異常題全選了異常答案：不出結果卡，改出最後的警告和最後一題（文字在 content.js 的 ending）。
  // 選了就看到對應的結局；按「返回」或瀏覽器的上一頁回到題目，可以改選另一個。選了什麼不會存起來
  if (C.ending && L.endingReady(progress, C)) {
    const E = C.ending;
    // 警告一句一個錯誤視窗：遇到 。？！ 或換行就切成一句
    const lines = String(E.warning).split(/\n+/).flatMap((p) => p.match(/[^。？！?!]+[。？！?!]*/g) || []).map((s) => s.trim()).filter(Boolean);
    let warned = false; // 這一頁只跳一輪；按「返回」回到題目時不再跳
    const show = () => {
      const key = location.hash === '#yes' ? 'yes' : location.hash === '#no' ? 'no' : '';
      const end = E.endings[key];
      document.body.dataset.ending = key;
      if (end && E.event) window.EyeProgress.addEvent(E.event); // 看過結局＝通關，解開通關後的彩蛋
      // 選「是」的結局：眼疾效果在這一頁暫時消失；離開這一頁就恢復
      if (window.EyeEffects) { if (key === 'yes') window.EyeEffects.apply([]); else window.EyeEffects.refresh(); }
      // 第一次來：先一個一個跳錯誤視窗，全部按掉才出現最後一題
      if (!end && !warned) { warned = true; app.replaceChildren(); popups(lines, show); return; }
      app.replaceChildren(el('div', { class: 'panel ending' }, end ? [
        el('h2', { text: end.title }),
        ...window.EyeDom.paras(end.text),
        ...(E.after ? afterEnding(E.after, end) : []),
        el('div', { class: 'actions' }, el('a', { class: 'button button-secondary', href: '#', text: E.back }))
      ] : [
        el('h2', { text: E.question }),
        el('div', { class: 'actions' }, [
          // 「是」留在眼睛這邊（紅色），「否」走向另一邊（點狀）
          el('a', { class: 'button', href: '#yes', text: E.yes }), window.EyeDom.arrow('red'),
          el('a', { class: 'button', href: '#no', text: E.no }), window.EyeDom.arrow('dots')
        ])
      ]));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', show);
    show();
    return;
  }

  // 錯誤視窗：一次一個，按「確定」換下一句，每個稍微錯開一點。掛在 <html> 底下，眼疾效果蓋不到。全部按完呼叫 done
  function popups(list, done) {
    const E = C.ending;
    const shade = el('div', { class: 'ending-shade' });
    document.documentElement.append(shade);
    let i = 0;
    const next = () => {
      if (i >= list.length) { shade.remove(); done(); return; }
      const ok = el('button', { type: 'button', text: E.popupOk, onclick: () => { i += 1; next(); } });
      const box = el('div', { class: 'ending-popup', role: 'alertdialog', 'aria-modal': 'true', 'aria-label': E.popupTitle }, [
        el('div', { class: 'ending-popup-bar' }, [el('span', { text: E.popupTitle }), el('span', { 'aria-hidden': 'true', text: '✕' })]),
        el('div', { class: 'ending-popup-body' }, [el('span', { class: 'ending-popup-icon', 'aria-hidden': 'true', text: '✕' }), el('p', { text: list[i] })]),
        el('div', { class: 'ending-popup-foot' }, ok)
      ]);
      box.style.transform = `translate(${(i % 4) * 22 - 33}px, ${(i % 4) * 18 - 27}px)`;
      shade.replaceChildren(box);
      ok.focus();
    };
    next();
  }

  // 結局內文下方：注意事項＋彩蛋入口、0 號使者的話（點了展開）、神奇眼藥水（切換眼疾效果）。end.noLetter 的結局沒有 0 號使者的話
  function afterEnding(A, end) {
    const drops = el('button', { type: 'button', class: 'button button-small ending-eyedrops' });
    const paint = () => {
      const on = !!P.load().ui.eyedrops;
      drops.textContent = on ? A.eyedropsOn : A.eyedrops;
      drops.setAttribute('aria-pressed', String(on));
    };
    drops.addEventListener('click', () => {
      P.setEyedrops(!P.load().ui.eyedrops);
      paint();
      if (window.EyeEffects) window.EyeEffects.refresh();
    });
    paint();
    return [
      el('p', { class: 'ending-notice' }, [A.notice + ' ', el('a', { href: A.link.href, text: A.link.text })]),
      // 眼藥水放在 0 號使者的話裡面：點開「來自 0 號使者」才看得到，接在第一個 >> 的右邊
      end.noLetter ? null : el('details', { class: 'ending-letter' }, [el('summary', { text: A.from }), ...letterParagraphs(A.letter, drops)])
    ];
  }

  // 0 號使者的話：按鈕插在第一個 >> 後面，沒有 >> 就放在最後
  function letterParagraphs(text, button) {
    let placed = false;
    const out = String(text).split(/\n[ \t\u3000]*\n/).map((para) => {
      const m = placed ? null : para.match(/>{2,}/);
      if (!m) return el('p', { class: 'txt', text: para });
      placed = true;
      const cut = m.index + m[0].length;
      // >> 和按鈕包在一起不斷行，按鈕才一定在 >> 右邊
      return el('p', { class: 'txt' }, [para.slice(0, m.index), el('span', { class: 'ending-drops-line' }, [m[0] + ' ', button]), para.slice(cut)]);
    });
    return placed ? out : out.concat(button);
  }

  // ---- 欄位內容 ----
  const percent = L.scorePercent(progress, C);
  const level = R.levels.find((l) => percent >= l.minPercent) || R.levels[R.levels.length - 1];
  const type = R.types[L.resultType(progress, C)];
  const age = progress.profile.age;
  const group = age === null ? null : R.ageGroups.find((g) => age <= g.upTo);
  const values = {
    nickname: progress.profile.nickname || R.anonymousName,
    score: String(percent),
    type: type.name,
    tagline: type.tagline,
    level: level.title,
    ageGroup: group ? group.label : R.ageUnknown,
    date: L.isoToDots(L.todayISO()),
    subjectId: progress.subjectId
  };
  // 解鎖任一異常題後，指定欄位變成雜訊
  // 支線題不算：只有主線的異常題解鎖了，欄位才會變成雜訊
  const noisy = L.unlockCount(progress, C).n > 0 && R.noise && R.noise.field;
  if (noisy) values[R.noise.field] = noiseText(progress.subjectId + progress.unlocked.join(','), R.noise.chars, R.noise.length);

  const fields = R.cardFields.map((f) => ({ key: f.key, label: f.label, value: values[f.key], noise: noisy === f.key }));
  // 理智值、類型、理智狀態（印章）畫在卡片上半部，其他欄位排在下方
  const heroKeys = ['score', 'type', 'level'];
  const hero = Object.fromEntries(fields.filter((f) => heroKeys.includes(f.key)).map((f) => [f.key, f]));
  const rows = fields.filter((f) => !heroKeys.includes(f.key));

  // ---- 畫面 ----
  const pending = L.pendingAnomalies(progress, C);
  const card = drawCard();
  card.className = 'result-card';
  card.dataset.state = noisy ? 'anomaly' : 'normal';
  card.setAttribute('role', 'img');
  card.setAttribute('aria-label', R.cardTitle + '：' + fields.map((f) => f.label + ' ' + f.value).join('，'));
  const shareText = L.format(R.shareText, Object.assign({ url: R.shareUrl }, values));
  const textBox = el('textarea', { class: 'share-text', rows: 3, readonly: true, 'aria-label': R.shareTextLabel });
  textBox.value = shareText;
  const status = el('p', { class: 'form-status', role: 'status' });

  app.replaceChildren(...[
    pending.length ? el('p', { class: 'hint', 'data-pending': pending.length }, [
      L.format(R.pendingHint, { n: pending.length }) + ' ',
      el('a', { href: 'quiz.html', text: R.pendingLink })
    ]) : null,
    L.lockedCount(progress, C) ? el('p', { class: 'hint', 'data-locked': L.lockedCount(progress, C) },
      L.format(R.lockedHint, { total: L.fullSequence(C).length, n: L.lockedCount(progress, C) })) : null,
    card,
    el('div', { class: 'share' }, [
      textBox,
      el('div', { class: 'actions' }, [
        el('button', { type: 'button', class: 'button', onclick: copyText, text: R.copyButton }),
        el('button', { type: 'button', class: 'button button-secondary', onclick: downloadPng, text: R.downloadButton }),
        el('a', { class: 'text-link', href: 'quiz.html', text: R.retakeLink })
      ]),
      status
    ])
  ].filter(Boolean));

  // 同一個種子永遠產生同一串雜訊
  function noiseText(seed, chars, length) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    const list = Array.from(chars || '▓▒░');
    let out = '';
    for (let i = 0; i < (length || 8); i++) {
      h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
      out += list[(h >>> 0) % list.length];
    }
    return out;
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(shareText);
      status.textContent = R.copyDone;
    } catch (e) {
      // 剪貼簿 API 不能用時（例如部分瀏覽器開本機檔案），改用選取＋複製
      textBox.focus();
      textBox.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      status.textContent = ok ? R.copyDone : R.copyFail;
    }
  }

  // ---- canvas 繪製結果卡（1080×1350，社群直式分享圖比例） ----
  function drawCard() {
    const W = 1080;
    const H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const css = getComputedStyle(document.documentElement);
    const color = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
    const brand = color('--brand', '#17606b');
    const ink = color('--ink', '#1c2b33');
    const muted = color('--muted', '#5b6b74');
    const line = color('--line', '#d8e0e3');
    const tint = color('--tint', '#f2f6f6');
    const accent = '#ffd84d'; // 螢光筆黃，只用在結果卡
    const fontFamily = getComputedStyle(document.body).fontFamily;
    const font = (weight, size) => `${weight} ${size}px ${fontFamily}`;
    const box = (x, y, w, h, r, fill) => { ctx.fillStyle = fill; roundRect(ctx, x, y, w, h, r); ctx.fill(); };

    ctx.fillStyle = brand;
    ctx.fillRect(0, 0, W, H);
    box(40, 40, W - 80, H - 80, 32, '#ffffff');

    // 頁首
    drawEye(ctx, 130, 122, 1.7, brand, ink);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = ink;
    ctx.font = font(700, 38);
    ctx.fillText(R.cardTitle, 190, 120);
    ctx.fillStyle = muted;
    ctx.font = font(400, 26);
    ctx.fillText(R.cardSubtitle, 190, 158);

    // 理智值區塊：大數字＋十格量表，右邊蓋理智狀態的印章
    box(90, 190, 900, 330, 28, brand);
    ctx.save();
    roundRect(ctx, 90, 190, 900, 330, 28);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 255, 255, .07)';
    ctx.lineWidth = 26;
    [80, 150, 220, 290].forEach((r) => { ctx.beginPath(); ctx.arc(860, 330, r, 0, Math.PI * 2); ctx.stroke(); });
    ctx.restore();
    if (hero.score) {
      ctx.fillStyle = 'rgba(255, 255, 255, .85)';
      ctx.font = font(700, 34);
      ctx.fillText(hero.score.label, 140, 252);
      if (hero.score.noise) {
        drawNoise(ctx, hero.score.value, 140, 420, font(700, 110), '#ffffff');
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = font(700, 190);
        ctx.fillText(hero.score.value, 132, 428);
        const width = ctx.measureText(hero.score.value).width;
        ctx.fillStyle = 'rgba(255, 255, 255, .7)';
        ctx.font = font(700, 48);
        ctx.fillText(R.scoreUnit, 132 + width + 12, 428);
      }
      const filled = hero.score.noise ? 0 : Math.round(percent / 10);
      for (let i = 0; i < 10; i++) box(140 + i * 81, 462, 69, 28, 8, i < filled ? accent : 'rgba(255, 255, 255, .22)');
    }
    if (hero.level) {
      ctx.save();
      ctx.translate(800, 290);
      ctx.rotate(-0.14);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = font(700, 50);
      const width = ctx.measureText(hero.level.value).width + 56;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 6;
      roundRect(ctx, -width / 2, -46, width, 92, 14);
      ctx.stroke();
      if (hero.level.noise) drawNoise(ctx, hero.level.value, 0, 4, font(700, 50), '#ffffff');
      else { ctx.fillStyle = accent; ctx.fillText(hero.level.value, 0, 4); }
      ctx.restore();
    }

    // 類型：名稱畫螢光筆，下面是台詞、說明、標籤
    let y = 600;
    ctx.textAlign = 'center';
    ctx.fillStyle = muted;
    ctx.font = font(400, 34);
    ctx.fillText(R.typeLead, W / 2, y);
    y += 145;
    if (hero.type) {
      if (hero.type.noise) {
        drawNoise(ctx, hero.type.value, W / 2, y, font(700, 100), muted);
      } else {
        ctx.font = font(700, 136);
        const width = ctx.measureText(hero.type.value).width;
        ctx.fillStyle = accent;
        ctx.fillRect(W / 2 - width / 2 - 24, y - 50, width + 48, 64);
        ctx.fillStyle = ink;
        ctx.fillText(hero.type.value, W / 2, y);
      }
    }
    y += 30;
    ctx.fillStyle = brand;
    ctx.font = font(700, 40);
    wrapLines(ctx, '「' + type.tagline + '」', W - 240).slice(0, 2).forEach((text) => { y += 56; ctx.fillText(text, W / 2, y); });
    y += 14;
    ctx.fillStyle = muted;
    ctx.font = font(400, 31);
    wrapLines(ctx, type.text, W - 240).slice(0, 3).forEach((text) => { y += 46; ctx.fillText(text, W / 2, y); });

    // 標籤：一排膠囊，放不下的省略
    y += 34;
    ctx.font = font(700, 28);
    ctx.textBaseline = 'middle';
    const tags = [];
    let total = 0;
    (type.tags || []).forEach((text) => {
      const width = ctx.measureText(text).width + 44;
      if (total + width > W - 200) return;
      tags.push({ text, width });
      total += width + 14;
    });
    let x = (W - total + 14) / 2;
    tags.forEach((t) => {
      box(x, y, t.width, 52, 26, tint);
      ctx.fillStyle = brand;
      ctx.fillText(t.text, x + t.width / 2, y + 27);
      x += t.width + 14;
    });
    ctx.textBaseline = 'alphabetic';

    // 其他欄位：兩欄小字，從底部往上排
    const top = 1237 - Math.ceil(rows.length / 2) * 76;
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(110, top - 13);
    ctx.lineTo(W - 110, top - 13);
    ctx.stroke();
    ctx.textAlign = 'left';
    rows.forEach((f, i) => {
      const cx = 110 + (i % 2) * 450;
      const cy = top + Math.floor(i / 2) * 76;
      ctx.fillStyle = muted;
      ctx.font = font(400, 24);
      ctx.fillText(f.label, cx, cy + 26);
      if (f.noise) drawNoise(ctx, f.value, cx, cy + 62, font(700, 30), muted);
      else { ctx.fillStyle = ink; ctx.font = font(700, 30); ctx.fillText(f.value, cx, cy + 62, 410); }
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = brand;
    ctx.font = font(700, 28);
    ctx.fillText(R.cardCta + '　' + R.shareUrl, W / 2, 1282);

    // 年紀越小整張越暗（設定在 content.js 的 result.dimBelowAge、dimPerYear）
    const dim = age === null ? 0 : Math.max(0, (R.dimBelowAge || 0) - age) * (R.dimPerYear || 0);
    if (dim > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(dim, 1)})`;
      ctx.fillRect(0, 0, W, H);
    }
    return canvas;
  }

  function drawNoise(ctx, text, x, y, fontSpec, base) {
    ctx.font = fontSpec;
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#c0102a';
    ctx.fillText(text, x - 4, y);
    ctx.fillStyle = '#1a8a9c';
    ctx.fillText(text, x + 4, y + 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = base;
    ctx.fillText(text, x, y);
  }

  function drawEye(ctx, cx, cy, s, brand, ink) {
    ctx.save();
    ctx.translate(cx - 24 * s, cy - 24 * s);
    ctx.scale(s, s);
    // 刻度環與虹膜纖維：把圓周平均切成 count 段，每段只畫 ratio 的比例
    const dashedRing = (r, width, count, ratio, color) => {
      const step = 2 * Math.PI * r / count;
      ctx.save();
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.setLineDash([step * ratio, step * (1 - ratio)]);
      ctx.beginPath();
      ctx.arc(24, 24, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };
    const disc = (x, y, r, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    dashedRing(22.5, 2.4, 60, 0.34, brand);
    const eye = new Path2D(window.EyeLogo.shape);
    ctx.fillStyle = '#ffffff';
    ctx.fill(eye);
    ctx.save();
    ctx.clip(eye);
    disc(24, 24, 9, brand);
    ctx.globalAlpha = 0.75;
    dashedRing(6.4, 4.2, 48, 0.4, '#7fb4b8');
    ctx.globalAlpha = 1;
    disc(24, 24, 3.4, ink);
    disc(26.6, 21.4, 1.2, '#ffffff');
    ctx.restore();
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = brand;
    ctx.stroke(eye);
    ctx.fillStyle = ink;
    ctx.fill(new Path2D(window.EyeLogo.lid));
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 中文沒有空格可斷行，逐字累加到超過寬度就換行
  function wrapLines(ctx, text, maxWidth) {
    const lines = [];
    let current = '';
    Array.from(text).forEach((ch) => {
      if (ctx.measureText(current + ch).width > maxWidth && current) { lines.push(current); current = ch; }
      else current += ch;
    });
    if (current) lines.push(current);
    return lines;
  }

  function downloadPng() {
    const canvas = card;
    const save = (href, done) => {
      const a = el('a', { href, download: R.downloadName });
      document.body.append(a);
      a.click();
      a.remove();
      if (done) setTimeout(done, 1000);
    };
    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (!blob) return save(canvas.toDataURL('image/png'));
        const url = URL.createObjectURL(blob);
        save(url, () => URL.revokeObjectURL(url));
      }, 'image/png');
    } else {
      save(canvas.toDataURL('image/png'));
    }
  }
})();
