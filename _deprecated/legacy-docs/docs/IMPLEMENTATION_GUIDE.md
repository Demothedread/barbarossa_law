# Dorothy Draper Design System - Implementation Guide

## Quick Start Integration

This guide shows how to integrate the Dorothy Draper design system into the existing Law Quizzer application with minimal disruption to current functionality.

## Step 1: Add CSS Files to HTML

Update [`src/index.html`](../src/index.html) to include the new theme files:

```html
<!-- Add these after the existing CSS imports -->
<link rel="stylesheet" href="css/themes/classic.css">
<link rel="stylesheet" href="css/themes/quiz-show.css">
<link rel="stylesheet" href="css/themes/friendly.css">
<link rel="stylesheet" href="css/components/theme-selector.css">
```

## Step 2: Add JavaScript Integration

Add the theme manager script before the closing `</body>` tag:

```html
<!-- Add before closing </body> tag -->
<script src="js/theme-manager.js"></script>
```

## Step 3: Update Existing Components

### Navigation Integration

The theme selector will automatically be added to the navigation. No changes required to existing nav structure.

### Quiz Components

Update [`src/js/lq-quiz.js`](../src/js/lq-quiz.js) to support theme-aware audio:

```javascript
// Add to choice click handler (around line 11)
button.addEventListener('click', () => {
  // Existing click logic...
  
  // Add theme-aware audio
  if (window.themeManager && window.themeManager.audioManager) {
    window.themeManager.audioManager.playSound('click', 0.3);
  }
  
  // Existing visual feedback code...
});
```

### Quiz Results Integration

Update [`src/js/lq-quiz.js`](../src/js/lq-quiz.js) result handlers:

```javascript
// In finishQuiz function or similar
function handleCorrectAnswer() {
  // Existing correct answer logic...
  
  // Add theme-aware success audio
  if (window.themeManager && window.themeManager.audioManager) {
    window.themeManager.audioManager.playSound('correct', 0.5);
  }
}

function handleWrongAnswer() {
  // Existing wrong answer logic...
  
  // Add theme-aware error audio
  if (window.themeManager && window.themeManager.audioManager) {
    window.themeManager.audioManager.playSound('wrong', 0.4);
  }
}
```

## Step 4: Update CSS Classes

### Add Theme-Aware Classes to Existing Elements

Update existing HTML/JavaScript to include theme-compatible classes:

```javascript
// In lq-quiz.js or lq-start-menu.js
const questionContainer = document.createElement('div');
questionContainer.className = 'question-container'; // Already theme-compatible

const choiceItem = document.createElement('li');
choiceItem.className = 'choice-item'; // Already theme-compatible

const button = document.createElement('button');
button.className = 'btn-primary'; // Already theme-compatible
```

### Add Sparkle Containers for Interactive Elements

```javascript
// Wrap important interactive elements
const buttonContainer = document.createElement('div');
buttonContainer.className = 'sparkle-container';
buttonContainer.appendChild(button);
```

## Step 5: Audio Asset Setup

Create the required audio directory structure:

```
src/assets/audio/theme/
├── classic/
│   ├── click.wav
│   ├── correct.mp3
│   ├── wrong.mp3
│   ├── timer.wav
│   └── transition.mp3
├── quiz-show/
│   ├── click.wav
│   ├── correct.mp3
│   ├── wrong.mp3
│   ├── timer.wav
│   └── transition.mp3
└── friendly/
    ├── click.wav
    ├── correct.mp3
    ├── wrong.mp3
    ├── timer.wav
    └── transition.mp3
```

### Audio Requirements by Theme

#### Classic Mode
- **click.wav**: Elegant bell chime (200ms)
- **correct.mp3**: Triumphant classical flourish (2-3s)
- **wrong.mp3**: Gentle disappointment tone (1-2s)
- **timer.wav**: Sophisticated metronome tick (500ms)
- **transition.mp3**: Elegant bell sequence (1s)

#### Quiz Show Mode
- **click.wav**: Game show buzzer sound (300ms)
- **correct.mp3**: Victory fanfare with applause (3-4s)
- **wrong.mp3**: "Wah wah wah" trombone (2s)
- **timer.wav**: Dramatic countdown tick (700ms)
- **transition.mp3**: 1970s game show bell (1.5s)

#### Friendly Mode
- **click.wav**: Baseball mitt catching ball (200ms)
- **correct.mp3**: Crowd cheering (2-3s)
- **wrong.mp3**: Umpire "strike" call (1s)
- **timer.wav**: Gentle scoreboard tick (400ms)
- **transition.mp3**: Baseball bat crack (800ms)

## Step 6: Optional Enhancements

### Add Visual Effects to Existing Buttons

```javascript
// In any button click handler
button.addEventListener('click', (event) => {
  // Existing logic...
  
  // Add sparkle effect for important actions
  if (window.effectsManager) {
    window.effectsManager.createSparkles(event.target);
  }
});
```

### Theme-Aware Timer Integration

Update [`src/js/lq-timer.js`](../src/js/lq-timer.js) if it exists:

```javascript
// In timer tick function
function onTimerTick() {
  // Existing timer logic...
  
  // Add theme-aware timer sound
  if (window.themeManager && window.themeManager.audioManager) {
    window.themeManager.audioManager.playSound('timer', 0.2);
  }
}
```

## Step 7: Testing Integration

### Manual Testing Checklist

- [ ] Theme selector appears in navigation
- [ ] All three themes switch correctly
- [ ] Theme preference persists on page reload
- [ ] Audio plays for theme-specific actions (with user interaction)
- [ ] Visual effects work without breaking functionality
- [ ] Mobile responsiveness maintained
- [ ] Existing quiz functionality unchanged

### Browser Support Testing

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Step 8: Performance Optimization

### CSS Loading

The theme system uses CSS custom properties for instant switching. No additional optimization needed.

### Audio Preloading

Audio files are preloaded but fail gracefully if unavailable:

```javascript
// Audio is preloaded automatically by ThemeAudioManager
// Falls back silently if files don't exist
```

### Lazy Loading (Optional)

For larger deployments, consider lazy loading theme CSS:

```javascript
// Optional: Load themes on demand
async function loadTheme(themeName) {
  if (!document.querySelector(`[href*="${themeName}.css"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `css/themes/${themeName}.css`;
    document.head.appendChild(link);
  }
}
```

## Troubleshooting

### Common Issues

**Theme selector not appearing:**
- Check that `theme-manager.js` is loaded
- Verify navigation HTML structure
- Check browser console for errors

**Audio not playing:**
- Ensure user has interacted with page first (browser requirement)
- Check audio file paths and existence
- Verify audio format support (wav/mp3)

**Themes not switching:**
- Check browser console for JavaScript errors
- Verify CSS custom property support
- Ensure `data-theme` attribute is being set on `<html>`

**Visual effects not working:**
- Check that `effectsManager` is initialized
- Verify CSS animation support
- Check for conflicting CSS rules

### Debugging

Enable debug mode by adding to console:

```javascript
// Debug theme system
window.themeManager.getCurrentTheme(); // Check current theme
window.themeManager.audioManager.setAudioEnabled(false); // Disable audio
localStorage.removeItem('lawquizzer-theme'); // Reset theme preference
```

## Rollback Plan

To remove the theme system:

1. Remove theme CSS imports from HTML
2. Remove `theme-manager.js` script tag
3. Remove audio integration code
4. Remove theme-specific CSS classes

The application will continue to work with the original styling.

## Advanced Customization

### Adding New Themes

1. Create new CSS file in `src/css/themes/`
2. Add theme entry to `ThemeManager.themes` object
3. Create corresponding audio directory
4. Update theme selector if needed

### Custom Audio Integration

```javascript
// Listen for theme changes
window.addEventListener('themeChanged', (event) => {
  console.log('Theme changed to:', event.detail.theme);
  // Custom integration logic here
});
```

### Custom Visual Effects

```javascript
// Add custom effects to specific elements
document.querySelectorAll('.my-element').forEach(el => {
  window.effectsManager.addGelOverlay(el);
  window.effectsManager.addRetroIcon(el);
});
```

---

This implementation maintains backward compatibility while adding the full Dorothy Draper design system functionality. The theme system enhances the existing application without breaking current features.