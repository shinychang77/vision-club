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
      ui: { notices: {}, announced: [], announcedFx: [], read: [], eyedrops: false },
      wiki: { searches: [], found: [] },
      forum: { user: null },
      lab: { user: null },
      keys: {},
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
  var SEARCH_MAX = 10;
  var QUERY_MAX = 40;
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
    if (!Number.isInteger(n) || n < AGE_MIN || n > AGE_MAX) return undefined;
    return n;
  }
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
    anomalyQuestions(content).forEach(function (q) {
      if (q.unlockEvent && p.events.indexOf(q.unlockEvent) !== -1 && p.unlocked.indexOf(q.id) === -1) p.unlocked.push(q.id);
    });
    if (isObj(raw.answers)) {
      Object.keys(raw.answers).forEach(function (qid) {
        var q = findQuestion(content, qid);
        var oid = raw.answers[qid];
        if (!q || typeof oid !== 'string' || !findOption(q, oid)) return;
        if (isAnomaly(content, qid) && p.unlocked.indexOf(qid) === -1) return;
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
    if (isObj(raw.ui) && Array.isArray(raw.ui.read)) {
      raw.ui.read.forEach(function (id) {
        if (typeof id === 'string' && /^[a-z0-9-]{1,40}$/.test(id) && p.ui.read.indexOf(id) === -1) p.ui.read.push(id);
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
    if (isObj(raw.keys)) {
      Object.keys(raw.keys).slice(0, 20).forEach(function (salt) {
        if (/^[a-z0-9:-]{1,60}$/.test(salt) && /^[0-9a-f]{64}$/.test(raw.keys[salt])) p.keys[salt] = raw.keys[salt];
      });
    }
    if (isObj(raw.forum) && forumAccounts(content).some(function (a) { return a.id === raw.forum.user && (!a.passwordCheck || p.keys['forum:' + a.id]); })) p.forum.user = raw.forum.user;
    if (isObj(raw.lab) && labMembers(content).some(function (m) { return m.id === raw.lab.user && (!m.staffIdCheck || p.keys['lab:' + m.id]); })) p.lab.user = raw.lab.user;
    p.scores = computeScores(p, content);
    return p;
  }
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
  function fullSequence(content) {
    var seq = normalQuestions(content).slice();
    anomalyQuestions(content).forEach(function (q) {
      var pos = -1;
      for (var i = 0; i < seq.length; i++) if (seq[i].id === q.after) pos = i;
      if (pos === -1) seq.push(q); else seq.splice(pos + 1, 0, q);
    });
    return seq;
  }
  function questionSequence(p, content) {
    return fullSequence(content).filter(function (q) {
      return !isAnomaly(content, q.id) || p.unlocked.indexOf(q.id) !== -1;
    });
  }
  function questionNumber(content, id) {
    var seq = fullSequence(content);
    for (var i = 0; i < seq.length; i++) if (seq[i].id === id) return i + 1;
    return 0;
  }
  function lockedCount(p, content) {
    return anomalyQuestions(content).filter(function (q) { return p.unlocked.indexOf(q.id) === -1; }).length;
  }
  function firstUnansweredIndex(p, content) {
    var seq = questionSequence(p, content);
    for (var i = 0; i < seq.length; i++) if (!p.answers[seq[i].id]) return i;
    return -1;
  }
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
  function unlockCount(p, content) {
    var main = anomalyQuestions(content);
    return { n: main.filter(function (q) { return p.unlocked.indexOf(q.id) !== -1; }).length, total: main.length };
  }
  function endingReady(p, content) {
    var zone = content && content.cult && content.cult.zone;
    if (zone && !hasEvent(p, zone.event)) return false;
    var main = anomalyQuestions(content);
    return main.length > 0 && main.every(function (q) {
      var o = p.unlocked.indexOf(q.id) !== -1 ? findOption(q, p.answers[q.id]) : null;
      return !!o && Number(o.anomaly) > 0;
    });
  }
  function messengerReady(p, content) {
    var count = unlockCount(p, content);
    return activeEffects(p, content).length === EFFECT_TYPES.length && count.total > 0 && count.n === count.total;
  }
  function normalizeCode(code) {
    var s = String(code == null ? '' : code);
    if (s.normalize) s = s.normalize('NFKC');
    return s.toUpperCase().replace(/[\s\-_‐‑‒–—―−ー,.!?:;'"()，、。．！？：；「」『』（）“”‘’·]/g, '');
  }
  function spacedCode(code) {
    var s = String(code == null ? '' : code);
    if (s.normalize) s = s.normalize('NFKC');
    return s.trim().split(/\s+/).map(normalizeCode).filter(Boolean).join(' ');
  }
  function forumAccounts(content) { return (content && content.forum && content.forum.accounts) || []; }
  function labMembers(content) { return (content && content.lab && content.lab.members) || []; }
  function matchLogin(list, idKey, secretKey, id, secret) {
    var want = normalizeCode(id).replace(/^@/, '');
    var key = normalizeCode(secret);
    for (var i = 0; i < list.length; i++) {
      if (want && key && normalizeCode(list[i][idKey]) === want && normalizeCode(list[i][secretKey]) === key) return list[i];
    }
    return null;
  }
  function utf8(s) { return unescape(encodeURIComponent(s)); }
  function sha256(text) {
    var K = sha256.K || (sha256.K = (function () {
      var k = [], n = 2;
      while (k.length < 64) {
        var prime = true;
        for (var d = 2; d * d <= n; d++) if (n % d === 0) { prime = false; break; }
        if (prime) k.push((Math.pow(n, 1 / 3) % 1) * 4294967296 | 0);
        n++;
      }
      return k;
    })());
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var s = utf8(text), len = s.length, words = [], i;
    for (i = 0; i < len; i++) words[i >> 2] |= s.charCodeAt(i) << (24 - (i % 4) * 8);
    words[len >> 2] |= 0x80 << (24 - (len % 4) * 8);
    var total = ((len + 8) >> 6) * 16 + 16;
    for (i = words.length; i < total; i++) words[i] = words[i] | 0;
    words[total - 1] = len * 8;
    var w = [];
    for (var b = 0; b < total; b += 16) {
      var a = H.slice();
      for (i = 0; i < 64; i++) {
        if (i < 16) w[i] = words[b + i] | 0;
        else {
          var x = w[i - 15], y = w[i - 2];
          w[i] = (((x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ (x >>> 3)) + w[i - 16] + ((y >>> 17 | y << 15) ^ (y >>> 19 | y << 13) ^ (y >>> 10)) + w[i - 7]) | 0;
        }
        var e = a[4];
        var t1 = (a[7] + ((e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7)) + ((e & a[5]) ^ (~e & a[6])) + K[i] + w[i]) | 0;
        var c = a[0];
        var t2 = (((c >>> 2 | c << 30) ^ (c >>> 13 | c << 19) ^ (c >>> 22 | c << 10)) + ((c & a[1]) ^ (c & a[2]) ^ (a[1] & a[2]))) | 0;
        a = [(t1 + t2) | 0, a[0], a[1], a[2], (a[3] + t1) | 0, a[4], a[5], a[6]];
      }
      for (i = 0; i < 8; i++) H[i] = (H[i] + a[i]) | 0;
    }
    return H.map(function (v) { return ('0000000' + (v >>> 0).toString(16)).slice(-8); }).join('');
  }
  function deriveKey(salt, normalized) {
    var k = 'eye|' + salt + '|' + normalized;
    for (var i = 0; i < 1000; i++) k = sha256(k);
    return k;
  }
  function keyCheck(key) { return sha256('check|' + key); }
  function xorStream(bytes, key) {
    var out = '', block = '';
    for (var i = 0; i < bytes.length; i++) {
      if (i % 32 === 0) block = sha256('stream|' + key + '|' + (i / 32));
      out += String.fromCharCode(bytes.charCodeAt(i) ^ parseInt(block.substr((i % 32) * 2, 2), 16));
    }
    return out;
  }
  function toB64(bytes) { return typeof btoa === 'function' ? btoa(bytes) : Buffer.from(bytes, 'binary').toString('base64'); }
  function fromB64(text) { return typeof atob === 'function' ? atob(text) : Buffer.from(text, 'base64').toString('binary'); }
  function seal(data, key) { return toB64(xorStream(utf8(JSON.stringify(data)), key)); }
  function unseal(text, key) {
    try { return JSON.parse(decodeURIComponent(escape(xorStream(fromB64(text), key)))); } catch (e) { return null; }
  }
  function openSealed(item, key) {
    if (!item || !item.sealed || !key) return;
    var data = unseal(item.sealed, key);
    if (!isObj(data)) return;
    Object.keys(data).forEach(function (k) { item[k] = data[k]; });
    delete item.sealed;
  }
  function codeLocks(content) {
    var lab = (content && content.lab) || {}, cult = (content && content.cult) || {};
    return [].concat(lab.docs || [], lab.files || [], cult.files || [], lab.search ? [lab.search] : []).filter(function (x) { return x && (x.code || x.codeCheck); });
  }
  function openAllSealed(content, keys) {
    codeLocks(content).forEach(function (x) { openSealed(x, keys[x.event]); });
    forumAccounts(content).forEach(function (a) {
      ((content.forum && content.forum.posts) || []).forEach(function (post) {
        if (post.lock && post.lock.type === 'login' && post.lock.account === a.id) openSealed(post, keys['forum:' + a.id]);
      });
    });
    labMembers(content).forEach(function (m) { openSealed(m, keys['lab:' + m.id]); });
  }
  function isOpen(p, item) { return !!item && hasEvent(p, item.event) && !item.sealed; }
  var EVENT_MAX = 50;
  var EVENT_ID = /^[a-z0-9-]{1,40}$/;
  function hasEvent(p, id) { return p.events.indexOf(id) !== -1; }
  function canReadPost(p, post) {
    var lock = post && post.lock;
    if (!lock) return true;
    if (lock.type === 'code') return hasEvent(p, lock.event);
    return lock.type === 'login' && p.forum.user === lock.account && !post.sealed;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayISO(date) {
    var d = date || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function isoToDots(iso) { return String(iso).replace(/-/g, '.'); }
  function format(template, vars) {
    return String(template == null ? '' : template).replace(/\{(\w+)\}/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(vars || {}, k) ? String(vars[k]) : m;
    });
  }
  var TRAIT_AXES = [['intuitive', 'deliberate'], ['global', 'local']];
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
  function createStore(content, storage) {
    function load() {
      try {
        var text = storage.getItem(KEY);
        if (!text) return fresh();
        return sanitize(JSON.parse(text), content);
      } catch (e) {
        return fresh();
      }
    }
    function save(p) {
      var clean = sanitize(p, content);
      if (!clean.subjectId) clean.subjectId = makeSubjectId();
      try {
        storage.setItem(KEY, JSON.stringify(clean));
      } catch (e) {
      }
      return clean;
    }
    function update(fn) {
      var p = load();
      fn(p);
      return save(p);
    }
    openAllSealed(content, load().keys);
    function answer(questionId, optionId) {
      return update(function (p) {
        var q = findQuestion(content, questionId);
        if (!q || !findOption(q, optionId)) return;
        if (isAnomaly(content, questionId) && p.unlocked.indexOf(questionId) === -1) return;
        p.answers[questionId] = optionId;
      });
    }
    function setProfile(fields) {
      var age = parseAge(fields.age);
      if (age === undefined) return { ok: false, error: 'age' };
      var saved = update(function (p) {
        p.profile.nickname = String(fields.nickname || '').trim().slice(0, NICKNAME_MAX);
        p.profile.age = age;
        var child = (content && content.profile && content.profile.childAge) || null;
        if (child && age !== null && age <= child.upTo && EVENT_ID.test(String(child.event)) && !hasEvent(p, child.event)) p.events.push(child.event);
      });
      return { ok: true, progress: saved };
    }
    function noticeDate(id, today) {
      var existing = load().ui.notices[id];
      if (existing) return existing;
      var date = today || todayISO();
      update(function (p) { p.ui.notices[id] = date; });
      return date;
    }
    function addPhoto(clueId) {
      var added = false;
      update(function (p) {
        if (!isClue(content, clueId) || p.photos.indexOf(clueId) !== -1) return;
        p.photos.push(clueId);
        added = true;
      });
      return { added: added };
    }
    function recordSearch(query, entryIds) {
      return update(function (p) {
        var q = String(query || '').trim().slice(0, QUERY_MAX);
        if (q) p.wiki.searches = [q].concat(p.wiki.searches.filter(function (x) { return x !== q; })).slice(0, SEARCH_MAX);
        (entryIds || []).forEach(function (id) {
          if (isEntry(content, id) && p.wiki.found.indexOf(id) === -1) p.wiki.found.push(id);
        });
      });
    }
    function forumLogin(id, password) {
      var account = matchLogin(forumAccounts(content), 'id', 'password', id, password);
      var key = account ? null : hashedLogin(forumAccounts(content), 'id', 'passwordCheck', 'forum:', id, password);
      if (key) {
        account = key.item;
        openAllSealed(content, rememberKey('forum:' + account.id, key.key).keys);
      }
      if (!account) return { ok: false };
      update(function (p) { p.forum.user = account.id; });
      return { ok: true, account: account };
    }
    function forumLogout() {
      update(function (p) { p.forum.user = null; });
    }
    function labLogin(name, staffId) {
      var member = matchLogin(labMembers(content), 'name', 'staffId', name, staffId);
      var key = member ? null : hashedLogin(labMembers(content), 'name', 'staffIdCheck', 'lab:', name, staffId);
      if (key) {
        member = key.item;
        openAllSealed(content, rememberKey('lab:' + member.id, key.key).keys);
      }
      if (!member) return { ok: false };
      update(function (p) { p.lab.user = member.id; });
      return { ok: true, member: member };
    }
    function labLogout() {
      update(function (p) { p.lab.user = null; });
    }
    function addEvent(id) {
      var added = false;
      update(function (p) {
        if (!EVENT_ID.test(String(id)) || hasEvent(p, id)) return;
        p.events.push(id);
        added = true;
      });
      return { added: added };
    }
    function openLock(lock, given) {
      var norm = lock && lock.spaced ? spacedCode : normalizeCode;
      var want = norm(given);
      if (!lock || !lock.event || !want) return { ok: false };
      if (lock.codeCheck) {
        var key = deriveKey(lock.event, want);
        if (lock.codeCheck.indexOf(keyCheck(key)) === -1) return { ok: false };
        rememberKey(lock.event, key);
        openSealed(lock, key);
      } else if ([].concat(lock.code).map(norm).indexOf(want) === -1) return { ok: false };
      addEvent(lock.event);
      return { ok: true };
    }
    function takeNewUnlocks() {
      var ids = load().unlocked.filter(function (id) { return load().ui.announced.indexOf(id) === -1; });
      if (ids.length) update(function (p) { p.ui.announced = p.ui.announced.concat(ids); });
      return ids.map(function (id) { return findQuestion(content, id); });
    }
    function takeNewEffects() {
      var p = load();
      var types = activeEffects(p, content).map(function (e) { return e.type; }).filter(function (t) { return p.ui.announcedFx.indexOf(t) === -1; });
      if (types.length) update(function (q) { q.ui.announcedFx = q.ui.announcedFx.concat(types); });
      return types;
    }
    function markRead(id) {
      return update(function (p) { if (p.ui.read.indexOf(id) === -1) p.ui.read.push(id); });
    }
    function setEyedrops(on) {
      return update(function (p) { p.ui.eyedrops = !!on; });
    }
    function hashedLogin(list, idKey, checkKey, prefix, id, secret) {
      var want = normalizeCode(id).replace(/^@/, '');
      var given = normalizeCode(secret);
      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (!want || !given || !item[checkKey] || normalizeCode(item[idKey]) !== want) continue;
        var key = deriveKey(prefix + item.id, given);
        if (keyCheck(key) === item[checkKey]) return { item: item, key: key };
      }
      return null;
    }
    function rememberKey(salt, key) {
      return update(function (p) { p.keys[salt] = key; });
    }
    function reset() {
      try { storage.removeItem(KEY); } catch (e) {   }
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
      markRead: markRead,
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
    isOpen: isOpen,
    spacedCode: spacedCode,
    sha256: sha256,
    deriveKey: deriveKey,
    keyCheck: keyCheck,
    seal: seal,
    unseal: unseal,
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
      storage = memoryStorage();
    }
    root.EyeProgressLib = lib;
    root.EyeProgress = createStore(root.EYE_CONTENT, storage);
  }
})(this);
