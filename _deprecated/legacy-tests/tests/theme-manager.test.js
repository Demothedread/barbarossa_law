import { jest } from '@jest/globals';
import { ThemeManager } from '../src/js/theme-manager.js';

describe('ThemeManager', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div class="nav-centered"></div>';
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  test('applyTheme falls back to classic for unknown themes', () => {
    const audioSpy = jest.spyOn(ThemeManager.prototype, 'initAudioManager')
      .mockImplementation(() => {});

    const manager = new ThemeManager();
    manager.applyTheme('unknown-theme');

    expect(document.documentElement.getAttribute('data-theme')).toBe('classic');
    expect(document.body.classList.contains('theme-classic')).toBe(true);

    audioSpy.mockRestore();
  });

  test('applyTheme updates theme and localStorage', () => {
    const audioSpy = jest.spyOn(ThemeManager.prototype, 'initAudioManager')
      .mockImplementation(() => {});

    const manager = new ThemeManager();
    manager.applyTheme('friendly');

    expect(manager.getCurrentTheme()).toBe('friendly');
    expect(localStorage.getItem('lawquizzer-theme')).toBe('friendly');
    expect(document.body.classList.contains('theme-friendly')).toBe(true);

    audioSpy.mockRestore();
  });
});
