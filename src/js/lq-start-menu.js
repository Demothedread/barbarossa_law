import { fetchQuestionsByType, fetchSubjects } from './lq-api.js';

/**
 * Create a start menu allowing users to choose number, subject, question type, and timer options.
 * @param {(opts:object)=>void} onStart Callback invoked when quiz should start.
 * @returns {HTMLElement}
 */
export function createStartMenu(onStart) {
  const container = document.createElement('div');
  container.className = 'start-menu';

  const form = document.createElement('form');

  // Number of questions
  const labelNum = document.createElement('label');
  labelNum.textContent = 'Number of Questions: ';
  const inputNum = document.createElement('input');
  inputNum.type = 'number';
  inputNum.min = '1';
  inputNum.value = '5';
  labelNum.appendChild(inputNum);
  form.appendChild(labelNum);

  // Subject
  const labelSub = document.createElement('label');
  labelSub.textContent = ' Subject: ';
  const selectSub = document.createElement('select');
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '(Any)';
  selectSub.appendChild(defaultOpt);
  labelSub.appendChild(selectSub);
  form.appendChild(labelSub);

  // Question Type
  const labelType = document.createElement('label');
  labelType.textContent = ' Question Type: ';
  const selectType = document.createElement('select');
  
  const mixOpt = document.createElement('option');
  mixOpt.value = 'mix';
  mixOpt.textContent = 'Mix (All Questions)';
  selectType.appendChild(mixOpt);
  
  const mbeOpt = document.createElement('option');
  mbeOpt.value = 'mbe';
  mbeOpt.textContent = 'MBE Only';
  selectType.appendChild(mbeOpt);
  
  const generatedOpt = document.createElement('option');
  generatedOpt.value = 'generated';
  generatedOpt.textContent = 'AI Generated Only';
  selectType.appendChild(generatedOpt);
  
  labelType.appendChild(selectType);
  form.appendChild(labelType);

  // Timer setting
  const labelTimer = document.createElement('label');
  labelTimer.textContent = ' Minutes per Question: ';
  const inputTimer = document.createElement('input');
  inputTimer.type = 'number';
  inputTimer.min = '0.5';
  inputTimer.max = '10';
  inputTimer.step = '0.1';
  inputTimer.value = '1.8';
  labelTimer.appendChild(inputTimer);
  form.appendChild(labelTimer);

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = 'Start Quiz';
  form.appendChild(btn);

  // Populate subjects live
  fetchSubjects().then(subjects => {
    subjects.forEach(subject => {
      const opt = document.createElement('option');
      opt.value = subject;
      opt.textContent = subject;
      selectSub.appendChild(opt);
    });
  });

  // If you want to limit number to what's available for subject and type:
  async function updateMax() {
    let subject = selectSub.value;
    let questionType = selectType.value;
    let n = 999;
    try {
      const res = await fetchQuestionsByType(999, subject, questionType);
      n = res.available || 999;
    } catch {}
    inputNum.max = n;
    if (parseInt(inputNum.value) > n) inputNum.value = n;
  }
  selectSub.addEventListener('change', updateMax);
  selectType.addEventListener('change', updateMax);
  updateMax();

  form.onsubmit = (e) => {
    e.preventDefault();
    const n = parseInt(inputNum.value, 10); 
    const subject = selectSub.value;
    const questionType = selectType.value;
    const timer = parseFloat(inputTimer.value);
    onStart({n, subject, questionType, timer});
  };

  container.appendChild(form);
  return container;
}
