const ESSAY_PROMPTS = [
  {
    id: 'contracts-remedies',
    title: 'Contracts Remedies Drill',
    prompt: 'A supplier breaches a contract to deliver custom equipment. Analyze the buyer’s remedies, including expectation, reliance, and specific performance.'
  },
  {
    id: 'torts-duty',
    title: 'Torts Duty & Breach',
    prompt: 'Discuss whether a duty exists in a negligence claim involving a crowded entertainment venue and a foreseeable injury.'
  },
  {
    id: 'civpro-personal-jurisdiction',
    title: 'Civil Procedure: Personal Jurisdiction',
    prompt: 'Evaluate personal jurisdiction over an out-of-state defendant who advertises nationwide but ships selectively.'
  },
  {
    id: 'conlaw-free-speech',
    title: 'Constitutional Law: Free Speech',
    prompt: 'Analyze whether a city’s ordinance regulating protest sound levels violates the First Amendment.'
  }
];

/**
 * Essay prompt bank section.
 * @returns {HTMLElement}
 */
export function createEssayBankSection() {
  const section = document.createElement('section');
  section.className = 'essay-bank-section module-frame-alt';
  section.id = 'essay-bank';

  const prompts = ESSAY_PROMPTS.map((prompt) => `
    <article class="essay-prompt-card">
      <h3>${prompt.title}</h3>
      <p>${prompt.prompt}</p>
      <button class="btn-secondary essay-prompt-btn" data-prompt-id="${prompt.id}">
        Load Prompt into Editor
      </button>
    </article>
  `).join('');

  section.innerHTML = `
    <div class="essay-bank-header">
      <h2>📝 Essay Question Bank</h2>
      <p>
        Stock up on essay prompts, then write responses in the editor below. Reviews can be
        routed through OpenAI or a free community model like Llama 3 when configured.
      </p>
    </div>
    <div class="essay-prompt-grid">
      ${prompts}
    </div>
  `;

  section.addEventListener('click', (event) => {
    const button = event.target.closest('.essay-prompt-btn');
    if (!button) return;
    const promptId = button.dataset.promptId;
    const promptData = ESSAY_PROMPTS.find((item) => item.id === promptId);
    if (!promptData) return;
    document.dispatchEvent(new CustomEvent('essayPromptSelected', { detail: promptData }));
  });

  return section;
}
