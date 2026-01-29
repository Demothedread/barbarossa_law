/**
 * Comprehensive Statistics page for Law Quizzer
 * Displays detailed performance metrics, analytics, and interactive visualizations
 */
import {
  fetchAdvancedAnalytics,
  fetchSubtopicStats,
  getComprehensiveQuizHistory,
} from "./lq-api.js";
import { getIconString } from "./lunaire-icons.js";

export async function createStatisticsPage() {
  const container = document.createElement("div");
  container.className = "statistics-page";

  // Show loading
  const loadingEl = document.createElement("div");
  loadingEl.className = "loading";
  loadingEl.innerHTML = `
    <div class="loading-spinner"></div>
    <p>Loading comprehensive statistics...</p>
  `;
  container.appendChild(loadingEl);

  try {
    // Get user ID from local storage
    const userId = localStorage.getItem("userId") || "anonymous";

    // Fetch comprehensive data
    const [comprehensiveData, subtopicData, analyticsData] = await Promise.all([
      getComprehensiveQuizHistory(userId),
      fetchSubtopicStats(userId),
      fetchAdvancedAnalytics(userId, 30),
    ]);

    // Remove loading indicator
    container.removeChild(loadingEl);

    // Create comprehensive statistics dashboard
    renderComprehensiveStatsDashboard(
      container,
      comprehensiveData,
      subtopicData,
      analyticsData,
      userId,
    );
  } catch (error) {
    console.error("Failed to load statistics:", error);
    loadingEl.innerHTML = `
      <div class="error-message">
        <h3>Failed to load statistics</h3>
        <p>Please check your connection and try again.</p>
        <button onclick="location.reload()" class="retry-btn">Retry</button>
      </div>
    `;
  }

  return container;
}

/**
 * Render the comprehensive statistics dashboard
 */
function renderComprehensiveStatsDashboard(
  container,
  comprehensiveData,
  subtopicData,
  analyticsData,
  userId,
) {
  const { history, stats, analytics } = comprehensiveData;

  if (!history || history.length === 0) {
    renderNoDataView(container);
    return;
  }

  // Create toolbar with export and filter options
  createStatsToolbar(container, userId);

  // Create comprehensive header with key metrics
  createComprehensiveHeader(container, stats, analytics);

  // Create analytics overview (streaks, goals, trends)
  createAnalyticsOverview(container, analytics, analyticsData);

  // Create interactive charts section
  createInteractiveCharts(container, history, stats, analytics);

  // Create detailed breakdowns
  createDetailedBreakdowns(container, stats, subtopicData);

  // Create study recommendations
  createStudyRecommendations(container, analyticsData.recommendations || []);

  // Create recent activity
  createRecentActivity(container, history);
}

function renderNoDataView(container) {
  const noDataEl = document.createElement("div");
  noDataEl.className = "no-stats";
  noDataEl.innerHTML = `
    <div class="no-stats-icon">${getIconString("chart", 48)}</div>
    <h2>No Quiz History Yet</h2>
    <p>Complete your first quiz to unlock comprehensive performance analytics!</p>
    <div class="no-stats-features">
      <h4>What you'll see here:</h4>
      <ul>
        <li>${getIconString(
          "chart",
          16,
        )} Performance trends and learning curves</li>
        <li>${getIconString("flagPin", 16)} Subject and subtopic breakdowns</li>
        <li>${getIconString(
          "lightning",
          16,
        )} Study streaks and achievements</li>
        <li>${getIconString("telescope", 16)} Weak area identification</li>
        <li>${getIconString("book", 16)} Personalized study recommendations</li>
      </ul>
    </div>
    <button onclick="window.location.href='#home'" class="start-quiz-btn">Launch First Raid</button>
  `;
  container.appendChild(noDataEl);
}

function createStatsToolbar(container, userId) {
  const toolbar = document.createElement("div");
  toolbar.className = "stats-toolbar";
  toolbar.innerHTML = `
    <div class="toolbar-left">
      <h2>${getIconString("chart", 24)} Captain's Log</h2>
      <p>Comprehensive insights into your study progress</p>
    </div>
    <div class="toolbar-right">
      <div class="filter-controls">
        <select id="subjectFilter" class="filter-select">
          <option value="">All Subjects</option>
        </select>
        <select id="modeFilter" class="filter-select">
          <option value="">All Modes</option>
          <option value="classic">Classic</option>
          <option value="quiz-show">Quiz Show</option>
          <option value="friendly">Friendly</option>
        </select>
        <select id="timeRangeFilter" class="filter-select">
          <option value="30">Last 30 Days</option>
          <option value="90">Last 3 Months</option>
          <option value="365">Last Year</option>
          <option value="">All Time</option>
        </select>
      </div>
      <div class="export-controls">
        <button id="exportJsonBtn" class="export-btn" data-format="json">
          ${getIconString("document", 16)} Export JSON
        </button>
        <button id="exportCsvBtn" class="export-btn" data-format="csv">
          ${getIconString("chart", 16)} Export CSV
        </button>
      </div>
    </div>
  `;

  // Add event listeners for export functionality
  toolbar
    .querySelector("#exportJsonBtn")
    .addEventListener("click", () => exportData(userId, "json"));
  toolbar
    .querySelector("#exportCsvBtn")
    .addEventListener("click", () => exportData(userId, "csv"));

  container.appendChild(toolbar);
}

function createComprehensiveHeader(container, stats, analytics) {
  const header = document.createElement("div");
  header.className = "stats-header comprehensive";

  const goalProgress = analytics.goal_progress || 0;
  const currentStreak = analytics.current_streak || 0;
  const studyTimeHours = (stats.total_time || 0) / 3600;

  header.innerHTML = `
    <div class="stats-summary-grid">
      <div class="stats-card primary">
        <div class="card-icon">${getIconString("flagPin", 24)}</div>
        <h3>${stats.avg_score.toFixed(1)}%</h3>
        <p>Target Accuracy</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.min(
            goalProgress,
            100,
          )}%"></div>
        </div>
        <span class="progress-text">${goalProgress.toFixed(
          0,
        )}% to Loot Goal</span>
      </div>
      
      <div class="stats-card">
        <div class="card-icon">${getIconString("lightning", 24)}</div>
        <h3>${currentStreak}</h3>
        <p>Raid Streak</p>
        <span class="streak-text">${
          currentStreak > 0 ? "Keep burning!" : "Ignite the engines!"
        }</span>
      </div>
      
      <div class="stats-card">
        <div class="card-icon">${getIconString("book", 24)}</div>
        <h3>${stats.total_questions}</h3>
        <p>Targets Hit</p>
        <span class="sub-text">${stats.total_quizzes} sorties</span>
      </div>
      
      <div class="stats-card">
        <div class="card-icon">${getIconString("clock", 24)}</div>
        <h3>${studyTimeHours.toFixed(1)}h</h3>
        <p>Time in Void</p>
        <span class="sub-text">${(stats.avg_time_per_question || 0).toFixed(
          0,
        )}s avg/target</span>
      </div>
      
      <div class="stats-card">
        <div class="card-icon">${getIconString("chart", 24)}</div>
        <h3>${analytics.improvement_trend > 0 ? "+" : ""}${(
    analytics.improvement_trend || 0
  ).toFixed(1)}%</h3>
        <p>Trajectory</p>
        <span class="trend-text ${
          analytics.improvement_trend >= 0 ? "positive" : "negative"
        }">
          ${analytics.improvement_trend >= 0 ? "Climbing" : "Drifting"}
        </span>
      </div>
      
      <div class="stats-card">
        <div class="card-icon">${getIconString("trophy", 24)}</div>
        <h3>${analytics.longest_streak || 0}</h3>
        <p>Best Streak</p>
        <span class="sub-text">Legendary Record</span>
      </div>
    </div>
  `;

  container.appendChild(header);
}

function createAnalyticsOverview(container, analytics, analyticsData) {
  const overview = document.createElement("div");
  overview.className = "analytics-overview";
  overview.innerHTML = `
    <div class="analytics-section">
      <h3>${getIconString("chart", 20)} Flight Analytics</h3>
      <div class="analytics-grid">
        <div class="analytic-item">
          <h4>Learning Velocity</h4>
          <p class="velocity-${
            analyticsData.learning_velocity?.trend || "stable"
          }">
            ${getVelocityText(analyticsData.learning_velocity)}
          </p>
        </div>
        <div class="analytic-item">
          <h4>Study Frequency</h4>
          <p>${(analyticsData.study_patterns?.sessions_per_week || 0).toFixed(
            1,
          )} sessions/week</p>
        </div>
        <div class="analytic-item">
          <h4>Session Length</h4>
          <p>${(analyticsData.study_patterns?.avg_session_length || 0).toFixed(
            0,
          )} minutes avg</p>
        </div>
        <div class="analytic-item">
          <h4>Weak Areas</h4>
          <p>${analytics.weak_areas?.length || 0} areas need focus</p>
        </div>
      </div>
    </div>
  `;

  container.appendChild(overview);
}

function createInteractiveCharts(container, history, stats, analytics) {
  const chartsSection = document.createElement("div");
  chartsSection.className = "charts-section";
  chartsSection.innerHTML = `
    <div class="charts-grid">
      <div class="chart-container large">
        <h3>${getIconString("chart", 20)} Performance Over Time</h3>
        <canvas id="performance-trend-chart"></canvas>
      </div>
      
      <div class="chart-container">
        <h3>${getIconString("flagPin", 20)} Sector Performance</h3>
        <canvas id="subject-performance-chart"></canvas>
      </div>
      
      <div class="chart-container">
        <h3>${getIconString("lightning", 20)} Mode Comparison</h3>
        <canvas id="mode-comparison-chart"></canvas>
      </div>
      
      <div class="chart-container">
        <h3>${getIconString("clock", 20)} Time Analysis</h3>
        <canvas id="time-analysis-chart"></canvas>
      </div>
    </div>
  `;

  container.appendChild(chartsSection);

  // Initialize charts after DOM is updated
  setTimeout(() => {
    createAdvancedCharts(history, stats, analytics);
  }, 0);
}

function createDetailedBreakdowns(container, stats, subtopicData) {
  const breakdowns = document.createElement("div");
  breakdowns.className = "detailed-breakdowns";

  // Subject breakdown
  const subjectBreakdown = createSubjectBreakdown(stats.by_subject);

  // Mode breakdown
  const modeBreakdown = createModeBreakdown(stats.by_mode);

  // Subtopic breakdown (robust to both array and object)
  let subtopicStatsArr = [];
  if (Array.isArray(subtopicData.subtopic_stats)) {
    subtopicStatsArr = subtopicData.subtopic_stats;
  } else if (Array.isArray(subtopicData.subtopics)) {
    subtopicStatsArr = subtopicData.subtopics.map((sub) => ({ subtopic: sub }));
  }
  const subtopicBreakdown = createSubtopicBreakdown(subtopicStatsArr);

  breakdowns.appendChild(subjectBreakdown);
  breakdowns.appendChild(modeBreakdown);
  breakdowns.appendChild(subtopicBreakdown);

  container.appendChild(breakdowns);
}

function createStudyRecommendations(container, recommendations) {
  if (!recommendations || recommendations.length === 0) return;

  const recommendationsSection = document.createElement("div");
  recommendationsSection.className = "recommendations-section";
  recommendationsSection.innerHTML = `
    <h3>${getIconString("rocket", 20)} Tactical Advisory</h3>
    <div class="recommendations-grid">
      ${recommendations
        .map(
          (rec) => `
        <div class="recommendation-card ${rec.priority}">
          <div class="rec-priority">${rec.priority.toUpperCase()}</div>
          <h4>${rec.message}</h4>
          <p>${rec.action}</p>
          <div class="rec-type">${rec.type.replace("_", " ")}</div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;

  container.appendChild(recommendationsSection);
}

function createRecentActivity(container, history) {
  const recentSection = document.createElement("div");
  recentSection.className = "recent-activity-section";
  recentSection.innerHTML = `<h3>${getIconString(
    "scorecard",
    20,
  )} Recent Raids</h3>`;

  const activityGrid = document.createElement("div");
  activityGrid.className = "activity-grid";

  // Show last 10 quizzes in a more visual format
  const recentQuizzes = history.slice(0, 10);
  recentQuizzes.forEach((quiz) => {
    const activityCard = createQuizActivityCard(quiz);
    activityGrid.appendChild(activityCard);
  });

  recentSection.appendChild(activityGrid);
  container.appendChild(recentSection);
}

// Helper functions for chart creation and data visualization
function getVelocityText(velocity) {
  if (!velocity) return "Not enough data";

  const trendMap = {
    rapid_improvement: `Rapid improvement (+${velocity.rate?.toFixed(1)}%)`,
    steady_improvement: `Steady improvement (+${velocity.rate?.toFixed(1)}%)`,
    stable: "Stable performance",
    declining: `Declining (-${Math.abs(velocity.rate || 0).toFixed(1)}%)`,
    insufficient_data: "Not enough data",
  };

  return trendMap[velocity.trend] || "Unknown trend";
}

async function exportData(userId, format) {
  try {
    const { exportStatistics } = await import("./lq-api.js");

    if (format === "csv") {
      const blob = await exportStatistics(userId, "csv");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz_statistics_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      const data = await exportStatistics(userId, "json");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz_statistics_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }

    // Show success message
    showNotification("Statistics exported successfully!", "success");
  } catch (error) {
    console.error("Export failed:", error);
    showNotification("Export failed. Please try again.", "error");
  }
}

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Helper functions for creating detailed breakdowns

function createSubjectBreakdown(subjectStats) {
  const section = document.createElement("div");
  section.className = "stats-section subject-breakdown";
  section.innerHTML = `<h3>${getIconString(
    "book",
    20,
  )} Performance by Sector</h3>`;

  if (!subjectStats || Object.keys(subjectStats).length === 0) {
    section.innerHTML += '<p class="no-data">No sector data available</p>';
    return section;
  }

  const table = document.createElement("table");
  table.className = "stats-table enhanced";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Subject</th>
        <th>Quizzes</th>
        <th>Questions</th>
        <th>Accuracy</th>
        <th>Avg Time</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");
  Object.entries(subjectStats).forEach(([subject, data]) => {
    const row = document.createElement("tr");
    const passClass = data.avg_score >= 65 ? "pass" : "no-pass";
    const statusIcon =
      data.avg_score >= 75
        ? getIconString("check", 16)
        : data.avg_score >= 65
        ? getIconString("flagPin", 16)
        : getIconString("wrong", 16);

    row.innerHTML = `
      <td><strong>${subject}</strong></td>
      <td>${data.quizzes}</td>
      <td>${data.questions}</td>
      <td class="${passClass}">${data.avg_score.toFixed(1)}%</td>
      <td>${(data.avg_time_per_question || 0).toFixed(0)}s</td>
      <td>${statusIcon}</td>
    `;

    tbody.appendChild(row);
  });

  section.appendChild(table);
  return section;
}

function createModeBreakdown(modeStats) {
  const section = document.createElement("div");
  section.className = "stats-section mode-breakdown";
  section.innerHTML = `<h3>${getIconString(
    "gear",
    20,
  )} Performance by Mode</h3>`;

  if (!modeStats || Object.keys(modeStats).length === 0) {
    section.innerHTML += '<p class="no-data">No mode data available</p>';
    return section;
  }

  const modeCards = document.createElement("div");
  modeCards.className = "mode-cards-grid";

  const modeIcons = {
    classic: getIconString("book", 24),
    "quiz-show": getIconString("trophy", 24),
    friendly: getIconString("user", 24),
  };

  Object.entries(modeStats).forEach(([mode, data]) => {
    const card = document.createElement("div");
    card.className = `mode-card ${
      data.avg_score >= 65 ? "passing" : "needs-work"
    }`;

    card.innerHTML = `
      <div class="mode-icon">${
        modeIcons[mode] || getIconString("flagPin", 24)
      }</div>
      <h4>${mode.charAt(0).toUpperCase() + mode.slice(1).replace("-", " ")}</h4>
      <div class="mode-stats">
        <div class="stat">
          <span class="stat-value">${data.avg_score.toFixed(1)}%</span>
          <span class="stat-label">Accuracy</span>
        </div>
        <div class="stat">
          <span class="stat-value">${data.quizzes}</span>
          <span class="stat-label">Quizzes</span>
        </div>
        <div class="stat">
          <span class="stat-value">${(data.avg_time_per_question || 0).toFixed(
            0,
          )}s</span>
          <span class="stat-label">Avg Time</span>
        </div>
      </div>
    `;

    modeCards.appendChild(card);
  });

  section.appendChild(modeCards);
  return section;
}

function createSubtopicBreakdown(subtopicStats) {
  const section = document.createElement("div");
  section.className = "stats-section subtopic-breakdown";
  section.innerHTML = `<h3>${getIconString(
    "telescope",
    20,
  )} Performance by Subtopic</h3>`;

  if (!subtopicStats || subtopicStats.length === 0) {
    section.innerHTML +=
      '<p class="no-data">Complete raids to see subtopic breakdown</p>';
    return section;
  }

  // Group subtopics by subject
  const subtopicsBySubject = {};
  subtopicStats.forEach((item) => {
    if (!subtopicsBySubject[item.subject]) {
      subtopicsBySubject[item.subject] = [];
    }
    subtopicsBySubject[item.subject].push(item);
  });

  Object.entries(subtopicsBySubject).forEach(([subject, subtopics]) => {
    const subjectGroup = document.createElement("div");
    subjectGroup.className = "subtopic-subject-group";
    subjectGroup.innerHTML = `<h4>${subject}</h4>`;

    const subtopicGrid = document.createElement("div");
    subtopicGrid.className = "subtopic-grid";

    subtopics.forEach((subtopic) => {
      const subtopicCard = document.createElement("div");
      subtopicCard.className = `subtopic-card ${
        subtopic.needs_practice ? "needs-practice" : "good"
      }`;

      subtopicCard.innerHTML = `
        <div class="subtopic-header">
          <h5>${subtopic.subtopic}</h5>
          <span class="accuracy ${
            subtopic.accuracy_percent >= 65 ? "pass" : "fail"
          }">${subtopic.accuracy_percent}%</span>
        </div>
        <div class="subtopic-details">
          <span>${subtopic.total_questions} questions</span>
          <span>${subtopic.quiz_count} quizzes</span>
          ${
            subtopic.avg_time_per_question
              ? `<span>${subtopic.avg_time_per_question}s avg</span>`
              : ""
          }
        </div>
        ${
          subtopic.needs_practice
            ? `<div class="practice-flag">${getIconString(
                "warning",
                14,
              )} Shield Breach</div>`
            : ""
        }
      `;

      subtopicGrid.appendChild(subtopicCard);
    });

    subjectGroup.appendChild(subtopicGrid);
    section.appendChild(subjectGroup);
  });

  return section;
}

function createQuizActivityCard(quiz) {
  const card = document.createElement("div");
  card.className = "activity-card";

  const date = new Date(quiz.created_at);
  const score = (quiz.correct / quiz.total) * 100;
  const passClass = score >= 65 ? "pass" : "fail";

  card.innerHTML = `
    <div class="activity-header">
      <span class="activity-date">${date.toLocaleDateString()}</span>
      <span class="activity-score ${passClass}">${score.toFixed(1)}%</span>
    </div>
    <div class="activity-details">
      <div class="activity-subject">${quiz.subject || "Mixed"}</div>
      <div class="activity-mode">${quiz.mode || "classic"}</div>
      <div class="activity-questions">${quiz.correct}/${
    quiz.total
  } correct</div>
      <div class="activity-time">${Math.floor(quiz.duration_seconds / 60)}m ${
    quiz.duration_seconds % 60
  }s</div>
    </div>
  `;

  return card;
}

// Advanced chart creation functions
function createAdvancedCharts(history, stats, analytics) {
  if (!window.Chart) {
    loadChartJS(() => {
      initializeAllCharts(history, stats, analytics);
    });
  } else {
    initializeAllCharts(history, stats, analytics);
  }
}

function loadChartJS(callback) {
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/chart.js";
  script.onload = callback;
  document.head.appendChild(script);
}

function initializeAllCharts(history, stats, analytics) {
  createPerformanceTrendChart(history);
  createSubjectPerformanceChart(stats.by_subject);
  createModeComparisonChart(stats.by_mode);
  createTimeAnalysisChart(history);
}

function createPerformanceTrendChart(history) {
  const canvas = document.getElementById("performance-trend-chart");
  if (!canvas) return;

  const chartData = history
    .slice()
    .reverse()
    .map((quiz) => ({
      x: new Date(quiz.created_at),
      y: (quiz.correct / quiz.total) * 100,
      questions: quiz.total,
      subject: quiz.subject || "Mixed",
    }));

  new Chart(canvas, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Quiz Performance",
          data: chartData,
          borderColor: "rgb(46, 85, 167)",
          backgroundColor: "rgba(46, 85, 167, 0.1)",
          tension: 0.1,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
        {
          label: "Bar Exam Goal (65%)",
          data: chartData.map((d) => ({ x: d.x, y: 65 })),
          borderColor: "rgba(21, 132, 59, 0.8)",
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: function (context) {
              return new Date(context[0].parsed.x).toLocaleDateString();
            },
            label: function (context) {
              const dataPoint = chartData[context.dataIndex];
              return `${context.dataset.label}: ${context.parsed.y.toFixed(
                1,
              )}% (${dataPoint?.subject})`;
            },
          },
        },
        legend: {
          display: true,
          position: "top",
        },
      },
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
          },
          title: {
            display: true,
            text: "Date",
          },
        },
        y: {
          min: 0,
          max: 100,
          title: {
            display: true,
            text: "Score (%)",
          },
        },
      },
    },
  });
}

function createSubjectPerformanceChart(subjectStats) {
  const canvas = document.getElementById("subject-performance-chart");
  if (!canvas || !subjectStats) return;

  const subjects = Object.keys(subjectStats);
  const accuracies = subjects.map((s) => subjectStats[s].avg_score);
  const colors = accuracies.map((acc) =>
    acc >= 65 ? "rgba(21, 132, 59, 0.8)" : "rgba(164, 60, 37, 0.8)",
  );

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: subjects,
      datasets: [
        {
          label: "Accuracy (%)",
          data: accuracies,
          backgroundColor: colors,
          borderColor: colors.map((c) => c.replace("0.8", "1")),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          title: {
            display: true,
            text: "Accuracy (%)",
          },
        },
      },
    },
  });
}

function createModeComparisonChart(modeStats) {
  const canvas = document.getElementById("mode-comparison-chart");
  if (!canvas || !modeStats) return;

  const modes = Object.keys(modeStats);
  const accuracies = modes.map((m) => modeStats[m].avg_score);

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: modes.map(
        (m) => m.charAt(0).toUpperCase() + m.slice(1).replace("-", " "),
      ),
      datasets: [
        {
          data: accuracies,
          backgroundColor: [
            "rgba(46, 85, 167, 0.8)",
            "rgba(70, 119, 218, 0.8)",
            "rgba(80, 200, 120, 0.8)",
          ],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.parsed.toFixed(1)}%`;
            },
          },
        },
      },
    },
  });
}

function createTimeAnalysisChart(history) {
  const canvas = document.getElementById("time-analysis-chart");
  if (!canvas) return;

  const timeData = history
    .slice()
    .reverse()
    .map((quiz) => ({
      x: new Date(quiz.created_at),
      y: quiz.duration_seconds / quiz.total, // seconds per question
      total: quiz.total,
    }));

  new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Time per Question (seconds)",
          data: timeData,
          backgroundColor: "rgba(180, 100, 200, 0.6)",
          borderColor: "rgba(180, 100, 200, 1)",
          pointRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
          },
          title: {
            display: true,
            text: "Date",
          },
        },
        y: {
          title: {
            display: true,
            text: "Seconds per Question",
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: function (context) {
              return new Date(context[0].raw.x).toLocaleDateString();
            },
            label: function (context) {
              return `${context.parsed.y.toFixed(1)} seconds per question`;
            },
          },
        },
      },
    },
  });
}
