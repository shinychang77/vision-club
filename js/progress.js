/*
 * progress.js — 進度讀寫與計分邏輯（全站唯一會碰 localStorage 的地方）
 *
 * 瀏覽器：載入後提供
 *   window.EyeProgress     已綁定 localStorage 與 EYE_CONTENT 的進度物件（頁面用這個）
 *   window.EyeProgressLib  純函式工具（計分、題目順序、日期格式等）
 * Node：module.exports = EyeProgressLib，用 createStore(content, storage) 建立進度物件。
 *
 * 存在 localStorage 的 'eye:progress'，格式（JSON）：
 * {
 *   "version": 1,
 *   "subjectId": "HZ-7K3Q9P",          // 受測編號，第一次存檔時產生
 *   "answers": { "q1": "b", "a1": "c" },// 題目 id → 選項 id（正常題與異常題都在這）
 *   "scores": { "cognitive": 3,          // 認知分數（顯示用），每次存檔依 answers 重算
 *               "anomaly": 3 },          // 異常分數（隱藏），每次存檔依 answers 重算
 *   "unlocked": ["a1"],                  // 已解鎖的異常題 id，依解鎖順序
 *   "profile": { "nickname": "", "age": null },  // age 為 0–120 整數或 null
 *   "photos": ["c1"],                    // 模擬 SEM 拍到的線索 id，依拍攝順序（lab/sem.html）
 *   "ui": { "notices": { "n-a1": "2026-11-05" }, // 異常介面狀態：各異常公告第一次出現的日期
 *           "announced": ["a2"],               // 已經跳過「解鎖新題目」提示的異常題 id
 *           "announcedFx": ["cataract"],       // 已經跳過「多一種效果」提示的眼疾效果
 *           "eyedrops": false },                 // 通關後的「神奇眼藥水」：true 時所有網站都不顯示眼疾效果
 *   "wiki": { "searches": ["錯視"],      // 知識庫頁的搜尋歷史，最新的在前，最多 10 筆
 *             "found": ["pareidolia"] }, // 已找到的詞條 id（搜尋搜到的，或直接開網址看過的），依找到的順序
 *   "forum": { "user": null },           // 論壇登入中的帳號 id（forum.html），沒登入是 null
 *   "lab": { "user": null },             // 研究單位網站登入中的成員 id（lab/），沒登入是 null
 *   "events": ["sem-eye"]                // 已發生的事件代號，依發生順序。眼疾效果和用密碼上鎖的內容都拿它當條件
 * }
 * 讀取時會逐欄檢查：JSON 壞掉或不是物件 → 視為全新進度；個別欄位不合法 → 只丟掉那個欄位；
 * 指向內容檔裡已不存在的題目／選項的作答也會被丟掉。測驗進度（第幾題）不另外存，由 answers 推得。
 */
(function (root) {
  'use strict';

  var KEY = 'eye:progress';
  var VERSION = 1;
  var AGE_MIN = 0;
  var AGE_MAX = 120;
  var NICKNAME_MAX = 20;

  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

  function fresh() {
    return {
      version: VERSION,
      subjectId: null,
      answers: {},
      scores: { cognitive: 0, anomaly: 0 },
      unlocked: [],
      profile: { nickname: '', age: null },
      photos: [],
      ui: { notices: {}, announced: [], announcedFx: [], eyedrops: false },
      wiki: { searches: [], found: [] },
      forum: { user: null },
      lab: { user: null },
      events: []
    };
  }

  function normalQuestions(content) { return (content && content.quiz && content.quiz.questions) || []; }
  function anomalyQuestions(content) { return (content && content.anomalyQuestions) || []; }

  function findQuestion(content, id) {
    var all = normalQuestions(content).concat(anomalyQuestions(content));
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  var SEARCH_MAX = 10;   // 搜尋歷史最多留幾筆
  var QUERY_MAX = 40;    // 每筆關鍵字最多幾個字
  function isEntry(content, id) {
    var entries = (content && content.wiki && content.wiki.entries) || [];
    return entries.some(function (e) { return e.id === id; });
  }

  function isClue(content, id) {
    var clues = (content && content.lab && content.lab.sem && content.lab.sem.clues) || [];
    return clues.some(function (c) { return c.id === id; });
  }

  function isAnomaly(content, id) {
    return anomalyQuestions(content).some(function (q) { return q.id === id; });
  }

  function findOption(question, optionId) {
    var opts = (question && question.options) || [];
    for (var i = 0; i < opts.length; i++) if (opts[i].id === optionId) return opts[i];
    return null;
  }

  function parseAge(value) {
    if (value === null || value === undefined || value === '') return null;
    var n = typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isInteger(n) || n < AGE_MIN || n > AGE_MAX) return undefined; // undefined＝不合法
    return n;
  }

  // 把任何東西整理成合法的進度物件。不合法的部分直接丟掉，不會拋錯。
  function sanitize(raw, content) {
    var p = fresh();
    if (!isObj(raw)) return p;

    if (typeof raw.subjectId === 'string' && /^[A-Z0-9-]{1,32}$/.test(raw.subjectId)) p.subjectId = raw.subjectId;

    if (Array.isArray(raw.events)) {
      raw.events.forEach(function (id) {
        if (typeof id === 'string' && EVENT_ID.test(id) && p.events.length < EVENT_MAX && p.events.indexOf(id) === -1) p.events.push(id);
      });
    }

    if (Array.isArray(raw.unlocked)) {
      raw.unlocked.forEach(function (id) {
        if (typeof id === 'string' && isAnomaly(content, id) && p.unlocked.indexOf(id) === -1) p.unlocked.push(id);
      });
    }
    // 靠事件解鎖的異常題（unlockEvent）：事件發生過就算解鎖
    anomalyQuestions(content).forEach(function (q) {
      if (q.unlockEvent && p.events.indexOf(q.unlockEvent) !== -1 && p.unlocked.indexOf(q.id) === -1) p.unlocked.push(q.id);
    });

    if (isObj(raw.answers)) {
      Object.keys(raw.answers).forEach(function (qid) {
        var q = findQuestion(content, qid);
        var oid = raw.answers[qid];
        if (!q || typeof oid !== 'string' || !findOption(q, oid)) return;
        if (isAnomaly(content, qid) && p.unlocked.indexOf(qid) === -1) return; // 沒解鎖的異常題不該有作答
        p.answers[qid] = oid;
      });
    }

    if (isObj(raw.profile)) {
      if (typeof raw.profile.nickname === 'string') p.profile.nickname = raw.profile.nickname.slice(0, NICKNAME_MAX);
      var age = parseAge(raw.profile.age);
      if (age !== undefined) p.profile.age = age;
    }

    if (Array.isArray(raw.photos)) {
      raw.photos.forEach(function (id) {
        if (typeof id === 'string' && isClue(content, id) && p.photos.indexOf(id) === -1) p.photos.push(id);
      });
    }

    if (isObj(raw.ui) && isObj(raw.ui.notices)) {
      Object.keys(raw.ui.notices).forEach(function (id) {
        var d = raw.ui.notices[id];
        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) p.ui.notices[id] = d;
      });
    }

    if (isObj(raw.ui) && raw.ui.eyedrops === true) p.ui.eyedrops = true;

    if (isObj(raw.ui) && Array.isArray(raw.ui.announced)) {
      raw.ui.announced.forEach(function (id) {
        if (p.unlocked.indexOf(id) !== -1 && p.ui.announced.indexOf(id) === -1) p.ui.announced.push(id);
      });
    }

    if (isObj(raw.ui) && Array.isArray(raw.ui.announcedFx)) {
      raw.ui.announcedFx.forEach(function (t) {
        if (EFFECT_TYPES.indexOf(t) !== -1 && p.ui.announcedFx.indexOf(t) === -1) p.ui.announcedFx.push(t);
      });
    }

    if (isObj(raw.wiki)) {
      if (Array.isArray(raw.wiki.searches)) {
        raw.wiki.searches.forEach(function (q) {
          if (typeof q === 'string' && q && q.length <= QUERY_MAX && p.wiki.searches.length < SEARCH_MAX && p.wiki.searches.indexOf(q) === -1) p.wiki.searches.push(q);
        });
      }
      if (Array.isArray(raw.wiki.found)) {
        raw.wiki.found.forEach(function (id) {
          if (typeof id === 'string' && isEntry(content, id) && p.wiki.found.indexOf(id) === -1) p.wiki.found.push(id);
        });
      }
    }

    if (isObj(raw.forum) && forumAccounts(content).some(function (a) { return a.id === raw.forum.user; })) p.forum.user = raw.forum.user;
    if (isObj(raw.lab) && labMembers(content).some(function (m) { return m.id === raw.lab.user; })) p.lab.user = raw.lab.user;

    p.scores = computeScores(p, content);
    return p;
  }

  // 認知分數只算正常題；異常分數只算已解鎖的異常題
  function computeScores(p, content) {
    var cognitive = 0;
    var anomaly = 0;
    normalQuestions(content).forEach(function (q) {
      var o = findOption(q, p.answers[q.id]);
      if (o) cognitive += Number(o.score) || 0;
    });
    anomalyQuestions(content).forEach(function (q) {
      if (p.unlocked.indexOf(q.id) === -1) return;
      var o = findOption(q, p.answers[q.id]);
      if (o) anomaly += Number(o.anomaly) || 0;
    });
    return { cognitive: cognitive, anomaly: anomaly };
  }

  function maxCognitive(content) {
    return normalQuestions(content).reduce(function (sum, q) {
      return sum + q.options.reduce(function (m, o) { return Math.max(m, Number(o.score) || 0); }, 0);
    }, 0);
  }

  function scorePercent(p, content) {
    var max = maxCognitive(content);
    return max > 0 ? Math.round(p.scores.cognitive / max * 100) : 0;
  }

  // 全部題目的固定順序：正常題依序，所有異常題（不管解鎖了沒）插在 after 指定的題目後面。
  // 題號照這個順序編，所以還沒解鎖的題目會留下空號，玩家看得出少了幾題
  function fullSequence(content) {
    var seq = normalQuestions(content).slice();
    anomalyQuestions(content).forEach(function (q) {
      var pos = -1;
      for (var i = 0; i < seq.length; i++) if (seq[i].id === q.after) pos = i;
      if (pos === -1) seq.push(q); else seq.splice(pos + 1, 0, q);
    });
    return seq;
  }

  // 實際出題順序：固定順序裡拿掉還沒解鎖的異常題
  function questionSequence(p, content) {
    return fullSequence(content).filter(function (q) {
      return !isAnomaly(content, q.id) || p.unlocked.indexOf(q.id) !== -1;
    });
  }

  // 這一題的固定題號（從 1 開始）。找不到是 0
  function questionNumber(content, id) {
    var seq = fullSequence(content);
    for (var i = 0; i < seq.length; i++) if (seq[i].id === id) return i + 1;
    return 0;
  }

  // 還有幾題異常題沒解鎖
  function lockedCount(p, content) {
    return anomalyQuestions(content).filter(function (q) { return p.unlocked.indexOf(q.id) === -1; }).length;
  }

  function firstUnansweredIndex(p, content) {
    var seq = questionSequence(p, content);
    for (var i = 0; i < seq.length; i++) if (!p.answers[seq[i].id]) return i;
    return -1;
  }

  // 暱稱和年齡都填了才能開始作答
  function isProfileComplete(p) {
    return p.profile.nickname !== '' && p.profile.age !== null;
  }

  function isNormalComplete(p, content) {
    var qs = normalQuestions(content);
    return qs.length > 0 && qs.every(function (q) { return !!p.answers[q.id]; });
  }

  function pendingAnomalies(p, content) {
    return anomalyQuestions(content).filter(function (q) {
      return p.unlocked.indexOf(q.id) !== -1 && !p.answers[q.id];
    });
  }

  // 異常題解鎖了幾題、一共幾題：{ n, total }
  function unlockCount(p, content) {
    var main = anomalyQuestions(content);
    return { n: main.filter(function (q) { return p.unlocked.indexOf(q.id) !== -1; }).length, total: main.length };
  }

  // 可以進結局了嗎：異常題全部解鎖，而且每一題都選了異常的答案。
  // 只要有一題選了正常的答案就不算，結果頁照常出結果卡
  // 另外要從教團網站「使者專區」最底下的彈窗過來過（記成事件 cult.zone.event），否則照常出結果卡
  function endingReady(p, content) {
    var zone = content && content.cult && content.cult.zone;
    if (zone && !hasEvent(p, zone.event)) return false;
    var main = anomalyQuestions(content);
    return main.length > 0 && main.every(function (q) {
      var o = p.unlocked.indexOf(q.id) !== -1 ? findOption(q, p.answers[q.id]) : null;
      return !!o && Number(o.anomaly) > 0;
    });
  }

  // 進得去教團網站的「使者專區」嗎：四種眼疾效果都出現了，而且主線的異常題全部解鎖
  function messengerReady(p, content) {
    var count = unlockCount(p, content);
    return activeEffects(p, content).length === EFFECT_TYPES.length && count.total > 0 && count.n === count.total;
  }

  // 密碼比對：全形轉半形、不分大小寫、忽略空白、各種連字號與標點
  function normalizeCode(code) {
    var s = String(code == null ? '' : code);
    if (s.normalize) s = s.normalize('NFKC');
    return s.toUpperCase().replace(/[\s\-_‐‑‒–—―−ー,.!?:;'"()，、。．！？：；「」『』（）“”‘’·]/g, '');
  }

  // 和 normalizeCode 一樣，但保留詞和詞之間的空格（連續空白算一個）
  function spacedCode(code) {
    var s = String(code == null ? '' : code);
    if (s.normalize) s = s.normalize('NFKC');
    return s.trim().split(/\s+/).map(normalizeCode).filter(Boolean).join(' ');
  }

  function forumAccounts(content) { return (content && content.forum && content.forum.accounts) || []; }

  function labMembers(content) { return (content && content.lab && content.lab.members) || []; }

  // 登入比對：帳號前面的 @ 可有可無，其餘和密碼一樣寬鬆（全形、大小寫、空白、連字號）。兩欄都要對
  function matchLogin(list, idKey, secretKey, id, secret) {
    var want = normalizeCode(id).replace(/^@/, '');
    var key = normalizeCode(secret);
    for (var i = 0; i < list.length; i++) {
      if (want && key && normalizeCode(list[i][idKey]) === want && normalizeCode(list[i][secretKey]) === key) return list[i];
    }
    return null;
  }

  var EVENT_MAX = 50;
  var EVENT_ID = /^[a-z0-9-]{1,40}$/;
  function hasEvent(p, id) { return p.events.indexOf(id) !== -1; }

  // 這篇論壇文章現在看不看得到。沒上鎖的都看得到。鑰匙有兩種：
  //   'login' 用指定帳號登入　'code' 輸入過正確的密碼（記成事件 lock.event）
  function canReadPost(p, post) {
    var lock = post && post.lock;
    if (!lock) return true;
    if (lock.type === 'code') return hasEvent(p, lock.event);
    return lock.type === 'login' && p.forum.user === lock.account;
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  // 玩家當地時間的日期，例如 '2026-11-05'
  function todayISO(date) {
    var d = date || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function isoToDots(iso) { return String(iso).replace(/-/g, '.'); }

  // 把 '還有 {n} 題' 這類文字裡的變數換掉
  function format(template, vars) {
    return String(template == null ? '' : template).replace(/\{(\w+)\}/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(vars || {}, k) ? String(vars[k]) : m;
    });
  }

  // 結果類型的兩個風格軸。正常題的選項可以帶 trait（四個值之一），每軸各自計票。
  // 平手時取每軸的第二個值（審慎、細節）
  var TRAIT_AXES = [['intuitive', 'deliberate'], ['global', 'local']];

  // 回傳類型代號，例如 'deliberate-local'，對應 content.result.types 的鍵
  function resultType(p, content) {
    var count = {};
    normalQuestions(content).forEach(function (q) {
      var o = findOption(q, p.answers[q.id]);
      if (o && o.trait) count[o.trait] = (count[o.trait] || 0) + 1;
    });
    return TRAIT_AXES.map(function (axis) {
      return (count[axis[0]] || 0) > (count[axis[1]] || 0) ? axis[0] : axis[1];
    }).join('-');
  }

  var EFFECT_TYPES = ['cataract', 'glaucoma', 'macular', 'colorblind'];

  // 依已解鎖的異常題與已發生的事件算出目前的眼疾效果：[{ type, strength }]。同一種效果只算一次，
  // 強度沒填就是 1，限制在 0~1。對應表與強度在 content.js 的 effects
  function activeEffects(p, content) {
    var fx = (content && content.effects) || {};
    var strength = fx.strength || {};
    var out = [];
    (fx.map || []).forEach(function (m) {
      if (EFFECT_TYPES.indexOf(m.type) === -1 || (p.unlocked.indexOf(m.requires) === -1 && !hasEvent(p, m.requires))) return;
      if (out.some(function (e) { return e.type === m.type; })) return;
      var s = Number(strength[m.type]);
      out.push({ type: m.type, strength: Math.min(1, Math.max(0, isFinite(s) ? s : 1)) });
    });
    return out;
  }

  function makeSubjectId() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var id = 'HZ-';
    for (var i = 0; i < 6; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id;
  }

  function memoryStorage() {
    var data = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
      setItem: function (k, v) { data[k] = String(v); },
      removeItem: function (k) { delete data[k]; }
    };
  }

  // 建立進度物件。storage 需有 getItem / setItem / removeItem
  function createStore(content, storage) {
    function load() {
      try {
        var text = storage.getItem(KEY);
        if (!text) return fresh();
        return sanitize(JSON.parse(text), content);
      } catch (e) {
        return fresh(); // 資料損毀或無法讀取：視為新進度
      }
    }

    function save(p) {
      var clean = sanitize(p, content);
      if (!clean.subjectId) clean.subjectId = makeSubjectId();
      try {
        storage.setItem(KEY, JSON.stringify(clean));
      } catch (e) {
        // 無法寫入（例如儲存空間已滿或被瀏覽器封鎖）：本次照常顯示，只是不會被記住
      }
      return clean;
    }

    // 讀出 → 交給 fn 修改 → 存回，回傳存好的進度
    function update(fn) {
      var p = load();
      fn(p);
      return save(p);
    }

    function answer(questionId, optionId) {
      return update(function (p) {
        var q = findQuestion(content, questionId);
        if (!q || !findOption(q, optionId)) return;
        if (isAnomaly(content, questionId) && p.unlocked.indexOf(questionId) === -1) return;
        p.answers[questionId] = optionId;
      });
    }

    // 回傳 { ok: true, progress } 或 { ok: false, error: 'age' }
    function setProfile(fields) {
      var age = parseAge(fields.age);
      if (age === undefined) return { ok: false, error: 'age' };
      var saved = update(function (p) {
        p.profile.nickname = String(fields.nickname || '').trim().slice(0, NICKNAME_MAX);
        p.profile.age = age;
        // 年齡填到幼兒（content.js 的 profile.childAge）會記下一個事件，之後改回來也不會消失
        var child = (content && content.profile && content.profile.childAge) || null;
        if (child && age !== null && age <= child.upTo && EVENT_ID.test(String(child.event)) && !hasEvent(p, child.event)) p.events.push(child.event);
      });
      return { ok: true, progress: saved };
    }

    // 記錄某則異常公告第一次出現的日期，已有日期就沿用。回傳該日期
    function noticeDate(id, today) {
      var existing = load().ui.notices[id];
      if (existing) return existing;
      var date = today || todayISO();
      update(function (p) { p.ui.notices[id] = date; });
      return date;
    }

    // 記錄模擬 SEM 拍到的線索。回傳 { added: true } 是新拍到的；已經有了或 id 不存在是 { added: false }
    function addPhoto(clueId) {
      var added = false;
      update(function (p) {
        if (!isClue(content, clueId) || p.photos.indexOf(clueId) !== -1) return;
        p.photos.push(clueId);
        added = true;
      });
      return { added: added };
    }

    // 記錄一次站內搜尋：關鍵字放到搜尋歷史最前面，搜到的詞條記成已找到。
    // 直接開網址看詞條時也用這個記（query 留空）
    function recordSearch(query, entryIds) {
      return update(function (p) {
        var q = String(query || '').trim().slice(0, QUERY_MAX);
        if (q) p.wiki.searches = [q].concat(p.wiki.searches.filter(function (x) { return x !== q; })).slice(0, SEARCH_MAX);
        (entryIds || []).forEach(function (id) {
          if (isEntry(content, id) && p.wiki.found.indexOf(id) === -1) p.wiki.found.push(id);
        });
      });
    }

    // 論壇登入。回傳 { ok: true, account } 或 { ok: false }
    function forumLogin(id, password) {
      var account = matchLogin(forumAccounts(content), 'id', 'password', id, password);
      if (!account) return { ok: false };
      update(function (p) { p.forum.user = account.id; });
      return { ok: true, account: account };
    }

    function forumLogout() {
      update(function (p) { p.forum.user = null; });
    }

    // 研究單位網站登入：姓名＋工號。回傳 { ok: true, member } 或 { ok: false }
    function labLogin(name, staffId) {
      var member = matchLogin(labMembers(content), 'name', 'staffId', name, staffId);
      if (!member) return { ok: false };
      update(function (p) { p.lab.user = member.id; });
      return { ok: true, member: member };
    }

    function labLogout() {
      update(function (p) { p.lab.user = null; });
    }

    // 記錄一件已發生的事（例如在 SEM 看見眼睛）。回傳 { added: true } 是第一次發生
    function addEvent(id) {
      var added = false;
      update(function (p) {
        if (!EVENT_ID.test(String(id)) || hasEvent(p, id)) return;
        p.events.push(id);
        added = true;
      });
      return { added: added };
    }

    // 用密碼開一把鎖。lock 是 { code 密碼（可以是陣列，任一個對了都算）, event 開了之後記下的事件代號, spaced 選填 }。
    // 比對很寬鬆（見 normalizeCode）；spaced 為 true 時，字和字之間的空格算數（要有、而且位置要對，全形半形都行）。回傳 { ok }
    function openLock(lock, given) {
      var norm = lock && lock.spaced ? spacedCode : normalizeCode;
      var want = norm(given);
      var codes = lock ? [].concat(lock.code).map(norm) : [];
      if (!lock || !lock.event || !want || codes.indexOf(want) === -1) return { ok: false };
      addEvent(lock.event);
      return { ok: true };
    }

    // 取出「已解鎖、但還沒提示過」的異常題，並記成提示過了。回傳那些題目（沒有就是空陣列）
    function takeNewUnlocks() {
      var ids = load().unlocked.filter(function (id) { return load().ui.announced.indexOf(id) === -1; });
      if (ids.length) update(function (p) { p.ui.announced = p.ui.announced.concat(ids); });
      return ids.map(function (id) { return findQuestion(content, id); });
    }

    // 取出「已經出現、但還沒提示過」的眼疾效果，並記成提示過了。回傳效果種類（沒有就是空陣列）
    function takeNewEffects() {
      var p = load();
      var types = activeEffects(p, content).map(function (e) { return e.type; }).filter(function (t) { return p.ui.announcedFx.indexOf(t) === -1; });
      if (types.length) update(function (q) { q.ui.announcedFx = q.ui.announcedFx.concat(types); });
      return types;
    }

    // 神奇眼藥水：on 為 true 時所有網站都不顯示眼疾效果（js/effects.js 讀這個值）
    function setEyedrops(on) {
      return update(function (p) { p.ui.eyedrops = !!on; });
    }

    function reset() {
      try { storage.removeItem(KEY); } catch (e) { /* 無法刪除時忽略 */ }
    }

    return {
      KEY: KEY,
      load: load,
      save: save,
      update: update,
      answer: answer,
      setProfile: setProfile,
      noticeDate: noticeDate,
      addPhoto: addPhoto,
      recordSearch: recordSearch,
      forumLogin: forumLogin,
      forumLogout: forumLogout,
      labLogin: labLogin,
      labLogout: labLogout,
      addEvent: addEvent,
      openLock: openLock,
      takeNewUnlocks: takeNewUnlocks,
      takeNewEffects: takeNewEffects,
      setEyedrops: setEyedrops,
      reset: reset
    };
  }

  var lib = {
    KEY: KEY,
    VERSION: VERSION,
    fresh: fresh,
    sanitize: sanitize,
    computeScores: computeScores,
    maxCognitive: maxCognitive,
    scorePercent: scorePercent,
    fullSequence: fullSequence,
    questionSequence: questionSequence,
    questionNumber: questionNumber,
    lockedCount: lockedCount,
    firstUnansweredIndex: firstUnansweredIndex,
    isProfileComplete: isProfileComplete,
    isNormalComplete: isNormalComplete,
    pendingAnomalies: pendingAnomalies,
    endingReady: endingReady,
    messengerReady: messengerReady,
    unlockCount: unlockCount,
    normalizeCode: normalizeCode,
    findQuestion: findQuestion,
    parseAge: parseAge,
    todayISO: todayISO,
    isoToDots: isoToDots,
    format: format,
    memoryStorage: memoryStorage,
    TRAIT_AXES: TRAIT_AXES,
    resultType: resultType,
    EFFECT_TYPES: EFFECT_TYPES,
    activeEffects: activeEffects,
    canReadPost: canReadPost,
    hasEvent: hasEvent,
    createStore: createStore
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = lib;
  } else {
    var storage;
    try {
      storage = root.localStorage;
      storage.setItem('eye:__probe', '1');
      storage.removeItem('eye:__probe');
    } catch (e) {
      storage = memoryStorage(); // 瀏覽器封鎖 localStorage 時退回暫存，頁面仍可運作
    }
    root.EyeProgressLib = lib;
    root.EyeProgress = createStore(root.EYE_CONTENT, storage);
  }
})(this);
