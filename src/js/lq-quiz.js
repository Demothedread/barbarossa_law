import { Timer } from './lq-timer.js';

/**
 * Render a single answer choice with elimination toggle.
 * @param {string} text
 * @param {number} index
 * @param {(i:number)=>void} onSelect
 * @param {(i:number,el:boolean)=>void} onEliminate
 * @returns {HTMLElement}
 */

function createChoice(text, index, onSelect, onEliminate) {
  const li = document.createElement('li');
  const button = document.createElement('button');
  button.textContent = text;
  button.addEventListener('click', () => onSelect(index));

  const elim = document.createElement('button');
  elim.textContent = '✖';
  elim.addEventListener('click', (e) => {
    e.stopPropagation();
    li.classList.toggle('eliminated');
    onEliminate(index, li.classList.contains('eliminated'));
  });

  li.appendChild(button);
  li.appendChild(elim);
  return li;
}

function renderQuestion(container, q, state) {
  container.innerHTML = '';
  const text = document.createElement('p');
  text.innerHTML = q.text;
  container.appendChild(text);

  const highlightControls = document.createElement('div');
  ['cyan', 'magenta', 'lime'].forEach((color) => {
    const btn = document.createElement('button');
    btn.style.backgroundColor = color;
    btn.addEventListener('click', () => {
      document.execCommand('hiliteColor', false, color);
    });
    highlightControls.appendChild(btn);
  });
  container.appendChild(highlightControls);

  const list = document.createElement('ul');
  q.choices.forEach((choice, idx) => {
    const item = createChoice(
      choice,
      idx,
      (index) => {
        state.answers[state.current] = index;
      },
      (index, eliminated) => {
        if (!state.eliminated[state.current]) state.eliminated[state.current] = {};
        state.eliminated[state.current][index] = eliminated;
      },
    );
    if (state.eliminated[state.current] && state.eliminated[state.current][idx]) {
      item.classList.add('eliminated');
    }
    list.appendChild(item);
  });
  container.appendChild(list);
}

export function createQuiz(num, manager, tracker, onComplete) {
  const container = document.createElement('div');
  container.className = 'quiz';
  const questions = Array.from({ length: num }, () => manager.next());
  tracker.records = [];
  const state = {
    current: 0,
    answers: new Array(num).fill(null),
    eliminated: {},
  };

  const questionContainer = document.createElement('div');
  container.appendChild(questionContainer);

  const nav = document.createElement('div');
  const prev = document.createElement('button');
  prev.textContent = '<';
  const next = document.createElement('button');
  next.textContent = '>';
  nav.appendChild(prev);
  nav.appendChild(next);
  container.appendChild(nav);

  const timerDisplay = document.createElement('span');
  container.appendChild(timerDisplay);

  const timer = new Timer(num * 108, (remaining) => {
    timerDisplay.textContent = `Time: ${remaining}s`;
  });
  timer.start();

  function recordCurrent() {
    tracker.stop(state.answers[state.current], questions[state.current].correct);
  }

  function showQuestion(index) {
    recordCurrent();
    state.current = index;
    tracker.start(questions[index]);
    renderQuestion(questionContainer, questions[index], state);
  }

  prev.addEventListener('click', () => {
    if (state.current > 0) showQuestion(state.current - 1);
  });
  next.addEventListener('click', () => {
    if (state.current < num - 1) {
      showQuestion(state.current + 1);
    } else {
      recordCurrent();
      timer.stop();
      onComplete(questions, state.answers);
    }
  });

  showQuestion(0);
  return container;
}
