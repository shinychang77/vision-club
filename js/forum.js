// 論壇：分區與文章列表、文章內文與留言、登入（內容見 content.js 的 forum）
// 網址：forum.html 是列表（第一個分區），forum.html#board-分區id 是切到那個分區，forum.html#文章id 是文章，forum.html#login 是登入
// 玩家沒有自己的帳號，登入只是謎題的鎖：上鎖的文章要用指定帳號登入才看得到
(function () {
  const C = window.EYE_CONTENT;
  const P = window.EyeProgress;
  const L = window.EyeProgressLib;
  const { el } = window.EyeDom;
  const app = document.getElementById('forum-app');
  if (!C || !P || !app || !C.forum) return;
  const F = C.forum;
  const T = F.ui;

  document.title = `${F.name}｜視界同好會`;
  document.getElementById('page-title').textContent = F.name;
  document.getElementById('page-intro').textContent = F.intro;
  const userBar = document.getElementById('forum-user');

  const currentAccount = () => F.accounts.find((a) => a.id === P.load().forum.user) || null;
  const nameOf = (account) => `${account.nickname}（@${account.id}）`;
  // 從文章回列表時，回到那篇文章所在的分區
  const backLink = (post) => el('p', {}, el('a', { href: post ? '#board-' + post.board : 'forum.html', text: T.back }));
  const countComments = (list) => (list || []).reduce((n, c) => n + 1 + countComments(c.replies), 0);

  // ---- 作者：「暱稱（@帳號）」拆成暱稱與帳號。拆不開的（例如「（帳號不存在）」）整串當名字、頭像是灰色問號 ----
  function parseAuthor(text) {
    const m = /^(.*?)（@([^）]+)）$/.exec(text);
    return m ? { name: m[1], id: m[2] } : { name: text, id: '' };
  }

  // 頭像：暱稱第一個字，底色由帳號決定（同一個人每次都一樣）
  const AVATAR_COLORS = ['#17606b', '#c2571a', '#6b4fa0', '#2f7d4f', '#b0355e', '#3565a8'];
  function avatar(author) {
    const who = parseAuthor(author);
    if (!who.id) return el('span', { class: 'avatar avatar-ghost', 'aria-hidden': 'true', text: '?' });
    const sum = Array.from(who.id).reduce((n, ch) => n + ch.charCodeAt(0), 0);
    const node = el('span', { class: 'avatar', 'aria-hidden': 'true', text: who.name.replace(/^【[^】]*】/, '').charAt(0) });
    node.style.background = AVATAR_COLORS[sum % AVATAR_COLORS.length];
    return node;
  }

  function byline(author, isPoster) {
    const who = parseAuthor(author);
    return [
      el('strong', { text: who.name }),
      who.id ? el('span', { class: 'handle', text: '@' + who.id }) : null,
      isPoster ? el('span', { class: 'badge', text: T.poster }) : null
    ];
  }

  function lockIcon() {
    const icon = el('span', { class: 'lock-icon', 'aria-hidden': 'true' });
    icon.innerHTML = '<svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2.5" fill="currentColor"/>' +
      '<path d="M8 10V7.5a4 4 0 0 1 8 0V10" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';
    return icon;
  }

  function renderUser() {
    const account = currentAccount();
    userBar.replaceChildren(...(account
      ? [avatar(nameOf(account)),
        el('span', { text: L.format(T.loggedInAs, { name: nameOf(account) }) }),
        el('button', { type: 'button', onclick: () => { P.forumLogout(); route(); }, text: T.logout })]
      : [avatar(''), el('span', { text: T.guest }), el('a', { href: '#login', text: T.login })]));
  }

  function route() {
    const id = decodeURIComponent(location.hash.slice(1));
    const post = F.posts.find((p) => p.id === id);
    renderUser();
    const board = id.startsWith('board-') && F.boards.find((b) => 'board-' + b.id === id);
    if (!id || board) app.replaceChildren(renderIndex(board || F.boards[0]));
    else if (id === 'login') app.replaceChildren(renderLogin());
    else if (!post) app.replaceChildren(el('div', { class: 'panel' }, [el('p', { text: T.notFound }), backLink()]));
    else if (!L.canReadPost(P.load(), post)) app.replaceChildren(renderLocked(post));
    else app.replaceChildren(renderPost(post));
  }

  // 上鎖的文章在列表上只顯示黑框，真正的標題解鎖後才放進頁面
  // 分區在同一頁用上面的分頁切換，一次只顯示一個分區
  function renderIndex(board) {
    const progress = P.load();
    const posts = F.posts.filter((p) => p.board === board.id);
    return el('div', {}, [
      el('nav', { class: 'board-tabs', 'aria-label': T.boardsLabel }, F.boards.map((b) => el('a', {
        href: '#board-' + b.id, text: b.name, 'aria-current': b === board ? 'page' : null
      }))),
      el('section', { class: 'board' }, [
        board.desc ? el('p', { class: 'board-desc', text: board.desc }) : null,
        el('ul', { class: 'post-list' }, posts.map((post) => {
          const open = L.canReadPost(progress, post);
          return el('li', {}, el('a', { class: open ? 'post-card' : 'post-card is-locked', href: '#' + post.id, 'aria-label': open ? null : T.lockedLabel }, [
            avatar(post.author),
            el('span', { class: 'post-main' }, [
              el('span', { class: open ? 'post-title' : 'post-title redacted', text: open ? post.title : T.lockedTitle }),
              el('span', { class: 'post-meta', text: `${parseAuthor(post.author).name}　${L.isoToDots(post.date)}` })
            ]),
            open ? el('span', { class: 'reply-count', text: L.format(T.commentCount, { n: countComments(post.comments) }) }) : lockIcon()
          ]));
        }))
      ])
    ]);
  }

  function renderLocked(post) {
    // 用密碼鎖的文章：輸入正確的密碼就打開，之後一直開著
    if (post.lock.type === 'code') {
      const code = el('input', { type: 'text', id: 'post-code', autocomplete: 'off', spellcheck: 'false' });
      const status = el('p', { class: 'form-status', role: 'status' });
      const form = el('form', { class: 'panel locked-panel' }, [
        lockIcon(),
        el('p', { text: T.codeLocked }),
        el('div', { class: 'field field-short' }, [el('label', { for: 'post-code', text: T.codeLabel }), code]),
        el('button', { type: 'submit', class: 'button button-small', text: T.codeButton }),
        status,
        backLink(post)
      ]);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!P.openLock(post.lock, code.value).ok) { status.textContent = T.codeWrong; return; }
        // 開鎖可能帶來新的眼疾效果，馬上套用
        if (window.EyeEffects) window.EyeEffects.refresh();
        route();
      });
      return form;
    }
    return el('div', { class: 'panel locked-panel' }, [
      lockIcon(),
      el('p', { text: T.locked }),
      currentAccount() ? null : el('p', {}, el('a', { class: 'button button-small', href: '#login', text: T.login })),
      backLink(post)
    ]);
  }

  function renderPost(post) {
    const board = F.boards.find((b) => b.id === post.board);
    return el('article', { class: 'entry post', 'data-post': post.id }, [
      el('p', { class: 'entry-cat', text: board ? board.name : '' }),
      el('h2', { text: post.title }),
      el('div', { class: 'post-author' }, [
        avatar(post.author),
        el('div', {}, [
          el('div', {}, byline(post.author, true)),
          el('time', { datetime: post.date, text: L.isoToDots(post.date) })
        ])
      ]),
      ...post.blocks.flatMap(renderBlock),
      el('section', { class: 'comment-wrap' }, [
        el('h3', { text: L.format(T.commentsTitle, { n: countComments(post.comments) }) }),
        renderComments(post.comments, post, false),
        el('p', { class: 'muted', text: T.commentClosed })
      ]),
      backLink(post)
    ]);
  }

  function renderBlock(block) {
    switch (block.type) {
      case 'h': return el('h3', { text: block.text });
      case 'p': return window.EyeDom.paras(block.text);
      case 'red': return el('p', { class: 'red-text', text: block.text });
      case 'braille': return el('p', { class: 'braille', lang: 'zxx', text: block.text });
      case 'img': return el('figure', { class: 'post-img' }, [
        el('img', { src: block.src, alt: block.alt, loading: 'lazy' }),
        block.caption ? el('figcaption', { text: block.caption }) : null
      ]);
      case 'plate': return renderPlate(block);
      default: return null;
    }
  }

  // 反向色盲圖：每個數字一張（js/plate.js），並排成一列
  function renderPlate(block) {
    if (!window.EyePlate) return null;
    return el('figure', { class: 'plates' }, [
      el('div', { class: 'plate-row', role: 'img', 'aria-label': block.alt }, block.digits.map((digit) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        window.EyePlate.render(svg, digit);
        return svg;
      })),
      el('figcaption', { text: block.caption })
    ]);
  }

  // 留言：第一層標樓層，回覆縮在該則留言裡。發文者本人的留言標「樓主」
  function renderComments(list, post, nested) {
    if (!list || !list.length) return nested ? null : el('p', { class: 'muted', text: T.noComments });
    return el('ol', { class: 'comments' }, list.map((c, i) => el('li', { class: 'comment' }, [
      avatar(c.author),
      el('div', { class: 'comment-body' }, [
        el('p', { class: 'comment-head' }, [
          ...byline(c.author, c.author === post.author),
          nested ? null : el('span', { class: 'floor', text: L.format(T.floor, { n: i + 1 }) })
        ]),
        c.braille ? el('p', { class: 'braille', lang: 'zxx', text: c.braille }) : el('p', { text: c.text }),
        renderComments(c.replies, post, true)
      ])
    ])));
  }

  function renderLogin() {
    if (currentAccount()) return el('div', { class: 'panel' }, [el('p', { text: T.alreadyLoggedIn }), backLink()]);
    // 密碼欄用一般文字欄：這是遊戲裡的密碼，不要讓瀏覽器跳出「要不要記住密碼」
    const id = el('input', { type: 'text', id: 'forum-id', name: 'forum-id', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
    const password = el('input', { type: 'text', id: 'forum-pw', name: 'forum-pw', autocomplete: 'off', inputmode: 'numeric', maxlength: 8 });
    const status = el('p', { class: 'form-status', role: 'status' });
    const form = el('form', { class: 'panel forum-login', 'aria-labelledby': 'forum-login-title' }, [
      el('h2', { id: 'forum-login-title', text: T.loginTitle }),
      el('div', { class: 'field' }, [el('label', { for: 'forum-id', text: T.idLabel }), id, el('small', { text: T.idHint })]),
      el('div', { class: 'field field-short' }, [el('label', { for: 'forum-pw', text: T.passwordLabel }), password, el('small', { text: T.passwordHint })]),
      el('button', { type: 'submit', class: 'button button-small', text: T.loginButton }),
      status,
      el('p', { class: 'muted', text: T.registerClosed }),
      backLink()
    ]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (P.forumLogin(id.value, password.value).ok) location.hash = '';
      else status.textContent = T.loginFailed;
    });
    return form;
  }

  window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });
  route();
})();
