(() => {
  'use strict';
  const KEY = 'landscape_exam_web_2026_v1';
  const app = document.getElementById('app');
  let bank = null;
  let state = load();
  let view = { page: 'home', day: 1, index: 0, review: false };
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function load() {
    try { return Object.assign({ answers: {}, submissions: {}, wrongIds: {}, review: null }, JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch { return { answers: {}, submissions: {}, wrongIds: {}, review: null }; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { toast('浏览器无法保存进度，请检查隐私设置'); } }
  function today() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
  function questionSet() { return view.review ? bank.QUESTIONS.filter(q => state.wrongIds[q.id]) : bank.QUESTIONS.filter(q => q.day === view.day); }
  function answerKey() { return view.review ? 'review' : String(view.day); }
  function answers() { const key = answerKey(); return state.answers[key] || (state.answers[key] = {}); }
  function same(a, b) { return Array.isArray(a) && a.length === b.length && a.every(x => b.includes(x)); }
  function grade(qs, selections) {
    const details = qs.map(q => ({ id: q.id, selected: selections[q.id] || [], correct: same(selections[q.id], q.answer) }));
    const correct = details.filter(d => d.correct).length;
    return { total: qs.length, correct, score: qs.length ? Math.round(correct * 100 / qs.length) : 0, details, submittedAt: today() };
  }
  function toast(message) { document.querySelector('.toast')?.remove(); const el = document.createElement('div'); el.className = 'toast'; el.textContent = message; document.body.append(el); setTimeout(() => el.remove(), 2600); }
  function navigate(page, extra = {}) { view = { ...view, page, ...extra }; render(); window.scrollTo(0, 0); }
  function render() {
    if (!bank) return;
    if (view.page === 'home') return home();
    if (view.page === 'result') return result();
    quiz();
  }
  function home() {
    const completed = Object.keys(state.submissions).filter(k => state.submissions[k]?.total === 30).length;
    const wrongCount = bank.QUESTIONS.filter(q => state.wrongIds[q.id]).length;
    const cards = Array.from({ length: 6 }, (_, i) => {
      const day = i + 1, date = 9 + day, r = state.submissions[day];
      const label = r ? `${r.score} 分 · ${r.correct}/30 题正确` : '30 题 · 单选与多选';
      return `<button class="day-card" data-action="open-day" data-day="${day}"><span class="date-badge"><strong>${date}</strong><small>10 月</small></span><span class="day-text"><strong>第 ${day} 天 <span class="pill ${r ? 'done' : 'pending'}">${r ? '已完成' : '待练习'}</span></strong><small>${label}</small></span><span class="chevron">›</span></button>`;
    }).join('');
    app.innerHTML = `<header class="hero"><div class="topline"><span class="brand">LANDSCAPE · 2026</span><span>10 月 17 日考试</span></div><div class="eyebrow">每日一练 · 稳步复习</div><h1>景观设计刷题</h1><p>五本教材，六天完成 180 道题。提交后查看得分和逐题解析，16 日集中复习错题。</p><div class="hero-stats"><div class="stat"><strong>${completed}/6</strong><span>完成天数</span></div><div class="stat"><strong>${completed * 30}/180</strong><span>已完成题目</span></div><div class="stat"><strong>${wrongCount}</strong><span>累计错题</span></div></div></header><main class="main"><div class="section-head"><h2>每日练习</h2><span>10.10—10.15 · 每天 30 题</span></div><div class="day-list">${cards}</div><section class="panel review-card"><h3>10 月 16 日 · 错题回炉</h3><p>${wrongCount ? `目前收录 ${wrongCount} 道错题。重新作答后可再次查看完整解析。` : '每日提交后，答错的题会自动收录到这里。'}</p><button class="primary full" data-action="open-review" ${wrongCount ? '' : 'disabled'}>开始错题复习</button></section><section class="panel"><h3>覆盖五本教材</h3><p>按原书内容整理，兼顾规范条文、设计方法与案例知识。</p><div class="book-grid">${bank.BOOKS.map(b => `<span class="book-chip">${esc(b.name)}</span>`).join('')}</div></section><section class="panel"><h3>备考提醒</h3><p>多选题需选全且不多选才得分。建议每日及时查看解析；完成错题复习后仍需回看教材重点。题库成绩不能保证实际考试分数。</p></section></main>`;
  }
  function quiz() {
    const qs = questionSet();
    if (!qs.length) { navigate('home'); return; }
    view.index = Math.min(Math.max(0, view.index), qs.length - 1);
    const q = qs[view.index], selected = answers()[q.id] || [];
    const answered = qs.filter(item => (answers()[item.id] || []).length).length;
    const submitted = view.review ? state.review : state.submissions[view.day];
    const showAnswer = !!submitted;
    const isCorrect = showAnswer && same(selected, q.answer);
    const options = q.options.map((o, i) => {
      const picked = selected.includes(i);
      const classNames = ['option', picked ? 'selected' : '', showAnswer && q.answer.includes(i) ? 'correct' : '', showAnswer && picked && !q.answer.includes(i) ? 'incorrect' : ''].filter(Boolean).join(' ');
      return `<button class="${classNames}" data-action="select" data-choice="${i}" aria-pressed="${picked}" ${showAnswer ? 'disabled' : ''}><span class="letter">${letters[i]}</span><span>${esc(o)}</span></button>`;
    }).join('');
    const jump = qs.map((item, i) => { const done = (answers()[item.id] || []).length; const wrong = showAnswer && !same(answers()[item.id] || [], item.answer); return `<button class="jump ${i === view.index ? 'active' : ''} ${done ? 'answered' : ''} ${wrong ? 'wrong' : ''}" data-action="jump" data-index="${i}" aria-label="第 ${i + 1} 题${done ? '，已作答' : '，未作答'}">${i + 1}</button>`; }).join('');
    app.innerHTML = `<div class="topbar"><button class="back" data-action="home">‹ 返回首页</button><div class="topbar-title">${view.review ? '错题复习' : `第 ${view.day} 天 · 10 月 ${9 + view.day} 日`}</div></div><main class="quiz-main"><div class="progress-copy"><span>第 ${view.index + 1} / ${qs.length} 题</span><span>已作答 ${answered} / ${qs.length}</span></div><div class="track"><div class="fill" style="width:${answered / qs.length * 100}%"></div></div><section class="question-card"><div class="question-meta"><span class="type ${q.type === 'multi' ? 'multi' : ''}">${q.type === 'multi' ? '多选题' : '单选题'}</span><span class="book-name">${esc(q.bookShort)}</span></div><h2>${esc(q.stem)}</h2><div class="option-list">${options}</div>${showAnswer ? `<div class="explanation"><strong>${isCorrect ? '回答正确' : '回答错误'} · 正确答案 ${q.answer.map(i => letters[i]).join('、')}</strong>${esc(q.explanation)}</div>` : `<p class="hint" style="margin-top:16px">${q.type === 'multi' ? '可选择多个选项；提交后统一批改。' : '请选择一个选项；提交后统一批改。'}</p>`}<div class="source">出处：${esc(q.source)}</div></section><div class="jump-grid">${jump}</div></main><div class="footer-actions"><button class="secondary" data-action="prev" ${view.index === 0 ? 'disabled' : ''}>上一题</button><button class="primary" data-action="${view.index === qs.length - 1 ? (showAnswer ? 'result' : 'submit') : 'next'}">${view.index === qs.length - 1 ? (showAnswer ? '查看成绩' : '提交批改') : '下一题'}</button></div>`;
  }
  function result() {
    const qs = questionSet();
    const r = view.review ? state.review : state.submissions[view.day];
    if (!r) { navigate('quiz'); return; }
    const rows = qs.map((q, i) => { const d = r.details.find(x => x.id === q.id); return `<button class="result-row" data-action="jump-result" data-index="${i}"><span class="mark ${d.correct ? '' : 'bad'}">${d.correct ? '✓' : '✕'}</span><span>${i + 1}. ${esc(q.stem)}</span><span>›</span></button>`; }).join('');
    app.innerHTML = `<div class="topbar"><button class="back" data-action="home">‹ 返回首页</button><div class="topbar-title">${view.review ? '错题复习结果' : `第 ${view.day} 天练习结果`}</div></div><main class="main"><div class="result-hero"><div class="score">${r.score}<span style="font-size:21px"> 分</span></div><p>答对 ${r.correct} / ${r.total} 题 · ${r.submittedAt}</p></div><section class="panel"><h3>${r.score >= 75 ? '继续巩固' : '重点回看错题'}</h3><p>${r.score >= 75 ? '这轮练习达到 75 分。继续查看错题解析，16 日再集中复习。' : '建议逐题查看解析并回到教材定位知识点，复习后可重新作答。'}</p></section><div class="section-head" style="margin-top:24px"><h2>逐题解析</h2><span>点击查看答案</span></div><div class="result-list">${rows}</div><div style="display:flex;gap:10px;margin-top:19px"><button class="secondary full" data-action="retry">重新作答</button><button class="primary full" data-action="home">返回首页</button></div></main>`;
  }
  function submit() {
    const qs = questionSet(), selections = answers();
    const missing = qs.findIndex(q => !(selections[q.id] || []).length);
    if (missing >= 0) { view.index = missing; quiz(); toast(`请先完成第 ${missing + 1} 题`); return; }
    const r = grade(qs, selections);
    if (view.review) state.review = r;
    else { r.attempts = (state.submissions[view.day]?.attempts || 0) + 1; state.submissions[view.day] = r; r.details.filter(d => !d.correct).forEach(d => { state.wrongIds[d.id] = true; }); }
    save(); navigate('result');
  }
  app.addEventListener('click', e => {
    const button = e.target.closest('button[data-action]'); if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'home') return navigate('home');
    if (action === 'open-day') return navigate('quiz', { day: Number(button.dataset.day), review: false, index: 0 });
    if (action === 'open-review') return navigate('quiz', { review: true, index: 0 });
    if (action === 'select') {
      const q = questionSet()[view.index], selected = answers()[q.id] || [], i = Number(button.dataset.choice);
      answers()[q.id] = q.type === 'single' ? [i] : selected.includes(i) ? selected.filter(x => x !== i) : [...selected, i].sort();
      save(); quiz(); return;
    }
    if (action === 'jump' || action === 'jump-result') return navigate('quiz', { index: Number(button.dataset.index) });
    if (action === 'prev') return navigate('quiz', { index: view.index - 1 });
    if (action === 'next') return navigate('quiz', { index: view.index + 1 });
    if (action === 'submit') return submit();
    if (action === 'result') return navigate('result');
    if (action === 'retry') {
      state.answers[answerKey()] = {};
      if (view.review) state.review = null; else delete state.submissions[view.day];
      save(); navigate('quiz', { index: 0 });
    }
  });
  fetch('./questions.json').then(r => { if (!r.ok) throw new Error('题库加载失败'); return r.json(); }).then(data => { bank = data; render(); }).catch(err => { app.innerHTML = `<div class="error">${esc(err.message)}。请刷新页面重试。</div>`; });
})();
