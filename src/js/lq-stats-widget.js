/**
 * Homepage Statistics Widget for Law Quizzer
 * Displays key performance metrics on the main page
 */

import { getComprehensiveQuizHistory, fetchAdvancedAnalytics } from './lq-api.js';

/**
 * Create a compact statistics widget for the homepage
 * @returns {Promise<HTMLElement>} Widget element
 */
export async function createStatsWidget() {
  const widget = document.createElement('div');
  widget.className = 'stats-widget';
  
  // Show loading state initially
  widget.innerHTML = `
    <div class="widget-header">
      <h3>📊 Your Progress</h3>
      <div class="widget-loading">
        <div class="mini-spinner"></div>
      </div>
    </div>
  `;
  
  try {
    const userId = localStorage.getItem('userId') || 'anonymous';
    
    // Fetch basic stats
    const comprehensiveData = await getComprehensiveQuizHistory(userId, '', '', 10);
    const { history, stats, analytics } = comprehensiveData;
    
    if (!history || history.length === 0) {
      renderNoDataWidget(widget);
      return widget;
    }
    
    // Fetch recent analytics
    const analyticsData = await fetchAdvancedAnalytics(userId, 7); // Last 7 days
    
    renderStatsWidget(widget, stats, analytics, analyticsData);
    
  } catch (error) {
    console.error('Failed to load stats widget:', error);
    renderErrorWidget(widget);
  }
  
  return widget;
}

function renderNoDataWidget(widget) {
  widget.innerHTML = `
    <div class="widget-header">
      <h3>📊 Your Progress</h3>
    </div>
    <div class="widget-content no-data">
      <div class="no-data-icon">🎯</div>
      <p>Start your first quiz to see your progress!</p>
      <div class="widget-features">
        <span>🏆 Track streaks</span>
        <span>📈 Monitor improvement</span>
        <span>🎯 Reach 65% goal</span>
      </div>
    </div>
  `;
}

function renderErrorWidget(widget) {
  widget.innerHTML = `
    <div class="widget-header">
      <h3>📊 Your Progress</h3>
    </div>
    <div class="widget-content error">
      <p>⚠️ Unable to load statistics</p>
      <button onclick="location.reload()" class="widget-retry-btn">Retry</button>
    </div>
  `;
}

function renderStatsWidget(widget, stats, analytics, analyticsData) {
  const currentStreak = analytics.current_streak || 0;
  const goalProgress = analytics.goal_progress || 0;
  const recentTrend = analyticsData.learning_velocity?.trend || 'stable';
  const studyTimeHours = (stats.total_time || 0) / 3600;
  
  // Determine streak status
  const streakStatus = currentStreak >= 5 ? 'hot' : currentStreak >= 3 ? 'good' : 'building';
  const streakIcon = currentStreak >= 5 ? '🔥' : currentStreak >= 3 ? '⚡' : '📈';
  
  // Determine trend status
  const trendIcon = getTrendIcon(recentTrend);
  const trendText = getTrendText(recentTrend);
  
  widget.innerHTML = `
    <div class="widget-header">
      <h3>📊 Your Progress</h3>
      <button class="widget-expand-btn" onclick="window.showStatistics()">
        View Details →
      </button>
    </div>
    
    <div class="widget-content">
      <div class="widget-stats-grid">
        <div class="widget-stat primary">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-value">${stats.avg_score.toFixed(1)}%</div>
            <div class="stat-label">Overall Accuracy</div>
            <div class="progress-mini">
              <div class="progress-mini-fill" style="width: ${Math.min(goalProgress, 100)}%"></div>
            </div>
            <div class="goal-text">${goalProgress.toFixed(0)}% to Bar Exam Goal</div>
          </div>
        </div>
        
        <div class="widget-stat ${streakStatus}">
          <div class="stat-icon">${streakIcon}</div>
          <div class="stat-content">
            <div class="stat-value">${currentStreak}</div>
            <div class="stat-label">Current Streak</div>
            <div class="streak-status">${getStreakText(currentStreak)}</div>
          </div>
        </div>
        
        <div class="widget-stat">
          <div class="stat-icon">📚</div>
          <div class="stat-content">
            <div class="stat-value">${stats.total_questions}</div>
            <div class="stat-label">Questions Done</div>
            <div class="sub-info">${stats.total_quizzes} quizzes</div>
          </div>
        </div>
        
        <div class="widget-stat">
          <div class="stat-icon">${trendIcon}</div>
          <div class="stat-content">
            <div class="stat-value">${studyTimeHours.toFixed(1)}h</div>
            <div class="stat-label">Study Time</div>
            <div class="trend-info ${recentTrend}">${trendText}</div>
          </div>
        </div>
      </div>
      
      ${renderQuickInsights(analytics, analyticsData)}
      
      <div class="widget-actions">
        <button class="widget-action-btn primary" onclick="window.navigateToHome && window.navigateToHome()">
          🎯 Take Quiz
        </button>
        <button class="widget-action-btn secondary" onclick="window.showStatistics && window.showStatistics()">
          📊 Full Stats
        </button>
      </div>
    </div>
  `;
}

function renderQuickInsights(analytics, analyticsData) {
  const insights = [];
  
  // Add streak insight
  if (analytics.current_streak >= 3) {
    insights.push({
      type: 'success',
      icon: '🔥',
      text: `Great streak! Keep it going!`
    });
  } else if (analytics.current_streak === 0) {
    insights.push({
      type: 'motivation',
      icon: '💪',
      text: 'Start a new streak today!'
    });
  }
  
  // Add weak areas insight
  if (analytics.weak_areas && analytics.weak_areas.length > 0) {
    const weakArea = analytics.weak_areas[0];
    insights.push({
      type: 'improvement',
      icon: '🎯',
      text: `Focus on ${weakArea.name} (${weakArea.accuracy.toFixed(1)}%)`
    });
  }
  
  // Add learning velocity insight
  if (analyticsData.learning_velocity?.trend === 'rapid_improvement') {
    insights.push({
      type: 'success',
      icon: '📈',
      text: 'Rapid improvement detected!'
    });
  } else if (analyticsData.learning_velocity?.trend === 'declining') {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      text: 'Consider more practice'
    });
  }
  
  if (insights.length === 0) {
    return '';
  }
  
  return `
    <div class="widget-insights">
      <h4>💡 Quick Insights</h4>
      <div class="insights-list">
        ${insights.slice(0, 2).map(insight => `
          <div class="insight ${insight.type}">
            <span class="insight-icon">${insight.icon}</span>
            <span class="insight-text">${insight.text}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function getTrendIcon(trend) {
  const icons = {
    'rapid_improvement': '🚀',
    'steady_improvement': '📈',
    'stable': '➡️',
    'declining': '📉',
    'insufficient_data': '❓'
  };
  return icons[trend] || '📊';
}

function getTrendText(trend) {
  const texts = {
    'rapid_improvement': 'Improving fast!',
    'steady_improvement': 'Steady progress',
    'stable': 'Consistent',
    'declining': 'Needs focus',
    'insufficient_data': 'Building data'
  };
  return texts[trend] || 'Tracking...';
}

function getStreakText(streak) {
  if (streak >= 10) return 'Incredible! 🌟';
  if (streak >= 5) return 'On fire! 🔥';
  if (streak >= 3) return 'Great job! ⚡';
  if (streak >= 1) return 'Good start! 👍';
  return 'Ready to start! 💪';
}

/**
 * Update the stats widget with fresh data
 * Called after quiz completion or when returning to home
 */
export async function updateStatsWidget() {
  const existingWidget = document.querySelector('.stats-widget');
  if (!existingWidget) return;
  
  try {
    const newWidget = await createStatsWidget();
    existingWidget.replaceWith(newWidget);
  } catch (error) {
    console.error('Failed to update stats widget:', error);
  }
}

/**
 * Create a mini achievement notification for the widget
 * @param {string} type - Type of achievement (streak, goal, improvement)
 * @param {string} message - Achievement message
 */
export function showAchievementNotification(type, message) {
  const notification = document.createElement('div');
  notification.className = `achievement-notification ${type}`;
  
  const icons = {
    streak: '🔥',
    goal: '🎯',
    improvement: '📈',
    milestone: '🏆'
  };
  
  notification.innerHTML = `
    <div class="achievement-icon">${icons[type] || '🌟'}</div>
    <div class="achievement-text">${message}</div>
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 4000);
}