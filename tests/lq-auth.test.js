import { jest } from '@jest/globals';
import { AuthManager } from '../src/js/lq-auth.js';

describe('AuthManager', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  test('register stores token and user data on success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'token-123',
        user: { id: 1, username: 'alice' }
      })
    });

    const manager = new AuthManager();
    const result = await manager.register('alice', 'alice@example.com', 'password123');

    expect(result.success).toBe(true);
    expect(manager.getToken()).toBe('token-123');
    expect(manager.getCurrentUser()).toEqual({ id: 1, username: 'alice' });
    expect(localStorage.getItem('authToken')).toBe('token-123');
  });

  test('login surfaces API errors', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' })
    });

    const manager = new AuthManager();

    await expect(manager.login('alice', 'badpass')).rejects.toThrow('Invalid credentials');
  });

  test('updatePreferences throws when unauthenticated', async () => {
    const manager = new AuthManager();

    await expect(manager.updatePreferences({ theme_preference: 'friendly' }))
      .rejects.toThrow('User not authenticated');
  });

  test('validateToken clears invalid token', async () => {
    localStorage.setItem('authToken', 'expired-token');
    global.fetch.mockResolvedValue({ ok: false, json: async () => ({}) });

    const manager = new AuthManager();
    await manager.validateToken();

    expect(manager.getToken()).toBeNull();
    expect(manager.getCurrentUser()).toBeNull();
  });
});
