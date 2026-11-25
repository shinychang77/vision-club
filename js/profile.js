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
    if (location.search === '?next=quiz') { location.href = 'quiz.html'; return; }
    if (window.EyeEffects) window.EyeEffects.refresh();
  });
  app.replaceChildren(
    form,
    el('dl', { class: 'stats profile-stats' }, [
      el('div', {}, [el('dt', { text: T.subjectIdLabel }), subjectId]),
      el('div', {}, [el('dt', { text: T.answeredLabel }), answered])
    ])
  );
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
