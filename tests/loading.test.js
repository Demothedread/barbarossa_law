import { showLoading, hideLoading, showError, hideError } from '../src/js/lq-loading.js';

document.body.innerHTML = `
  <div id="app"></div>
  <div id="loading"><p></p></div>
  <div id="error"><span id="errorMessage"></span></div>
`;

test('show/hide loading toggles visibility', () => {
  showLoading('Wait');
  expect(document.getElementById('loading').style.display).toBe('block');
  hideLoading();
  expect(document.getElementById('loading').style.display).toBe('none');
});

test('show/hide error toggles visibility', () => {
  showError('Oops');
  expect(document.getElementById('error').style.display).toBe('block');
  hideError();
  expect(document.getElementById('error').style.display).toBe('none');
});
