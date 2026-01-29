# Dorothy Draper Design System for Law Quizzer

## Executive Summary

This design system implements a comprehensive Dorothy Draper-inspired visual identity for the Law Quizzer application, featuring three user-selectable themes that honor her maximalist aesthetic while maintaining quiz functionality and readability.

## Current Implementation Analysis

### ✅ Existing Dorothy Draper Elements
- **Color Palette**: Bright pastels established (`--draper-pink`, `--draper-coral`, `--draper-mint`, etc.)
- **Typography**: Multiple font families defined (`Playfair Display`, `Montserrat`, `Inter`)
- **Patterns**: Bold maximalist patterns using CSS gradients
- **Shadows**: Defined shadow system with bold black shadows
- **Scratch Paper**: Interactive scratch pad with Dorothy Draper styling

### 🔧 Identified Gaps
1. **No theme switching mechanism** - Only Classic mode currently implemented
2. **Missing Quiz Show and Friendly mode specifications**
3. **No audio integration with visual themes**
4. **Limited early-2000s kitschy effects**
5. **Patterns too bold** - Need subtle background textures for readability
6. **No localStorage persistence for theme preferences**

---

## Three Theme Modes Overview

### 1. Classic Mode (Dorothy Draper Core)
**Primary Dorothy Draper aesthetic with bright pastels and rococo maximalism**

### 2. Quiz Show Mode (1970s Game Show)
**Retro game show aesthetic inspired by 1970s television**

### 3. Friendly Mode (Baseball Theme)
**Sports-friendly aesthetic with baseball field colors**

---

## Color Palette Specifications

### Classic Mode (Dorothy Draper Core)
```css
:root[data-theme="classic"] {
  /* Primary Colors */
  --theme-primary: #FF1493;          /* Hot Pink */
  --theme-secondary: #50C878;        /* Emerald Green */
  --theme-accent: #4169E1;           /* Royal Blue */
  
  /* Pastels */
  --theme-pastel-pink: #FFB6C1;      /* Light Pink */
  --theme-pastel-mint: #98FB98;      /* Pale Green */
  --theme-pastel-lavender: #E6E6FA;  /* Lavender */
  --theme-pastel-lemon: #FFFACD;     /* Lemon Chiffon */
  --theme-pastel-sky: #87CEEB;       /* Sky Blue */
  --theme-pastel-peach: #FFDBAC;     /* Peach */
  
  /* Neutrals */
  --theme-white: #FFFFFF;
  --theme-black: #000000;
  --theme-text-primary: #000000;
  --theme-text-secondary: #333333;
  
  /* Backgrounds */
  --theme-bg-primary: #FFFFFF;
  --theme-bg-secondary: #F8F8FF;
  --theme-bg-accent: #FFF0F5;
}
```

### Quiz Show Mode (1970s Game Show)
```css
:root[data-theme="quiz-show"] {
  /* Primary Colors */
  --theme-primary: #FFD700;          /* Gold */
  --theme-secondary: #FF8C00;        /* Dark Orange */
  --theme-accent: #8B4513;           /* Saddle Brown */
  
  /* 1970s Palette */
  --theme-retro-gold: #DAA520;       /* Goldenrod */
  --theme-retro-orange: #FF7F00;     /* Orange */
  --theme-retro-brown: #A0522D;      /* Sienna */
  --theme-retro-avocado: #568203;    /* Avocado Green */
  --theme-retro-harvest: #CC8800;    /* Harvest Gold */
  --theme-retro-rust: #B7410E;       /* Rust */
  
  /* Neutrals */
  --theme-white: #FFF8DC;             /* Cornsilk */
  --theme-black: #2F1B14;             /* Dark Brown */
  --theme-text-primary: #2F1B14;
  --theme-text-secondary: #654321;
  
  /* Backgrounds */
  --theme-bg-primary: #FFF8DC;
  --theme-bg-secondary: #F5DEB3;
  --theme-bg-accent: #DEB887;
}
```

### Friendly Mode (Baseball Theme)
```css
:root[data-theme="friendly"] {
  /* Primary Colors */
  --theme-primary: #228B22;          /* Forest Green */
  --theme-secondary: #8B4513;        /* Saddle Brown */
  --theme-accent: #FF4500;           /* Orange Red */
  
  /* Baseball Colors */
  --theme-field-green: #3A7F3A;      /* Baseball Field Green */
  --theme-dirt-brown: #8B4513;       /* Infield Dirt */
  --theme-chalk-white: #FFFAFA;      /* Chalk Lines */
  --theme-team-red: #DC143C;         /* Team Red */
  --theme-team-blue: #1E90FF;        /* Team Blue */
  --theme-team-navy: #000080;        /* Team Navy */
  
  /* Neutrals */
  --theme-white: #FFFAFA;
  --theme-black: #2F2F2F;
  --theme-text-primary: #2F2F2F;
  --theme-text-secondary: #555555;
  
  /* Backgrounds */
  --theme-bg-primary: #FFFAFA;
  --theme-bg-secondary: #F0FFF0;
  --theme-bg-accent: #E0FFE0;
}
```

---

## Typography Hierarchy

### Classic Mode Typography
```css
:root[data-theme="classic"] {
  /* Display Fonts */
  --theme-font-display: 'Playfair Display', 'Georgia', serif;
  --theme-font-accent: 'Montserrat', 'Helvetica', sans-serif;
  --theme-font-script: 'Milkshake Script', cursive;
  
  /* Body Fonts */
  --theme-font-body: 'Inter', 'Helvetica', sans-serif;
  --theme-font-mono: 'Inconsolata', 'Courier New', monospace;
  
  /* Font Sizes */
  --theme-text-xxxl: 3.5rem;     /* Hero headings */
  --theme-text-xxl: 2.5rem;      /* Page titles */
  --theme-text-xl: 2rem;         /* Section headers */
  --theme-text-lg: 1.5rem;       /* Component titles */
  --theme-text-md: 1.125rem;     /* Body large */
  --theme-text-base: 1rem;       /* Body text */
  --theme-text-sm: 0.875rem;     /* Small text */
  --theme-text-xs: 0.75rem;      /* Captions */
}
```

### Quiz Show Mode Typography
```css
:root[data-theme="quiz-show"] {
  /* Display Fonts - 1970s Style */
  --theme-font-display: 'Impact', 'Arial Black', sans-serif;
  --theme-font-accent: 'Cooper Black', 'Arial Black', sans-serif;
  --theme-font-script: 'Brush Script MT', cursive;
  
  /* Body Fonts */
  --theme-font-body: 'Arial', 'Helvetica', sans-serif;
  --theme-font-mono: 'Courier New', monospace;
  
  /* Larger, bolder sizes for game show aesthetic */
  --theme-text-xxxl: 4rem;
  --theme-text-xxl: 3rem;
  --theme-text-xl: 2.25rem;
  --theme-text-lg: 1.75rem;
  --theme-text-md: 1.25rem;
  --theme-text-base: 1.125rem;
  --theme-text-sm: 1rem;
  --theme-text-xs: 0.875rem;
}
```

### Friendly Mode Typography
```css
:root[data-theme="friendly"] {
  /* Display Fonts - Sports Style */
  --theme-font-display: 'Roboto Condensed', 'Arial Narrow', sans-serif;
  --theme-font-accent: 'Open Sans', 'Arial', sans-serif;
  --theme-font-script: 'Kalam', 'Comic Sans MS', cursive;
  
  /* Body Fonts */
  --theme-font-body: 'Source Sans Pro', 'Arial', sans-serif;
  --theme-font-mono: 'Source Code Pro', 'Courier New', monospace;
  
  /* Clean, readable sizes */
  --theme-text-xxxl: 3rem;
  --theme-text-xxl: 2.25rem;
  --theme-text-xl: 1.875rem;
  --theme-text-lg: 1.5rem;
  --theme-text-md: 1.125rem;
  --theme-text-base: 1rem;
  --theme-text-sm: 0.875rem;
  --theme-text-xs: 0.75rem;
}
```

---

## Pattern Library - Subtle Background Textures

### Classic Mode Patterns
```css
:root[data-theme="classic"] {
  /* Subtle Dorothy Draper patterns - Low opacity for readability */
  --theme-pattern-subtle-dots: 
    radial-gradient(circle at 20px 20px, rgba(255, 20, 147, 0.1) 2px, transparent 2px);
  
  --theme-pattern-subtle-chevron: 
    repeating-linear-gradient(45deg, 
      rgba(80, 200, 120, 0.05) 0px, 
      rgba(80, 200, 120, 0.05) 10px, 
      transparent 10px, 
      transparent 20px);
  
  --theme-pattern-subtle-houndstooth:
    repeating-conic-gradient(from 0deg at 12px 12px, 
      rgba(0, 0, 0, 0.03) 0deg 90deg, 
      transparent 90deg 180deg);
  
  --theme-pattern-subtle-fleur:
    url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 5c-5 0-10 5-10 10s5 10 10 10 10-5 10-10-5-10-10-10z' fill='%23FF1493' opacity='0.08'/%3E%3C/svg%3E");
}
```

### Quiz Show Mode Patterns
```css
:root[data-theme="quiz-show"] {
  /* 1970s geometric patterns */
  --theme-pattern-subtle-geometric:
    repeating-linear-gradient(90deg,
      rgba(255, 215, 0, 0.1) 0px,
      rgba(255, 215, 0, 0.1) 8px,
      transparent 8px,
      transparent 16px);
  
  --theme-pattern-subtle-sunburst:
    repeating-conic-gradient(from 0deg at 50% 50%,
      rgba(255, 140, 0, 0.05) 0deg 30deg,
      transparent 30deg 60deg);
  
  --theme-pattern-subtle-diamonds:
    repeating-linear-gradient(45deg,
      rgba(139, 69, 19, 0.08) 0px,
      rgba(139, 69, 19, 0.08) 15px,
      transparent 15px,
      transparent 30px);
}
```

### Friendly Mode Patterns
```css
:root[data-theme="friendly"] {
  /* Baseball-inspired patterns */
  --theme-pattern-subtle-grass:
    repeating-linear-gradient(90deg,
      rgba(34, 139, 34, 0.06) 0px,
      rgba(34, 139, 34, 0.06) 2px,
      transparent 2px,
      transparent 4px);
  
  --theme-pattern-subtle-diamond:
    repeating-conic-gradient(from 45deg at 25px 25px,
      rgba(139, 69, 19, 0.04) 0deg 90deg,
      transparent 90deg 180deg);
  
  --theme-pattern-subtle-stitches:
    repeating-linear-gradient(0deg,
      rgba(220, 20, 60, 0.1) 0px,
      rgba(220, 20, 60, 0.1) 1px,
      transparent 1px,
      transparent 8px);
}
```

---

## Component Design Specifications

### Navigation Bar
```css
/* Theme-adaptive navigation */
.header {
  background: var(--theme-bg-primary);
  border-bottom: 3px solid var(--theme-primary);
  background-image: var(--theme-pattern-subtle-chevron);
}

.header-title-compact {
  font-family: var(--theme-font-display);
  color: var(--theme-primary);
  text-shadow: 2px 2px 0 var(--theme-accent);
}

.nav-btn {
  background: var(--theme-bg-secondary);
  color: var(--theme-text-primary);
  border: 2px solid var(--theme-primary);
  font-family: var(--theme-font-accent);
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: var(--theme-primary);
  color: var(--theme-white);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.nav-btn.active {
  background: var(--theme-accent);
  color: var(--theme-white);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}
```

### Quiz Components
```css
/* Question display */
.question-container {
  background: var(--theme-bg-primary);
  border: 4px solid var(--theme-primary);
  border-radius: 16px;
  padding: 2rem;
  margin: 1.5rem 0;
  background-image: var(--theme-pattern-subtle-dots);
  box-shadow: 8px 8px 0 var(--theme-accent);
}

.question-text {
  font-family: var(--theme-font-body);
  font-size: var(--theme-text-lg);
  color: var(--theme-text-primary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

/* Answer choices */
.choices-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 1rem;
}

.choice-item {
  background: var(--theme-bg-secondary);
  border: 3px solid var(--theme-primary);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--theme-font-body);
  font-size: var(--theme-text-base);
}

.choice-item:hover {
  background: var(--theme-pastel-mint);
  transform: translateX(4px);
  box-shadow: 4px 4px 0 var(--theme-accent);
}

.choice-item.selected {
  background: var(--theme-primary);
  color: var(--theme-white);
  box-shadow: 6px 6px 0 var(--theme-accent);
  transform: scale(1.02);
}

.choice-item.eliminated {
  background: repeating-linear-gradient(45deg,
    rgba(255, 0, 0, 0.1),
    rgba(255, 0, 0, 0.1) 10px,
    transparent 10px,
    transparent 20px);
  opacity: 0.6;
  text-decoration: line-through;
}
```

### Buttons and Interactive Elements
```css
/* Primary buttons */
.btn-primary {
  background: var(--theme-primary);
  color: var(--theme-white);
  border: 3px solid var(--theme-accent);
  border-radius: 8px;
  padding: 0.75rem 2rem;
  font-family: var(--theme-font-accent);
  font-weight: 600;
  font-size: var(--theme-text-base);
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-primary:hover {
  background: var(--theme-accent);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Secondary buttons */
.btn-secondary {
  background: var(--theme-bg-secondary);
  color: var(--theme-primary);
  border: 2px solid var(--theme-primary);
  border-radius: 8px;
  padding: 0.5rem 1.5rem;
  font-family: var(--theme-font-body);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: var(--theme-primary);
  color: var(--theme-white);
}
```

### Modals and Overlays
```css
.modal {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--theme-bg-primary);
  border: 4px solid var(--theme-primary);
  border-radius: 20px;
  padding: 2rem;
  max-width: 600px;
  background-image: var(--theme-pattern-subtle-fleur);
  box-shadow: 12px 12px 0 var(--theme-accent);
}

.modal-header {
  border-bottom: 3px solid var(--theme-primary);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.modal-title {
  font-family: var(--theme-font-display);
  font-size: var(--theme-text-xl);
  color: var(--theme-primary);
  margin: 0;
}

.modal-close {
  background: var(--theme-accent);
  color: var(--theme-white);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: var(--theme-primary);
  transform: rotate(90deg);
}
```

---

## Theme Switching Mechanism

### HTML Structure
```html
<!-- Theme selector in navigation -->
<div class="theme-selector">
  <button class="theme-btn" data-theme="classic">Classic</button>
  <button class="theme-btn" data-theme="quiz-show">Quiz Show</button>
  <button class="theme-btn" data-theme="friendly">Friendly</button>
</div>
```

### JavaScript Implementation
```javascript
// Theme switching functionality
class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('lawquizzer-theme') || 'classic';
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.bindEvents();
  }

  applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    this.currentTheme = themeName;
    localStorage.setItem('lawquizzer-theme', themeName);
    
    // Update active theme button
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === themeName);
    });

    // Trigger theme-specific audio
    this.playThemeTransitionSound(themeName);
  }

  bindEvents() {
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.applyTheme(btn.dataset.theme);
      });
    });
  }

  playThemeTransitionSound(theme) {
    const sounds = {
      'classic': 'assets/audio/theme/classic-chime.mp3',
      'quiz-show': 'assets/audio/theme/game-show-ding.mp3',
      'friendly': 'assets/audio/theme/baseball-crack.mp3'
    };

    if (sounds[theme]) {
      const audio = new Audio(sounds[theme]);
      audio.volume = 0.3;
      audio.play().catch(console.log);
    }
  }
}

// Initialize theme manager
const themeManager = new ThemeManager();
```

### Theme Selector Styling
```css
.theme-selector {
  display: flex;
  gap: 0.5rem;
  background: var(--theme-bg-secondary);
  border: 2px solid var(--theme-primary);
  border-radius: 12px;
  padding: 0.5rem;
  margin-left: auto;
}

.theme-btn {
  background: transparent;
  color: var(--theme-text-primary);
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-family: var(--theme-font-accent);
  font-size: var(--theme-text-sm);
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-btn:hover {
  background: var(--theme-primary);
  color: var(--theme-white);
}

.theme-btn.active {
  background: var(--theme-accent);
  color: var(--theme-white);
  border-color: var(--theme-primary);
}
```

---

## Audio Integration Requirements

### Theme-Specific Sound Assets Needed

#### Classic Mode Audio
- **Transition**: `classic-chime.mp3` - Elegant bell chime
- **Click**: `classic-click.wav` - Soft, refined click
- **Correct**: `classic-success.mp3` - Triumphant classical flourish
- **Wrong**: `classic-error.mp3` - Gentle disappointment tone
- **Timer**: `classic-tick.wav` - Sophisticated metronome

#### Quiz Show Mode Audio
- **Transition**: `game-show-ding.mp3` - 1970s game show bell
- **Click**: `buzzer-click.wav` - Game show buzzer sound
- **Correct**: `game-show-win.mp3` - Victory fanfare with applause
- **Wrong**: `game-show-wrong.mp3` - "Wah wah wah" trombone
- **Timer**: `game-show-tick.wav` - Dramatic countdown tick

#### Friendly Mode Audio
- **Transition**: `baseball-crack.mp3` - Baseball bat crack
- **Click**: `baseball-pop.wav` - Mitt catching ball
- **Correct**: `baseball-cheer.mp3` - Crowd cheering
- **Wrong**: `baseball-strike.mp3` - Umpire "strike" call
- **Timer**: `baseball-tick.wav` - Gentle scoreboard tick

### Audio Integration Points
```javascript
// Enhanced audio feedback system
class ThemeAudioManager {
  constructor(theme) {
    this.theme = theme;
    this.sounds = this.loadThemeSounds(theme);
  }

  loadThemeSounds(theme) {
    const basePath = `assets/audio/theme/${theme}/`;
    return {
      click: new Audio(`${basePath}click.wav`),
      correct: new Audio(`${basePath}correct.mp3`),
      wrong: new Audio(`${basePath}wrong.mp3`),
      timer: new Audio(`${basePath}timer.wav`),
      transition: new Audio(`${basePath}transition.mp3`)
    };
  }

  playSound(soundType, volume = 0.5) {
    if (this.sounds[soundType]) {
      this.sounds[soundType].volume = volume;
      this.sounds[soundType].currentTime = 0;
      this.sounds[soundType].play().catch(console.log);
    }
  }

  updateTheme(newTheme) {
    this.theme = newTheme;
    this.sounds = this.loadThemeSounds(newTheme);
  }
}
```

---

## Early-2000s Kitschy Visual Effects

### CSS Animations and Effects
```css
/* Exploding click effect */
@keyframes explode-click {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}

.click-explosion {
  position: absolute;
  pointer-events: none;
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, var(--theme-primary) 0%, transparent 70%);
  border-radius: 50%;
  animation: explode-click 0.6s ease-out;
}

/* Gel overlay effects */
.gel-overlay {
  position: relative;
  overflow: hidden;
}

.gel-overlay::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.3) 0%, 
    transparent 50%, 
    rgba(255, 255, 255, 0.1) 100%);
  pointer-events: none;
}

/* Dated icon effects */
.retro-icon {
  filter: drop-shadow(2px 2px 0 var(--theme-accent));
  animation: retro-pulse 2s infinite;
}

@keyframes retro-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* ASCII art integration */
.ascii-decoration::before {
  content: "♪ ♫ ♪ ♫";
  font-family: monospace;
  color: var(--theme-primary);
  opacity: 0.6;
  animation: ascii-dance 3s infinite;
}

@keyframes ascii-dance {
  0%, 100% { transform: translateY(0); }
  25% { transform: translateY(-2px); }
  75% { transform: translateY(2px); }
}

/* Sparkle effects */
.sparkle-container {
  position: relative;
}

.sparkle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--theme-primary);
  border-radius: 50%;
  animation: sparkle 1.5s infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}
```

### JavaScript for Interactive Effects
```javascript
// Early-2000s click effects
function createClickExplosion(event) {
  const explosion = document.createElement('div');
  explosion.className = 'click-explosion';
  explosion.style.left = event.clientX + 'px';
  explosion.style.top = event.clientY + 'px';
  document.body.appendChild(explosion);
  
  setTimeout(() => {
    explosion.remove();
  }, 600);
}

// Sparkle generation
function createSparkles(element) {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.style.left = Math.random() * 100 + '%';
      sparkle.style.top = Math.random() * 100 + '%';
      sparkle.style.animationDelay = Math.random() * 1 + 's';
      element.appendChild(sparkle);
      
      setTimeout(() => sparkle.remove(), 1500);
    }, i * 100);
  }
}

// Apply effects to interactive elements
document.addEventListener('click', createClickExplosion);
document.querySelectorAll('.btn-primary').forEach(btn => {
  btn.addEventListener('click', (e) => {
    createSparkles(e.target.closest('.sparkle-container') || e.target);
  });
});
```

---

## Layout Principles and Responsive Design

### Grid System
```css
/* Responsive grid for all themes */
.quiz-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width: 768px) {
  .quiz-grid {
    grid-template-columns: 2fr 1fr;
    gap: 3rem;
  }
}

@media (min-width: 1200px) {
  .quiz-grid {
    grid-template-columns: 3fr 1fr;
    gap: 4rem;
  }
}

/* Question layout */
.question-section {
  grid-column: 1;
}

.sidebar-section {
  grid-column: 2;
}

@media (max-width: 767px) {
  .question-section,
  .sidebar-section {
    grid-column: 1;
  }
}
```

### Mobile Responsiveness
```css
/* Mobile-first approach */
@media (max-width: 767px) {
  .header-content-compact {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .nav-centered {
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .nav-btn {
    min-width: auto;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
  
  .theme-selector {
    order: -1;
    width: 100%;
    justify-content: center;
  }
  
  .question-container {
    padding: 1.5rem;
    margin: 1rem 0;
  }
  
  .choices-list {
    gap: 0.75rem;
  }
  
  .choice-item {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
}

/* Tablet adjustments */
@media (min-width: 768px) and (max-width: 1199px) {
  .header-content-compact {
    padding: 1rem 1.5rem;
  }
  
  .nav-centered {
    gap: 1.5rem;
  }
  
  .question-container {
    padding: 1.75rem;
  }
}
```

---

## Implementation Guidelines

### File Structure
```
src/
├── css/
│   ├── themes/
│   │   ├── classic.css          # Classic mode variables and overrides
│   │   ├── quiz-show.css        # Quiz show mode variables and overrides
│   │   └── friendly.css         # Friendly mode variables and overrides
│   ├── components/
│   │   ├── navigation.css       # Theme-adaptive navigation
│   │   ├── quiz-interface.css   # Quiz components
│   │   ├── modals.css          # Modal and overlay styling
│   │   └── effects.css         # Kitschy effects and animations
│   ├── patterns/
│   │   ├── classic-patterns.css # Dorothy Draper patterns
│   │   ├── retro-patterns.css   # 1970s patterns
│   │   └── sports-patterns.css  # Baseball patterns
│   └── base/
│       ├── reset.css           # CSS reset
│       ├── typography.css      # Base typography
│       └── utilities.css       # Utility classes
├── js/
│   ├── theme-manager.js        # Theme switching logic
│   ├── audio-manager.js        # Theme-specific audio
│   └── effects.js              # Visual effects controller
└── assets/
    ├── audio/
    │   └── theme/
    │       ├── classic/
    │       ├── quiz-show/
    │       └── friendly/
    └── fonts/
        ├── milkshake-script.ttf
        ├── inconsolata.ttf
        └── [additional theme fonts]
```

### CSS Loading Strategy
```html
<!-- Base styles always loaded -->
<link rel="stylesheet" href="css/base/reset.css">
<link rel="stylesheet" href="css/base/typography.css">
<link rel="stylesheet" href="css/base/utilities.css">

<!-- Component styles -->
<link rel="stylesheet" href="css/components/navigation.css">
<link rel="stylesheet" href="css/components/quiz-interface.css">
<link rel="stylesheet" href="css/components/modals.css">
<link rel="stylesheet" href="css/components/effects.css">

<!-- Theme-specific styles (all loaded, controlled by CSS custom properties) -->
<link rel="stylesheet" href="css/themes/classic.css">
<link rel="stylesheet" href="css/themes/quiz-show.css">
<link rel="stylesheet" href="css/themes/friendly.css">

<!-- Pattern libraries -->
<link rel="stylesheet" href="css/patterns/classic-patterns.css">
<link rel="stylesheet" href="css/patterns/retro-patterns.css">
<link rel="stylesheet" href="css/patterns/sports-patterns.css">
```

### Integration with Existing Code
1. **Minimal Breaking Changes**: New theme system uses CSS custom properties that gracefully fallback
2. **Progressive Enhancement**: Existing functionality works without themes
3. **Modular Implementation**: Each component can be themed independently
4. **Performance Optimized**: CSS custom properties allow instant theme switching

### Testing Requirements
- **Cross-browser compatibility**: Chrome, Firefox, Safari, Edge
- **Mobile responsiveness**: iOS Safari, Android Chrome
- **Accessibility**: WCAG 2.1 AA compliance maintained across all themes
- **Performance**: Theme switching under 100ms
- **Audio fallbacks**: Graceful degradation when audio fails

---

## Next Steps for Implementation

1. **Create theme-specific CSS files** with complete variable definitions
2. **Implement JavaScript theme manager** with localStorage persistence
3. **Design and source theme-specific audio assets**
4. **Create interactive visual effects system**
5. **Test responsive behavior across all themes**
6. **Integrate with existing quiz interface components**
7. **Add accessibility features and ARIA labels**
8. **Performance optimization and lazy loading**

---

*This design system maintains Dorothy Draper's maximalist vision while ensuring the Law Quizzer remains functional, accessible, and engaging across all three theme modes.*