# Quiz Show Mode - 1970s Game Show Experience

## Overview

The Quiz Show Mode transforms the Law Quizzer into a 1970s-style game show experience, complete with dramatic TV intro, retro styling, enhanced scoring, and high score tracking.

## Features

### 🎭 TV Show Intro Sequence
- Full-screen intro with animated logo and sparkles
- Host-style announcements
- Dramatic entrance with game show music
- Skippable with spacebar or auto-advances after 5 seconds

### 🎯 Enhanced Scoring System
- **Traditional Score**: Simple correct/incorrect ratio for 65% tracking
- **Game Show Score**: Complex scoring with multiple factors:
  - Base points: 1,000 points per correct answer
  - Time bonus: 10 points per second remaining
  - Random bonus: 100-500 points for excitement
  - Final score displayed prominently

### ⏰ Dramatic Timer System
- Large, prominent timer display inspired by classic game shows
- Color-coded warnings:
  - Green: Normal time
  - Orange: 30% time remaining (warning)
  - Red: 15% time remaining (critical)
  - Flashing: Overtime mode
- **10-Second Warning**: Visual and audio alert with dramatic effect
- Overtime allowed (continues counting in negative)

### 🏆 High Score System
- Local leaderboard with top 10 scores
- Achievement notifications for high scores
- Ranking system with gold/silver/bronze styling
- Modal display with detailed score breakdown
- Persistent storage across sessions

### 🎨 1970s Visual Design
- **Color Palette**: Gold, orange, brown, avocado green
- **Typography**: Bold, Impact-style fonts with dramatic shadows
- **Gameboard Background**: Grid of glowing colored squares
- **Retro Patterns**: Geometric designs and sunburst effects
- **Game Show Elements**: Spotlights, sparkles, dramatic borders

### 🎪 Game Show Personality
- Encouraging phrases throughout the experience
- Host-style announcements and reactions
- Celebration messages for correct answers
- Sympathetic responses for incorrect answers
- Tongue-in-cheek humor without interfering with quiz functionality

## Usage

### Starting Quiz Show Mode

1. Navigate to the start menu
2. Select "📺 Quiz Show Mode (1970s Game Show)" from the Quiz Mode dropdown
3. Configure your quiz settings (questions, subject, timer)
4. Click "Start Quiz" to begin the TV show experience

### During the Quiz

- **Navigation**: Use Previous/Next buttons or complete each question
- **Timer Control**: Pause/Resume with the pause button or spacebar
- **Answer Selection**: Click choice buttons to select answers
- **Elimination**: Use ✖ buttons to eliminate wrong choices
- **Visual Feedback**: Enjoy the dramatic 1970s styling and effects

### Scoring and Results

- Monitor both traditional and game show scores in real-time
- Experience the 10-second warning for dramatic effect
- View final results with detailed score breakdown
- Celebrate high score achievements with notifications
- Browse the high score leaderboard

## Technical Implementation

### Files Created/Modified

- **`src/js/lq-quiz-show-mode.js`**: Main Quiz Show mode manager
- **`src/js/lq-quiz-show-highscores.js`**: High score system
- **`src/css/quiz-show-mode.css`**: Quiz Show specific styling
- **`src/css/themes/quiz-show.css`**: Enhanced theme styling
- **`src/js/lq-start-menu.js`**: Modified for mode selection
- **`src/js/lq-main.js`**: Updated for Quiz Show integration
- **`src/index.html`**: Added CSS imports

### Audio Assets

Quiz Show mode uses themed audio files located in `src/assets/audio/theme/quiz-show/`:
- `transition.mp3`: Intro and transition music
- `correct.mp3`: Correct answer celebration
- `wrong.mp3`: Incorrect answer sound
- `click.wav`: Button and interaction sounds
- `timer.wav`: 10-second warning sound

### Theme Integration

Quiz Show mode automatically switches to the `quiz-show` theme, which includes:
- CSS custom properties for 1970s colors and fonts
- Responsive design for mobile and desktop
- Integration with existing theme management system
- Accessibility features and ARIA labels

## Customization

### Scoring Parameters

The game show scoring can be customized by modifying these values in `lq-quiz-show-mode.js`:

```javascript
// Base points for correct answer
score += 1000;

// Time bonus multiplier
const timeBonus = Math.floor(timeRemaining * 10);

// Random bonus range
const randomBonus = Math.floor(Math.random() * 400) + 100;
```

### Visual Styling

Customize the 1970s aesthetic by modifying CSS custom properties in `src/css/themes/quiz-show.css`:

```css
:root[data-theme="quiz-show"] {
  --theme-primary: #FFD700;          /* Gold */
  --theme-secondary: #FF8C00;        /* Dark Orange */
  --theme-accent: #8B4513;           /* Saddle Brown */
  /* ... more color variables */
}
```

### Game Show Phrases

Add or modify encouraging phrases in the `QuizShowMode` constructor:

```javascript
this.encouragementPhrases = [
  "Let's play!",
  "Survey says...",
  "Final answer?",
  // Add your own phrases here
];
```

## Accessibility

Quiz Show mode maintains full accessibility features:
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast options
- Text scaling compatibility
- Focus management during interactions

## Mobile Support

The Quiz Show mode is fully responsive and includes:
- Touch-optimized controls
- Scaled interface for smaller screens
- Optimized timer display
- Mobile-friendly high score modal
- Gesture support for navigation

## Performance

Quiz Show mode is optimized for performance:
- Efficient CSS animations
- Lazy-loaded audio assets
- Minimal DOM manipulation
- Optimized timer updates
- Memory management for long sessions

## Browser Compatibility

Compatible with all modern browsers:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

Graceful fallbacks for older browsers without advanced CSS features.