(function () {
  const C = window.EYE_CONTENT;
  const P = window.EyeProgress;
  const L = window.EyeProgressLib;
  const { el } = window.EyeDom;
  const app = document.getElementById('quiz-app');
  if (!C || !P || !app) return;
  const T = C.quiz.ui;
  document.getElementById('page-title').textContent = C.quiz.title;
  document.getElementById('page-intro').textContent = C.quiz.intro;
  let progress = P.load();
  const zone = C.cult && C.cult.zone;
  const called = () => !!zone && L.hasEvent(progress, zone.event);
  const isAnomaly = (id) => (C.anomalyQuestions || []).some((a) => a.id === id);
  const sequence = () => L.questionSequence(progress, C).filter((item) => !called() || isAnomaly(item.id));
  const firstUnanswered = () => sequence().findIndex((item) => !progress.answers[item.id]);
  let index = location.search === '?call' && called() ? 0 : firstUnanswered();
  function render() {
    if (!L.isProfileComplete(progress)) return app.replaceChildren(renderNeedProfile());
    app.replaceChildren(index === -1 ? renderDone() : renderQuestion());
  }
  function renderNeedProfile() {
    return el('div', { class: 'panel' }, [
      el('p', { text: T.needProfile }),
      el('div', { class: 'actions' }, el('a', { class: 'button', href: 'profile.html?next=quiz', text: T.toProfile }))
    ]);
  }
  function renderDone() {
    const seq = sequence();
    const locked = L.lockedCount(progress, C);
    const total = L.fullSequence(C).length;
    return el('div', { class: 'panel' }, [
      el('h2', { text: L.format(locked ? T.doneTitleOpen : T.doneTitle, { n: seq.length, total }) }),
      locked ? el('p', { class: 'quiz-locked', text: L.format(T.doneLocked, { total, locked }) }) : null,
      el('p', { text: T.doneText }),
      el('div', { class: 'actions' }, [
        el('a', { class: 'button', href: 'result.html', text: T.toResult }),
        el('button', { type: 'button', class: 'button button-secondary', onclick: () => { index = 0; render(); }, text: T.review })
      ])
    ]);
  }
  function renderQuestion() {
    const seq = sequence();
    const q = seq[index];
    const chosen = progress.answers[q.id];
    const answered = seq.filter((item) => progress.answers[item.id]).length;
    const allDone = answered === seq.length;
    const isLast = index === seq.length - 1;
    const options = q.options.map((o) =>
      el('label', { class: 'option' }, [
        el('input', {
          type: 'radio',
          name: 'answer',
          value: o.id,
          checked: o.id === chosen,
          onchange: () => {
            progress = P.answer(q.id, o.id);
            render();
            const next = app.querySelector('[data-next]');
            if (next) next.focus();
          }
        }),
        el('span', { text: o.text }),
        called() && isAnomaly(q.id) ? window.EyeDom.arrow(Number(o.anomaly) > 0 ? 'dots' : 'red') : null
      ])
    );
    let nextButton;
    if (!isLast) {
      nextButton = el('button', {
        type: 'button', class: 'button', 'data-next': true, disabled: !chosen,
        onclick: () => { index += 1; render(); }, text: T.next
      });
    } else if (allDone) {
      nextButton = el('a', { class: 'button', href: 'result.html', 'data-next': true, text: T.toResult });
    } else {
      nextButton = el('button', {
        type: 'button', class: 'button', 'data-next': true, disabled: !chosen,
        onclick: () => { index = firstUnanswered(); render(); }, text: T.toUnanswered
      });
    }
    let figure = null;
    if (q.svg) {
      figure = el('div', { class: 'quiz-figure' });
      figure.innerHTML = q.svg;
    } else if (q.image) {
      figure = el('div', { class: 'quiz-figure' }, el('img', { src: q.image.src, alt: q.image.alt }));
    } else if (q.lines) {
      figure = el('pre', { class: 'quiz-figure quiz-lines', text: q.lines.join('\n') });
    }
    return el('div', { class: 'panel quiz' + (isAnomaly(q.id) ? ' quiz-anomaly' : ''), 'data-question': q.id }, [
      el('p', { class: 'quiz-count', text: L.format(T.count, { n: L.questionNumber(C, q.id), total: L.fullSequence(C).length }) }),
      el('div', { class: 'meter', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': seq.length, 'aria-valuenow': answered, 'aria-label': '作答進度' },
        el('span', { style: `width:${answered / seq.length * 100}%` })),
      el('fieldset', { class: 'options' }, [el('legend', {}, window.EyeDom.rich(q.prompt)), figure].concat(options)),
      q.note ? el('p', { class: 'quiz-note', text: q.note }) : null,
      el('div', { class: 'actions actions-split' }, [
        el('button', {
          type: 'button', class: 'button button-secondary', disabled: index === 0,
          onclick: () => { index -= 1; render(); }, text: T.prev
        }),
        nextButton
      ])
    ]);
  }
  render();
})();
