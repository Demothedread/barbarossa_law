/**
 * LUNAIRE COUNTRY CLUB - THE HOARD (Statistics Page)
 * "Where the fleet counts its plunder"
 *
 * Space Pirate-themed statistics display with infamy tracking,
 * performance analytics, and tactical recommendations.
 */

import {
  fetchAdvancedAnalytics,
  fetchSubtopicStats,
  getComprehensiveQuizHistory,
} from "./lq-api.js";
import { getIconString } from "./lunaire-icons.js";

export async function createProShopPage() {
  const container = document.createElement("div");
  container.className = "pro-shop lunaire-theme";

  // Show loading
  const loadingEl = document.createElement("div");
  loadingEl.className = "pro-shop__loading card-lunaire";
  loadingEl.innerHTML = `
    <div class="loading-content">
      ${getIconString("hal", 48)}
      <h3>HAL is calculating your Infamy...</h3>
      <p class="loading-subtitle">Decrypting patrol logs across all 18 sectors</p>
    </div>
  `;
  container.appendChild(loadingEl);

  try {
    const userId = localStorage.getItem("userId") || "anonymous";

    const [comprehensiveData, subtopicData, analyticsData] = await Promise.all([
      getComprehensiveQuizHistory(userId),
      fetchSubtopicStats(userId),
      fetchAdvancedAnalytics(userId, 30),
    ]);

    container.removeChild(loadingEl);
    renderProShop(
      container,
      comprehensiveData,
      subtopicData,
      analyticsData,
      userId,
    );
  } catch (error) {
    console.error("Failed to load hoard data:", error);
    loadingEl.innerHTML = `
      <div class="error-content">
        ${getIconString("hal", 48)}
        <h3>System Malfunction.</h3>
        <p>The archives are corrupted. Probably sabotage.</p>
        <button class="btn-lunaire btn-lunaire--primary" onclick="location.reload()">
          ${getIconString("gear", 16)} Reboot Systems
        </button>
      </div>
    `;
  }

  return container;
}

function renderProShop(
  container,
  comprehensiveData,
  subtopicData,
  analyticsData,
  userId,
) {
  const { history, stats, analytics } = comprehensiveData;

  if (!history || history.length === 0) {
    renderEmptyProShop(container);
    return;
  }

  // Header
  const header = createProShopHeader();
  container.appendChild(header);

  // Infamy Card (Main metric)
  const handicapCard = createHandicapCard(stats, analytics);
  container.appendChild(handicapCard);

  // Performance Metrics Grid
  const metricsGrid = createMetricsGrid(stats, analytics);
  container.appendChild(metricsGrid);

  // Sector Breakdown (Subjects)
  const courseBreakdown = createCourseBreakdown(stats, subtopicData);
  container.appendChild(courseBreakdown);

  // Recent Sorties Display
  const recentRounds = createRecentRoundsDisplay(history.slice(0, 5));
  container.appendChild(recentRounds);

  // Tactical Recommendations
  const recommendations = createEquipmentRecommendations(
    analyticsData.recommendations || [],
    subtopicData,
  );
  container.appendChild(recommendations);

  // Fleet Records
  const records = createClubRecords(stats, analytics);
  container.appendChild(records);
}

function renderEmptyProShop(container) {
  const emptyState = document.createElement("div");
  emptyState.className = "pro-shop__empty card-lunaire";
  emptyState.innerHTML = `
    <div class="empty-content">
      <div class="empty-illustration">
        ${getIconString("trophy", 80)}
      </div>
      <h2>The Captain's Log Awaits</h2>
      <p class="empty-subtitle">Complete your first sortie to establish your notoriety.</p>
      
      <div class="empty-features">
        <div class="feature-item">
          ${getIconString("scorecard", 24)}
          <span>Official Infamy Calculation</span>
        </div>
        <div class="feature-item">
          ${getIconString("chart", 24)}
          <span>Sector-by-Sector Analysis</span>
        </div>
        <div class="feature-item">
          ${getIconString("compass", 24)}
          <span>Tactical Recommendations</span>
        </div>
        <div class="feature-item">
          ${getIconString("star", 24)}
          <span>Fleet Records & Achievements</span>
        </div>
      </div>
      
      <button class="btn-lunaire btn-lunaire--primary btn-lunaire--lg" onclick="window.location.hash='#home'">
        ${getIconString("golfClub", 20)} Launch First Mission
      </button>
      
      <p class="empty-note">
        <em>"History is written by the victors. So go win something."</em>
        <br>— Commodore "Black" Bart, Fleet Commander
      </p>
    </div>
  `;
  container.appendChild(emptyState);
}

function createProShopHeader() {
  const header = document.createElement("header");
  header.className = "pro-shop__header";
  header.innerHTML = `
    <div class="header-content">
      <div class="header-icon">${getIconString("golfClub", 40)}</div>
      <div class="header-text">
        <h1>The Hoard</h1>
        <p class="header-subtitle">Performance Analytics & Tactical Data</p>
      </div>
    </div>
    <div class="header-decoration">
      <span class="decorative-text">Est. 2069</span>
    </div>
  `;
  return header;
}

function createHandicapCard(stats, analytics) {
  const section = document.createElement("section");
  section.className = "pro-shop__handicap-section";

  // Calculate Infamy (Formerly Handicap)
  // We'll trust the math but rebrand the result.
  // Handicap = 36 - avgScore * 0.36. Lower is better in golf.
  // In pirate terms, we want HIGH infamy.
  // Let's invert it for display? Or just stick to "Threat Level" (Lower is scarier? No.)
  // Let's calculate a "Bounty Class".

  const avgScore = stats.avg_score || 0;
  // Handicap logic: 0 is scratch (good), 36 is bad.
  const handicap = Math.max(0, Math.round(36 - avgScore * 0.36));

  // Pirate Ranks based on handicap
  let category, categoryClass;
  if (handicap <= 5) {
    category = "Pirate Lord";
    categoryClass = "scratch"; // Keeps gold styling
  } else if (handicap <= 10) {
    category = "Captain";
    categoryClass = "single";
  } else if (handicap <= 18) {
    category = "Officer";
    categoryClass = "club";
  } else if (handicap <= 28) {
    category = "Deckhand";
    categoryClass = "bogey";
  } else {
    category = "Bilge Rat";
    categoryClass = "beginner";
  }

  // Trend indicator
  const trend = analytics.improvement_trend || 0;
  const trendIcon =
    trend > 0 ? "arrowRight" : trend < 0 ? "arrowLeft" : "golfBall";
  const trendText = trend > 0 ? "Rising" : trend < 0 ? "Falling" : "Stable";

  section.innerHTML = `
    <div class="handicap-card card-lunaire ${categoryClass}">
      <div class="handicap-main">
        <div class="handicap-label">Threat Level</div>
        <div class="handicap-value">Class ${handicap}</div>
        <div class="handicap-category">${category}</div>
      </div>
      
      <div class="handicap-details">
        <div class="detail-item">
          <span class="detail-label">Success Rate</span>
          <span class="detail-value">${avgScore.toFixed(1)}%</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Reputation</span>
          <span class="detail-value trend ${
            trend >= 0 ? "positive" : "negative"
          }">
            ${getIconString(trendIcon, 14)} ${trendText}
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Target</span>
          <span class="detail-value">70% (Safe Haven)</span>
        </div>
      </div>
      
      <div class="handicap-progress">
        <div class="progress-label">Progress to Admiral</div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${Math.min(
            (avgScore / 70) * 100,
            100,
          )}%"></div>
          <div class="progress-marker" style="left: 70%"></div>
        </div>
        <div class="progress-legend">
          <span>0%</span>
          <span class="goal-marker">70% Goal</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  `;

  return section;
}

function createMetricsGrid(stats, analytics) {
  const section = document.createElement("section");
  section.className = "pro-shop__metrics-section";

  const sectionHeader = document.createElement("div");
  sectionHeader.className = "section-header-lunaire";
  sectionHeader.innerHTML = `
    <div class="header-icon">${getIconString("chart", 28)}</div>
    <h2>Combat Metrics</h2>
  `;
  section.appendChild(sectionHeader);

  const grid = document.createElement("div");
  grid.className = "metrics-grid";

  const studyTimeHours = (stats.total_time || 0) / 3600;
  const currentStreak = analytics.current_streak || 0;
  const bestStreak = analytics.longest_streak || currentStreak;

  const metrics = [
    {
      icon: "scorecard",
      value: stats.total_quizzes || 0,
      label: "Sorties Flown",
      detail: `${stats.total_questions || 0} engagements`,
      color: "avocado",
    },
    {
      icon: "star",
      value: `${(stats.best_score || 0).toFixed(0)}%`,
      label: "Best Raid",
      detail: "Personal record",
      color: "gold",
    },
    {
      icon: "clock",
      value: `${studyTimeHours.toFixed(1)}h`,
      label: "Flight Time",
      detail: `${(stats.avg_time_per_question || 0).toFixed(0)}s avg/target`,
      color: "teal",
    },
    {
      icon: "lightning",
      value: currentStreak,
      label: "Active Duty",
      detail: `Best: ${bestStreak} days`,
      color: "sienna",
    },
  ];

  metrics.forEach((metric) => {
    const card = document.createElement("div");
    card.className = `metric-card card-lunaire metric-card--${metric.color}`;
    card.innerHTML = `
      <div class="metric-icon">${getIconString(metric.icon, 32)}</div>
      <div class="metric-value">${metric.value}</div>
      <div class="metric-label">${metric.label}</div>
      <div class="metric-detail">${metric.detail}</div>
    `;
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

function createCourseBreakdown(stats, subtopicData) {
  const section = document.createElement("section");
  section.className = "pro-shop__course-section";

  const sectionHeader = document.createElement("div");
  sectionHeader.className = "section-header-lunaire";
  sectionHeader.innerHTML = `
    <div class="header-icon">${getIconString("compass", 28)}</div>
    <h2>Sector Breakdown</h2>
    <p class="header-subtitle">Your combat effectiveness in each legal sector</p>
  `;
  section.appendChild(sectionHeader);

  const courseGrid = document.createElement("div");
  courseGrid.className = "course-grid";

  // Get subject performance from stats
  const subjectPerformance = stats.subject_performance || {};

  Object.entries(subjectPerformance).forEach(([subject, data]) => {
    const score = data.avg_score || 0;
    const attempts = data.total_questions || 0;

    // Determine performance level
    let levelClass;
    if (score >= 80) levelClass = "eagle"; // Legend
    else if (score >= 70) levelClass = "birdie"; // Captain
    else if (score >= 60) levelClass = "par"; // Ensign
    else if (score >= 50) levelClass = "bogey"; // Swabbie
    else levelClass = "double"; // Mutiny

    const courseCard = document.createElement("div");
    courseCard.className = `course-card card-lunaire ${levelClass}`;
    courseCard.innerHTML = `
      <div class="course-header">
        <span class="course-name">${subject}</span>
        <span class="course-score">${score.toFixed(0)}%</span>
      </div>
      <div class="course-bar">
        <div class="course-bar-fill" style="width: ${score}%"></div>
      </div>
      <div class="course-footer">
        <span class="course-attempts">${attempts} engagements</span>
        <span class="course-rating ${levelClass}">${getRatingForScore(
      score,
    )}</span>
      </div>
    `;
    courseGrid.appendChild(courseCard);
  });

  // If no subject data, show placeholder
  if (Object.keys(subjectPerformance).length === 0) {
    courseGrid.innerHTML = `
      <div class="no-course-data card-lunaire">
        ${getIconString("compass", 48)}
        <p>Fly more sorties to see sector breakdown</p>
      </div>
    `;
  }

  section.appendChild(courseGrid);
  return section;
}

function getRatingForScore(score) {
  if (score >= 80) return "Legend";
  if (score >= 70) return "Captain";
  if (score >= 60) return "Ensign";
  if (score >= 50) return "Swabbie";
  return "Mutiny";
}

function createRecentRoundsDisplay(recentRounds) {
  const section = document.createElement("section");
  section.className = "pro-shop__rounds-section";

  const sectionHeader = document.createElement("div");
  sectionHeader.className = "section-header-lunaire";
  sectionHeader.innerHTML = `
    <div class="header-icon">${getIconString("scorecard", 28)}</div>
    <h2>Recent Logs</h2>
  `;
  section.appendChild(sectionHeader);

  const roundsList = document.createElement("div");
  roundsList.className = "rounds-list";

  recentRounds.forEach((round, idx) => {
    const score = (round.correct / round.total) * 100;
    const parRelative = Math.round(score) - 70; // 70% is baseline

    const roundCard = document.createElement("div");
    roundCard.className = "round-card card-lunaire";
    roundCard.innerHTML = `
      <div class="round-position">${idx + 1}</div>
      <div class="round-details">
        <div class="round-course">${round.subject || "Mixed Sector"}</div>
        <div class="round-meta">
          ${new Date(round.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
          · ${round.total} targets
        </div>
      </div>
      <div class="round-score">
        <div class="score-value">${score.toFixed(0)}%</div>
        <div class="score-par ${parRelative >= 0 ? "above" : "below"}">
          ${parRelative >= 0 ? "+" : ""}${parRelative}
        </div>
      </div>
    `;
    roundsList.appendChild(roundCard);
  });

  if (recentRounds.length === 0) {
    roundsList.innerHTML = `
      <div class="no-rounds card-lunaire">
        ${getIconString("scorecard", 32)}
        <p>No recent patrols recorded</p>
      </div>
    `;
  }

  section.appendChild(roundsList);
  return section;
}

function createEquipmentRecommendations(recommendations, subtopicData) {
  const section = document.createElement("section");
  section.className = "pro-shop__equipment-section";

  const sectionHeader = document.createElement("div");
  sectionHeader.className = "section-header-lunaire";
  sectionHeader.innerHTML = `
    <div class="header-icon">${getIconString("golfClub", 28)}</div>
    <h2>Tactical Vulnerabilities</h2>
    <p class="header-subtitle">Areas where your defenses are weak</p>
  `;
  section.appendChild(sectionHeader);

  const equipmentList = document.createElement("div");
  equipmentList.className = "equipment-list";

  // Find weak areas from subtopic data
  const weakAreas = [];
  Object.entries(subtopicData || {}).forEach(([subject, topics]) => {
    Object.entries(topics || {}).forEach(([topic, data]) => {
      if (data.avg_score < 60 && data.total >= 3) {
        weakAreas.push({
          subject,
          topic,
          score: data.avg_score,
          attempts: data.total,
        });
      }
    });
  });

  // Sort by score (worst first)
  weakAreas.sort((a, b) => a.score - b.score);

  // Take top 5 recommendations
  const topRecommendations = weakAreas.slice(0, 5);

  if (topRecommendations.length > 0) {
    topRecommendations.forEach((area) => {
      const card = document.createElement("div");
      card.className = "equipment-card card-lunaire";
      card.innerHTML = `
        <div class="equipment-icon">${getIconString("compass", 24)}</div>
        <div class="equipment-details">
          <div class="equipment-name">${area.topic}</div>
          <div class="equipment-subject">${area.subject}</div>
        </div>
        <div class="equipment-score">
          <div class="score-value">${area.score.toFixed(0)}%</div>
          <div class="score-label">Current</div>
        </div>
        <button class="btn-lunaire btn-lunaire--outline btn-lunaire--sm practice-btn" 
                data-subject="${area.subject}" data-topic="${area.topic}">
          Reinforce
        </button>
      `;
      equipmentList.appendChild(card);
    });
  } else {
    equipmentList.innerHTML = `
      <div class="no-recommendations card-lunaire">
        ${getIconString("star", 48)}
        <h3>Systems Optimal!</h3>
        <p>You're performing well across all sectors. The fleet is proud.</p>
      </div>
    `;
  }

  section.appendChild(equipmentList);
  return section;
}

function createClubRecords(stats, analytics) {
  const section = document.createElement("section");
  section.className = "pro-shop__records-section";

  const sectionHeader = document.createElement("div");
  sectionHeader.className = "section-header-lunaire";
  sectionHeader.innerHTML = `
    <div class="header-icon">${getIconString("trophy", 28)}</div>
    <h2>Fleet Records</h2>
  `;
  section.appendChild(sectionHeader);

  const recordsGrid = document.createElement("div");
  recordsGrid.className = "records-grid";

  const records = [
    {
      title: "Highest Bounty",
      value: `${(stats.best_score || 0).toFixed(0)}%`,
      date: "Personal best",
      icon: "star",
    },
    {
      title: "Longest Campaign",
      value: `${analytics.longest_streak || 0} days`,
      date: "Consecutive raids",
      icon: "lightning",
    },
    {
      title: "Total Kills",
      value: stats.total_questions || 0,
      date: "Targets destroyed",
      icon: "book",
    },
    {
      title: "Attack Speed",
      value: `${(stats.fastest_avg_time || 45).toFixed(0)}s`,
      date: "Avg per target",
      icon: "clock",
    },
  ];

  records.forEach((record) => {
    const recordCard = document.createElement("div");
    recordCard.className = "record-card card-lunaire";
    recordCard.innerHTML = `
      <div class="record-icon">${getIconString(record.icon, 24)}</div>
      <div class="record-title">${record.title}</div>
      <div class="record-value">${record.value}</div>
      <div class="record-date">${record.date}</div>
    `;
    recordsGrid.appendChild(recordCard);
  });

  section.appendChild(recordsGrid);

  // Club fine print
  const finePrint = document.createElement("div");
  finePrint.className = "pro-shop__fine-print";
  finePrint.innerHTML = `
    <p>
      <em>"Statistics compiled according to Renegade Flotilla Protocols. 
      Past plunder is not indicative of future success. 
      The Admiral accepts no liability for overconfidence induced by favorable stats."</em>
    </p>
  `;
  section.appendChild(finePrint);

  return section;
}

// Pro Shop styles are now loaded from lunaire-design-system.css

export default createProShopPage;
