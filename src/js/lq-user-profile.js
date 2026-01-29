/**
 * User Profile Manager for Law Quizzer
 * Handles user profile display and preferences management
 */

import { authManager } from "./lq-auth.js";
import { getIconString } from "./lunaire-icons.js";
import { ThemeManager } from "./theme-manager.js";

class UserProfileManager {
  constructor() {
    this.themeManager = new ThemeManager();

    // Subscribe to auth changes
    authManager.subscribe((user, isAuthenticated) => {
      this.updateUIForAuthState(user, isAuthenticated);
    });
  }

  // Update UI based on authentication state
  updateUIForAuthState(user, isAuthenticated) {
    const loginBtn = document.getElementById("loginBtn");
    const userProfileBtn = document.getElementById("userProfileBtn");
    const userInfo = document.getElementById("userInfo");

    if (isAuthenticated && user) {
      // Show user profile, hide login button
      if (loginBtn) loginBtn.style.display = "none";
      if (userProfileBtn) {
        userProfileBtn.style.display = "block";
        userProfileBtn.textContent = user.username;
      }
      if (userInfo) {
        userInfo.innerHTML = `Welcome, ${user.username}!`;
        userInfo.style.display = "block";
      }

      // Apply user preferences
      this.applyUserPreferences(user);
    } else {
      // Show login button, hide user profile
      if (loginBtn) loginBtn.style.display = "block";
      if (userProfileBtn) userProfileBtn.style.display = "none";
      if (userInfo) userInfo.style.display = "none";
    }
  }

  // Apply user preferences to the application
  applyUserPreferences(user) {
    if (user.theme_preference) {
      this.themeManager.setTheme(user.theme_preference);
    }

    // Apply audio preferences if available
    if (typeof user.audio_enabled !== "undefined") {
      const audioEnabled = user.audio_enabled;
      // Apply audio settings to the application
      document.body.dataset.audioEnabled = audioEnabled;
    }

    if (typeof user.volume_level !== "undefined") {
      // Apply volume settings
      document.body.dataset.volumeLevel = user.volume_level;
    }
  }

  // Create user profile modal
  createProfileModal() {
    const modal = document.createElement("div");
    modal.id = "profileModal";
    modal.className = "modal";

    const user = authManager.getCurrentUser();
    if (!user) return null;

    modal.innerHTML = `
            <div class="modal-content profile-modal">
                <span class="close" id="profileModalClose">&times;</span>
                <h2>User Profile</h2>
                
                <div class="profile-section">
                    <h3>Account Information</h3>
                    <div class="profile-info">
                        <p><strong>Username:</strong> ${user.username}</p>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Member since:</strong> ${new Date(
                          user.created_at,
                        ).toLocaleDateString()}</p>
                        ${
                          user.last_login
                            ? `<p><strong>Last login:</strong> ${new Date(
                                user.last_login,
                              ).toLocaleDateString()}</p>`
                            : ""
                        }
                    </div>
                </div>

                <div class="profile-section">
                    <h3>Preferences</h3>
                    <form id="preferencesForm">
                        <div class="form-group">
                            <label for="themeSelect">Theme:</label>
                            <select id="themeSelect" name="theme_preference">
                                <option value="classic" ${
                                  user.theme_preference === "classic"
                                    ? "selected"
                                    : ""
                                }>Dorothy Draper Classic</option>
                                <option value="dark" ${
                                  user.theme_preference === "dark"
                                    ? "selected"
                                    : ""
                                }>Dark Mode</option>
                                <option value="light" ${
                                  user.theme_preference === "light"
                                    ? "selected"
                                    : ""
                                }>Light Mode</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="audioEnabled" name="audio_enabled" 
                                       ${user.audio_enabled ? "checked" : ""}>
                                Enable Audio Effects
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="backgroundMusicEnabled" name="background_music_enabled" 
                                       ${
                                         user.background_music_enabled
                                           ? "checked"
                                           : ""
                                       }>
                                Enable Background Music
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label for="volumeLevel">Volume Level:</label>
                            <input type="range" id="volumeLevel" name="volume_level" 
                                   min="0" max="1" step="0.1" value="${
                                     user.volume_level || 0.7
                                   }">
                            <span id="volumeDisplay">${Math.round(
                              (user.volume_level || 0.7) * 100,
                            )}%</span>
                        </div>
                        
                        <div class="form-group">
                            <label for="preferredSubjects">Preferred Subjects (comma-separated):</label>
                            <input type="text" id="preferredSubjects" name="preferred_subjects" 
                                   value="${user.preferred_subjects || ""}" 
                                   placeholder="e.g., Constitutional Law, Criminal Law">
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save Preferences</button>
                            <button type="button" class="btn btn-secondary" id="logoutBtn">Logout</button>
                        </div>
                    </form>
                </div>
                
                <div class="profile-error" id="profileError"></div>
                <div class="profile-success" id="profileSuccess"></div>
            </div>
        `;

    document.body.appendChild(modal);
    this.setupProfileModalEvents(modal);
    return modal;
  }

  // Setup profile modal event listeners
  setupProfileModalEvents(modal) {
    // Close modal
    const closeBtn = modal.querySelector("#profileModalClose");
    closeBtn.addEventListener("click", () => this.hideProfileModal());

    // Close modal when clicking outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.hideProfileModal();
      }
    });

    // Volume slider update
    const volumeSlider = modal.querySelector("#volumeLevel");
    const volumeDisplay = modal.querySelector("#volumeDisplay");
    volumeSlider.addEventListener("input", () => {
      volumeDisplay.textContent = Math.round(volumeSlider.value * 100) + "%";
    });

    // Preferences form
    const preferencesForm = modal.querySelector("#preferencesForm");
    preferencesForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.savePreferences(modal);
    });

    // Logout button
    const logoutBtn = modal.querySelector("#logoutBtn");
    logoutBtn.addEventListener("click", async () => {
      await authManager.logout();
      this.hideProfileModal();
    });
  }

  // Save user preferences
  async savePreferences(modal) {
    try {
      const formData = new FormData(modal.querySelector("#preferencesForm"));
      const preferences = {
        theme_preference: formData.get("theme_preference"),
        audio_enabled: formData.has("audio_enabled"),
        background_music_enabled: formData.has("background_music_enabled"),
        volume_level: parseFloat(formData.get("volume_level")),
        preferred_subjects: formData.get("preferred_subjects"),
      };

      await authManager.updatePreferences(preferences);

      // Apply preferences immediately
      this.applyUserPreferences(preferences);

      // Show success message
      this.showProfileMessage("Preferences saved successfully!", "success");
    } catch (error) {
      console.error("Error saving preferences:", error);
      this.showProfileMessage(error.message, "error");
    }
  }

  // Show profile message
  showProfileMessage(message, type) {
    const errorEl = document.getElementById("profileError");
    const successEl = document.getElementById("profileSuccess");

    // Clear both message types
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.style.display = "none";
    }
    if (successEl) {
      successEl.textContent = "";
      successEl.style.display = "none";
    }

    // Show appropriate message
    if (type === "error" && errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = "block";
    } else if (type === "success" && successEl) {
      successEl.textContent = message;
      successEl.style.display = "block";
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        successEl.style.display = "none";
      }, 3000);
    }
  }

  // Show profile modal
  showProfileModal() {
    if (!authManager.isAuthenticated()) {
      console.warn("User not authenticated");
      return;
    }

    let modal = document.getElementById("profileModal");
    if (!modal) {
      modal = this.createProfileModal();
    }

    if (modal) {
      modal.style.display = "block";
    }
  }

  // Hide profile modal
  hideProfileModal() {
    const modal = document.getElementById("profileModal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  // Create user menu for the header
  createUserMenu() {
    const user = authManager.getCurrentUser();
    if (!user) return null;

    const userMenu = document.createElement("div");
    userMenu.className = "user-menu";
    userMenu.innerHTML = `
            <button class="user-menu-toggle" id="userMenuToggle">
                ${user.username} ${getIconString("chevronDown", 12)}
            </button>
            <div class="user-menu-dropdown" id="userMenuDropdown">
                <a href="#" id="showProfile">Profile</a>
                <a href="#" id="userLogout">Logout</a>
            </div>
        `;

    // Setup menu events
    const toggle = userMenu.querySelector("#userMenuToggle");
    const dropdown = userMenu.querySelector("#userMenuDropdown");
    const showProfile = userMenu.querySelector("#showProfile");
    const userLogout = userMenu.querySelector("#userLogout");

    toggle.addEventListener("click", () => {
      dropdown.classList.toggle("show");
    });

    showProfile.addEventListener("click", (e) => {
      e.preventDefault();
      this.showProfileModal();
      dropdown.classList.remove("show");
    });

    userLogout.addEventListener("click", async (e) => {
      e.preventDefault();
      await authManager.logout();
      dropdown.classList.remove("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!userMenu.contains(e.target)) {
        dropdown.classList.remove("show");
      }
    });

    return userMenu;
  }

  // Initialize user profile UI
  init() {
    // Initial UI update
    const user = authManager.getCurrentUser();
    const isAuthenticated = authManager.isAuthenticated();
    this.updateUIForAuthState(user, isAuthenticated);
  }
}

// Create global instance
const userProfileManager = new UserProfileManager();

export { userProfileManager, UserProfileManager };
