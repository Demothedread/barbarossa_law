import { Timer } from './lq-timer.js';

function createChoice(text, index, selected, eliminated, onSelect, onEliminate) {
  const li = document.createElement('li');
  const button = document.createElement('button');
  button.textContent = text;
  button.className = selected ? 'selected' : '';
  button.addEventListener('click', () => onSelect(index));

  const elim = document.createElement('button');
  elim.textContent = '✖';
  elim.className = 'elim';
  elim.addEventListener('click', (e) => {
    e.stopPropagation();
    li.classList.toggle('eliminated');
    onEliminate(index, li.classList.contains('eliminated'));
  });
  if (eliminated) li.classList.add('eliminated');

  li.appendChild(button);
  li.appendChild(elim);
  return li;
}

function renderQuestion(container, q, state) {
  container.innerHTML = '';
  if (q.prompt) {
    const ctx = document.createElement('div');
    ctx.className = 'prompt';
    ctx.innerText = q.prompt;
    container.appendChild(ctx);
  }
  const text = document.createElement('p');
  text.innerHTML = q.question;
  text.contentEditable = true;
  text.spellcheck = false;
  text.style.outline = '1px dashed #eee';
  container.appendChild(text);
  // Highlight support
  const highlightControls = document.createElement('div');
  ['yellow', 'cyan', 'lime'].forEach((color) => {
    const btn = document.createElement('button');
    btn.style.backgroundColor = color;
    btn.title = 'Highlight';
    btn.onclick = () => {
      document.getSelection && document.execCommand('hiliteColor', false, color);
    };
    highlightControls.appendChild(btn);
  });
  container.appendChild(highlightControls);

  const list = document.createElement('ul');
  q.choices.forEach((choice, idx) => {
    const item = createChoice(
      choice,
      idx,
      state.answers[state.current] === idx,
      state.eliminated[state.current]?.[idx],
      (i) => { state.answers[state.current] = i; renderQuestion(container, q, state); },
      (i, el) => {
        if (!state.eliminated[state.current]) state.eliminated[state.current] = {};
        state.eliminated[state.current][i] = el;
      },
    );
    list.appendChild(item);
  });
  container.appendChild(list);
}

export function createQuiz(questions, opts, onComplete) {
  const total = questions.length;
  const container = document.createElement('div');
  container.className = 'quiz';
  const state = {
    current: 0,
    answers: new Array(total).fill(null), // index of choice
    eliminated: {}, // { qIndex: { [choiceIdx]: true } }
    startTime: Date.now(),
  };

  const questionContainer = document.createElement('div');
  container.appendChild(questionContainer);

  // Navigation
  const nav = document.createElement('div');
  nav.className = 'quiz-nav';
  const prev = document.createElement('button');
  prev.textContent = '< Prev';
  const next = document.createElement('button');
  next.textContent = 'Next >';
  nav.appendChild(prev);
  nav.appendChild(next);
  container.appendChild(nav);

  // Timer
  let totalSecs = Math.ceil(opts.timer * 60 * total);
  const timerDisplay = document.createElement('span');
  container.appendChild(timerDisplay);
  let timerStop = false;
  let timerVal = totalSecs;
  const timerTick = () => {
    if (timerStop) return;
    timerDisplay.textContent = `Time: ${Math.floor(timerVal/60)}m ${timerVal%60}s`;
    if (timerVal > 0) {
      timerVal--;
      setTimeout(timerTick, 1000);
    } else {
      finishQuiz();
    }
  };
  timerTick();

  function showQuestion(index) {
    state.current = index;
    renderQuestion(questionContainer, questions[index], state);
    prev.disabled = index === 0;
    next.textContent = (index === total - 1 ? 'Finish' : 'Next >');
  }
  prev.onclick = () => {
    if (state.current > 0) showQuestion(state.current - 1);
  };
  next.onclick = () => {
    if (state.current < total - 1) {
      showQuestion(state.current + 1);
    } else {
      finishQuiz();
    }
  };

  function finishQuiz() {
    timerStop = true;
    const duration = Math.ceil((Date.now() - state.startTime) / 1000);
    // meta: correct, total, duration, answers, eliminated
    let correct = 0;
    questions.forEach((q, i) => {
      if (state.answers[i] !== null &&
         'ABCD'[state.answers[i]]===q.answer) correct++;
    });
    onComplete(questions, state.answers, {
      correct,
      total,
      duration_s: duration,
      eliminated: state.eliminated
    });
  }

  showQuestion(0);
  return container;
}
