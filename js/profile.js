// 個人資料頁：暱稱、年齡、重新開始（清除全部進度）
(function () {
  const C = window.EYE_CONTENT;
  const P = window.EyeProgress;
  const L = window.EyeProgressLib;
  const { el } = window.EyeDom;
  const app = document.getElementById('profile-app');
  if (!C || !P || !app) return;
  const T = C.profile;

  document.getElementById('page-title').textContent = T.title;
  document.getElementById('page-intro').textContent = T.intro;

  const nickname = el('input', { type: 'text', id: 'nickname', name: 'nickname', maxlength: 20, required: true, autocomplete: 'nickname', 'aria-describedby': 'nickname-hint' });
  const age = el('input', { type: 'number', id: 'age', name: 'age', min: 0, max: 120, step: 1, required: true, inputmode: 'numeric', 'aria-describedby': 'age-hint' });
  const ageWarn = el('p', { class: 'red-text field-warn', role: 'status' });
  const saveStatus = el('p', { class: 'form-status', role: 'status' });
  const resetStatus = el('p', { class: 'form-status', role: 'status' });
  const subjectId = el('dd', { 'data-field': 'subjectId' });
  const answered = el('dd', { 'data-field': 'answered' });

  const form = el('form', { class: 'panel profile-form', novalidate: true }, [
    el('div', { class: 'field' }, [
      el('label', { for: 'nickname', text: T.nicknameLabel }), nickname,
      el('small', { id: 'nickname-hint', text: T.nicknameHint })
    ]),
    el('div', { class: 'field field-short' }, [
      el('label', { for: 'age', text: T.ageLabel }), age,
      el('small', { id: 'age-hint', text: T.ageHint }),
      ageWarn
    ]),
    el('button', { type: 'submit', class: 'button button-small', text: T.saveButton }),
    saveStatus
  ]);

  // 年齡偏小時的紅字提示：只提示，不擋儲存
  function showAgeWarn() {
    const n = age.value.trim() === '' ? NaN : Number(age.value);
    ageWarn.textContent = n >= 0 && n <= T.ageWarnUpTo ? T.ageWarn : '';
  }
  age.addEventListener('input', showAgeWarn);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!nickname.value.trim() || !age.value.trim()) {
      saveStatus.textContent = T.required;
      (nickname.value.trim() ? age : nickname).focus();
      return;
    }
    const result = P.setProfile({ nickname: nickname.value, age: age.value });
    if (!result.ok) {
      saveStatus.textContent = T.ageInvalid;
      age.setAttribute('aria-invalid', 'true');
      age.focus();
      return;
    }
    age.removeAttribute('aria-invalid');
    saveStatus.textContent = T.saved;
    fill();
    if (window.EyeEffects) window.EyeEffects.refresh(); // 年齡填到幼兒會解鎖一題，馬上跳提示
    // 從測驗頁被請過來補資料的，存好就回去作答
    if (location.search === '?next=quiz') location.href = 'quiz.html';
  });

  const resetButton = el('button', { type: 'button', class: 'button button-danger', text: T.resetButton });
  resetButton.addEventListener('click', () => {
    if (!window.confirm(T.resetConfirm)) return;
    P.reset();
    saveStatus.textContent = '';
    resetStatus.textContent = T.resetDone;
    fill();
  });

  app.replaceChildren(
    form,
    el('dl', { class: 'stats profile-stats' }, [
      el('div', {}, [el('dt', { text: T.subjectIdLabel }), subjectId]),
      el('div', {}, [el('dt', { text: T.answeredLabel }), answered])
    ]),
    el('section', { class: 'panel reset' }, [
      el('h2', { text: T.resetTitle }),
      el('p', { class: 'muted', text: T.resetIntro }),
      resetButton,
      resetStatus
    ])
  );

  // 只讀不寫：打開這一頁本身不會產生任何紀錄
  function fill() {
    const p = P.load();
    nickname.value = p.profile.nickname;
    age.value = p.profile.age === null ? '' : String(p.profile.age);
    showAgeWarn();
    subjectId.textContent = p.subjectId || T.subjectIdNone;
    const seq = L.questionSequence(p, C);
    answered.textContent = `${seq.filter((q) => p.answers[q.id]).length} / ${seq.length}`;
  }
  fill();
})();
