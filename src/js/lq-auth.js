/**
 * Authentication Manager for Law Quizzer
 * Handles user registration, login, logout, and token management
 */

const API_BASE = 'http://localhost:5001/api';

class AuthManager {
    constructor() {
        this.user = null;
        this.token = localStorage.getItem('authToken');
        this.onAuthChange = [];
        
        // Initialize user if token exists
        if (this.token) {
            this.validateToken();
        }
    }

    // Subscribe to authentication state changes
    subscribe(callback) {
        this.onAuthChange.push(callback);
    }

    // Notify subscribers of auth state changes
    notifyAuthChange() {
        this.onAuthChange.forEach(callback => callback(this.user, this.isAuthenticated()));
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.token && this.user;
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Get auth token
    getToken() {
        return this.token;
    }

    // Register new user
    async register(username, email, password) {
        try {
            const response = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Store token and user data
            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));

            this.notifyAuthChange();
            return { success: true, user: this.user };

        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    // Login user
    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and user data
            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));

            this.notifyAuthChange();
            return { success: true, user: this.user };

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Logout user
    async logout() {
        try {
            if (this.token) {
                await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local data regardless of server response
            this.token = null;
            this.user = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            this.notifyAuthChange();
        }
    }

    // Validate existing token
    async validateToken() {
        if (!this.token) return false;

        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                localStorage.setItem('user', JSON.stringify(this.user));
                this.notifyAuthChange();
                return true;
            } else {
                // Token is invalid, clear it
                this.token = null;
                this.user = null;
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                this.notifyAuthChange();
                return false;
            }
        } catch (error) {
            console.error('Token validation error:', error);
            this.token = null;
            this.user = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            this.notifyAuthChange();
            return false;
        }
    }

    // Update user preferences
    async updatePreferences(preferences) {
        if (!this.token) {
            throw new Error('User not authenticated');
        }

        try {
            const response = await fetch(`${API_BASE}/auth/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(preferences)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update preferences');
            }

            // Update local user data
            this.user = { ...this.user, ...preferences };
            localStorage.setItem('user', JSON.stringify(this.user));
            this.notifyAuthChange();

            return { success: true };

        } catch (error) {
            console.error('Update preferences error:', error);
            throw error;
        }
    }

    // Get auth headers for API requests
    getAuthHeaders() {
        if (this.token) {
            return {
                'Authorization': `Bearer ${this.token}`
            };
        }
        return {};
    }
}

// Create authentication modal HTML
function createAuthModal() {
    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content auth-modal">
            <span class="close" id="authModalClose">&times;</span>
            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="login">Login</button>
                <button class="auth-tab" data-tab="register">Register</button>
            </div>
            
            <div class="auth-form" id="loginForm">
                <h2>Welcome Back!</h2>
                <form id="loginFormElement">
                    <div class="form-group">
                        <label for="loginUsername">Username or Email:</label>
                        <input type="text" id="loginUsername" required>
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Password:</label>
                        <input type="password" id="loginPassword" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Login</button>
                </form>
            </div>
            
            <div class="auth-form hidden" id="registerForm">
                <h2>Join Law Quizzer!</h2>
                <form id="registerFormElement">
                    <div class="form-group">
                        <label for="registerUsername">Username:</label>
                        <input type="text" id="registerUsername" required minlength="3">
                    </div>
                    <div class="form-group">
                        <label for="registerEmail">Email:</label>
                        <input type="email" id="registerEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="registerPassword">Password:</label>
                        <input type="password" id="registerPassword" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label for="registerConfirmPassword">Confirm Password:</label>
                        <input type="password" id="registerConfirmPassword" required minlength="6">
                    </div>
                    <button type="submit" class="btn btn-primary">Register</button>
                </form>
            </div>
            
            <div class="auth-error" id="authError"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
}

// Show authentication modal
function showAuthModal(tab = 'login', onSuccess = null) {
    let modal = document.getElementById('authModal');
    if (!modal) {
        modal = createAuthModal();
        setupAuthModalEvents(modal, onSuccess);
    } else {
        // Update the callback for existing modal
        modal.dataset.successCallback = onSuccess ? 'true' : 'false';
        if (onSuccess) {
            modal._successCallback = onSuccess;
        }
    }
    
    // Switch to specified tab
    switchAuthTab(tab);
    modal.style.display = 'block';
}

// Hide authentication modal
function hideAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'none';
        clearAuthError();
    }
}

// Switch between login and register tabs
function switchAuthTab(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.add('hidden'));
    
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}Form`).classList.remove('hidden');
    
    clearAuthError();
}

// Show authentication error
function showAuthError(message) {
    const errorEl = document.getElementById('authError');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

// Clear authentication error
function clearAuthError() {
    const errorEl = document.getElementById('authError');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
}

// Setup modal event listeners
function setupAuthModalEvents(modal, onSuccess = null) {
    // Store the callback for later use
    if (onSuccess) {
        modal._successCallback = onSuccess;
    }
    
    // Close modal
    const closeBtn = modal.querySelector('#authModalClose');
    closeBtn.addEventListener('click', hideAuthModal);
    
    // Tab switching
    const tabs = modal.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchAuthTab(tab.dataset.tab);
        });
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideAuthModal();
        }
    });
    
    // Login form
    const loginForm = modal.querySelector('#loginFormElement');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            await authManager.login(username, password);
            hideAuthModal();
            
            // Call success callback if provided
            if (modal._successCallback) {
                modal._successCallback();
                modal._successCallback = null; // Clear after use
            }
        } catch (error) {
            showAuthError(error.message);
        }
    });
    
    // Register form
    const registerForm = modal.querySelector('#registerFormElement');
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        if (password !== confirmPassword) {
            showAuthError('Passwords do not match');
            return;
        }
        
        try {
            await authManager.register(username, email, password);
            hideAuthModal();
            
            // Call success callback if provided
            if (modal._successCallback) {
                modal._successCallback();
                modal._successCallback = null; // Clear after use
            }
        } catch (error) {
            showAuthError(error.message);
        }
    });
}

// Global auth manager instance
const authManager = new AuthManager();

// Export functions and auth manager
export {
    authManager,
    showAuthModal,
    hideAuthModal,
    AuthManager
};