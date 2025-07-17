/**
 * Create a review screen summarizing answers and stats.
 */
export function createReview(questions, answers, tracker) {
  const container = document.createElement('div');
  container.className = 'review';

  questions.forEach((q, idx) => {
    const block = document.createElement('div');
    const text = document.createElement('p');
    text.textContent = q.text;
    block.appendChild(text);

    const list = document.createElement('ul');
    q.choices.forEach((c, i) => {
      const li = document.createElement('li');
      li.textContent = c;
      if (i === q.correct) li.classList.add('correct');
      if (i === answers[idx] && i !== q.correct) li.classList.add('incorrect');
      list.appendChild(li);
    });
    block.appendChild(list);

    const expl = document.createElement('p');
    expl.textContent = q.explanation;
    block.appendChild(expl);

    container.appendChild(block);
  });

  const stats = tracker.getTopicStats();
  const statsDiv = document.createElement('div');
  Object.entries(stats).forEach(([topic, info]) => {
    const p = document.createElement('p');
    p.textContent = `${topic}: ${info.correctPercent.toFixed(0)}% correct, ` +
      `${info.percentOfTotal.toFixed(0)}% of questions, ` +
      `Avg ${Math.round(info.avgTimeMs / 1000)}s each`;
    statsDiv.appendChild(p);
  });
  container.appendChild(statsDiv);

  return container;
}
