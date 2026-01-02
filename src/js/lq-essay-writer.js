/**
 * Essay writer module for creating and grading bar-style essay responses.
 */

import { gradeEssayResponse } from './lq-api.js';

const ESSAY_MAX_POINTS_DEFAULT = 100;

/**
 * Create the essay writer section with editor controls and grading output.
 * @returns {HTMLElement} Essay writer section element.
 */
export function createEssayWriterSection() {
  const section = document.createElement('section');
  section.className = 'essay-writer-section module-frame-alt';

  const header = createEssayHeader();
  const form = createEssayForm();
  const results = createEssayResults();

  section.appendChild(header);
  section.appendChild(form);
  section.appendChild(results);

  bindEssayFormHandlers(form, results);

  return section;
}

function createEssayHeader() {
  const header = document.createElement('div');
  header.className = 'essay-writer-header';
  header.innerHTML = `
    <h2 class="essay-writer-title">📝 Essay Answer Lab</h2>
    <p class="essay-writer-subtitle">
      Draft an answer and submit it for precedent-based AI grading.
    </p>
  `;
  return header;
}

function createEssayForm() {
  const form = document.createElement('form');
  form.className = 'essay-writer-form';
  form.innerHTML = `
    <label class="essay-label" for="essayQuestion">Essay Prompt</label>
    <textarea id="essayQuestion" class="essay-textarea essay-question" rows="6" placeholder="Paste the essay prompt here..." required></textarea>

    <div class="essay-controls">
      <div class="essay-control-group">
        <button type="button" class="essay-control-btn" data-format="bold">Bold</button>
        <button type="button" class="essay-control-btn" data-format="italic">Italic</button>
        <button type="button" class="essay-control-btn" data-format="underline">Underline</button>
        <button type="button" class="essay-control-btn" data-format="bullet">Bullet</button>
      </div>
      <div class="essay-control-group">
        <button type="button" class="essay-control-btn" data-action="clear">Clear</button>
        <button type="button" class="essay-control-btn" data-action="sample">Insert Sample Outline</button>
      </div>
    </div>

    <label class="essay-label" for="essayAnswer">Your Answer</label>
    <textarea id="essayAnswer" class="essay-textarea essay-answer" rows="12" placeholder="Write your answer here..." required></textarea>

    <div class="essay-meta">
      <label class="essay-label-inline" for="essayMaxPoints">
        Max Points
        <input id="essayMaxPoints" type="number" min="1" max="200" value="${ESSAY_MAX_POINTS_DEFAULT}" />
      </label>
      <div class="essay-word-count" data-target="essayAnswer">0 words</div>
    </div>

    <button type="submit" class="essay-submit-btn">Submit for AI Grading</button>
  `;
  return form;
}

function createEssayResults() {
  const results = document.createElement('div');
  results.className = 'essay-results';
  results.innerHTML = `
    <div class="essay-results-header">
      <h3>AI Grading Results</h3>
      <p class="essay-results-subtitle">Results appear after submission.</p>
    </div>
    <div class="essay-results-body" aria-live="polite"></div>
  `;
  return results;
}

function bindEssayFormHandlers(form, results) {
  const questionField = form.querySelector('#essayQuestion');
  const answerField = form.querySelector('#essayAnswer');
  const maxPointsField = form.querySelector('#essayMaxPoints');
  const wordCount = form.querySelector('[data-target="essayAnswer"]');
  const resultBody = results.querySelector('.essay-results-body');

  form.addEventListener('click', (event) => {
    const button = event.target.closest('.essay-control-btn');
    if (!button) return;
    event.preventDefault();

    const format = button.dataset.format;
    const action = button.dataset.action;

    if (format) {
      applyEssayFormatting(answerField, format);
      updateWordCount(answerField, wordCount);
    }

    if (action === 'clear') {
      answerField.value = '';
      updateWordCount(answerField, wordCount);
    }

    if (action === 'sample') {
      answerField.value = buildSampleOutline(answerField.value);
      updateWordCount(answerField, wordCount);
    }
  });

  answerField.addEventListener('input', () => {
    updateWordCount(answerField, wordCount);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    resultBody.innerHTML = '<div class="essay-loading">Grading in progress...</div>';

    try {
      const gradeResponse = await gradeEssayResponse({
        question: questionField.value.trim(),
        answer: answerField.value.trim(),
        max_points: maxPointsField.value ? Number(maxPointsField.value) : undefined
      });

      renderEssayResults(resultBody, gradeResponse);
    } catch (error) {
      resultBody.innerHTML = `
        <div class="essay-error">
          Unable to grade the response. ${error.message || 'Please try again.'}
        </div>
      `;
    }
  });
}

function applyEssayFormatting(textarea, format) {
  const selectionStart = textarea.selectionStart;
  const selectionEnd = textarea.selectionEnd;
  const selectedText = textarea.value.slice(selectionStart, selectionEnd);

  let formattedText = selectedText;
  if (format === 'bold') formattedText = `**${selectedText || 'bold text'}**`;
  if (format === 'italic') formattedText = `*${selectedText || 'italic text'}*`;
  if (format === 'underline') formattedText = `__${selectedText || 'underline text'}__`;
  if (format === 'bullet') formattedText = `- ${selectedText || 'bullet point'}`;

  textarea.setRangeText(formattedText, selectionStart, selectionEnd, 'end');
  textarea.focus();
}

function buildSampleOutline(currentText) {
  const outline = [
    'Issue: Identify the primary legal issue.',
    'Rule: State the governing rule with authority.',
    'Analysis: Apply the facts to the rule.',
    'Conclusion: Provide a concise conclusion.'
  ];
  const prefix = currentText ? `${currentText}\n\n` : '';
  return `${prefix}${outline.join('\n')}`;
}

function renderEssayResults(container, response) {
  const grade = response.grade;
  if (!grade) {
    container.innerHTML = '<div class="essay-error">No grading details returned.</div>';
    return;
  }

  const rubricItems = (grade.rubric_points || [])
    .map((item) => `
      <li>
        <strong>${item.criterion}</strong>
        <span>${item.points_awarded}/${item.points_possible} pts</span>
        <p>${item.justification}</p>
      </li>
    `)
    .join('');

  const lineItems = (grade.line_feedback || [])
    .map((line) => `
      <li>
        <span class="essay-line-number">Line ${line.line}</span>
        <p class="essay-line-text">${line.text}</p>
        <p class="essay-line-feedback">${line.feedback}</p>
        <span class="essay-line-score">Δ ${line.score_delta}</span>
      </li>
    `)
    .join('');

  container.innerHTML = `
    <div class="essay-score-card">
      <div class="essay-score-value">${grade.total_score} / ${grade.max_score}</div>
      <div class="essay-score-rationale">${grade.score_rationale || 'Score rationale provided.'}</div>
    </div>
    <div class="essay-overall-feedback">${grade.overall_feedback || ''}</div>
    <div class="essay-rubric">
      <h4>Rubric Breakdown</h4>
      <ul>${rubricItems || '<li>No rubric details provided.</li>'}</ul>
    </div>
    <div class="essay-line-review">
      <h4>Line-by-Line Feedback</h4>
      <ul>${lineItems || '<li>No line feedback provided.</li>'}</ul>
    </div>
  `;
}

function updateWordCount(textarea, output) {
  const words = textarea.value.trim().split(/\s+/).filter(Boolean);
  output.textContent = `${words.length} words`;
}
