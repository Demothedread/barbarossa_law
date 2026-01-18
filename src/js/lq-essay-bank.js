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

  // Create header
  const header = document.createElement('div');
  header.className = 'essay-bank-header';
  
  const headerTitle = document.createElement('h2');
  headerTitle.textContent = '📝 Essay Question Bank';
  
  const headerDesc = document.createElement('p');
  headerDesc.textContent = 'Stock up on essay prompts, then write responses in the editor below. Reviews can be routed through OpenAI or a free community model like Llama 3 when configured.';
  
  header.appendChild(headerTitle);
  header.appendChild(headerDesc);

  // Create prompt grid
  const grid = document.createElement('div');
  grid.className = 'essay-prompt-grid';

  ESSAY_PROMPTS.forEach((prompt) => {
    const article = document.createElement('article');
    article.className = 'essay-prompt-card';

    const title = document.createElement('h3');
    title.textContent = prompt.title;

    const text = document.createElement('p');
    text.textContent = prompt.prompt;

    const button = document.createElement('button');
    button.className = 'btn-secondary essay-prompt-btn';
    button.dataset.promptId = prompt.id;
    button.textContent = 'Load Prompt into Editor';

    article.appendChild(title);
    article.appendChild(text);
    article.appendChild(button);
    grid.appendChild(article);
  });

  section.appendChild(header);
  section.appendChild(grid);

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
