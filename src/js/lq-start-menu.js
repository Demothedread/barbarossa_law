/**
 * Create a start menu allowing users to choose number of questions.
 * @param {(n:number)=>void} onStart Callback invoked when quiz should start.
 * @returns {HTMLElement}
 */
export function createStartMenu(onStart) {
  const container = document.createElement('div');
  container.className = 'start-menu';

  const label = document.createElement('label');
  label.textContent = 'Number of Questions:';

  const input = document.createElement('input');
  input.type = 'number';
  input.min = '1';
  input.max = '100';
  input.value = '5';

  const button = document.createElement('button');
  button.textContent = 'Start';
  button.addEventListener('click', () => {
    const count = parseInt(input.value, 10) || 1;
    onStart(count);
  });

  label.appendChild(input);
  container.appendChild(label);
  container.appendChild(button);

  return container;
}
