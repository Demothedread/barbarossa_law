/**
 * Statistics page for Law Quizzer
 * Displays performance metrics and historical quiz data
 */
import { getQuizHistory } from './lq-api.js';

export async function createStatisticsPage() {
  const container = document.createElement('div');
  container.className = 'statistics-page';
  
  // Show loading
  const loadingEl = document.createElement('div');
  loadingEl.className = 'loading';
  loadingEl.textContent = 'Loading statistics...';
  container.appendChild(loadingEl);
  
  try {
    // Get user ID from local storage
    const userId = localStorage.getItem('userId') || 'anonymous';
    
    // Fetch quiz history
    const historyData = await getQuizHistory(userId);
    
    // Remove loading indicator
    container.removeChild(loadingEl);
    
    // Create statistics dashboard
    renderStatsDashboard(container, historyData);
  } catch (error) {
    console.error('Failed to load statistics:', error);
    loadingEl.textContent = 'Failed to load statistics. Please try again.';
  }
  
  return container;
}

/**
 * Render the statistics dashboard
 */
function renderStatsDashboard(container, data) {
  const { history, stats } = data;
  
  if (!history || history.length === 0) {
    const noDataEl = document.createElement('div');
    noDataEl.className = 'no-stats';
    noDataEl.innerHTML = `
      <h2>No Quiz History Yet</h2>
      <p>Complete at least one quiz to see your performance statistics.</p>
    `;
    container.appendChild(noDataEl);
    return;
  }
  
  // Create header section
  const header = document.createElement('div');
  header.className = 'stats-header';
  header.innerHTML = `
    <h2>Performance Dashboard</h2>
    <div class="stats-summary">
      <div class="stats-card">
        <h3>${stats.total_quizzes}</h3>
        <p>Total Quizzes</p>
      </div>
      <div class="stats-card">
        <h3>${stats.total_questions}</h3>
        <p>Total Questions</p>
      </div>
      <div class="stats-card">
        <h3>${stats.avg_score.toFixed(1)}%</h3>
        <p>Overall Average</p>
      </div>
    </div>
  `;
  container.appendChild(header);
  
  // Create performance by subject section
  const subjectSection = document.createElement('div');
  subjectSection.className = 'stats-section';
  subjectSection.innerHTML = '<h3>Performance by Subject</h3>';
  
  const subjectTable = document.createElement('table');
  subjectTable.className = 'stats-table';
  subjectTable.innerHTML = `
    <thead>
      <tr>
        <th>Subject</th>
        <th>Questions</th>
        <th>Correct</th>
        <th>Average</th>
        <th>Quizzes</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  
  const tbody = subjectTable.querySelector('tbody');
  Object.entries(stats.by_subject).forEach(([subject, data]) => {
    const row = document.createElement('tr');
    const passClass = data.avg_score >= 65 ? 'pass' : 'no-pass';
    
    row.innerHTML = `
      <td>${subject}</td>
      <td>${data.questions}</td>
      <td>${data.correct}</td>
      <td class="${passClass}">${data.avg_score.toFixed(1)}%</td>
      <td>${data.quizzes}</td>
    `;
    
    tbody.appendChild(row);
  });
  
  subjectSection.appendChild(subjectTable);
  container.appendChild(subjectSection);
  
  // Create performance chart
  const chartSection = document.createElement('div');
  chartSection.className = 'stats-section';
  chartSection.innerHTML = '<h3>Performance Trend</h3>';
  
  const chartContainer = document.createElement('div');
  chartContainer.className = 'chart-container';
  chartSection.appendChild(chartContainer);
  
  // Create canvas for the chart
  const canvas = document.createElement('canvas');
  canvas.id = 'performance-chart';
  chartContainer.appendChild(canvas);
  
  // Add chart section to container
  container.appendChild(chartSection);
  
  // Add recent quizzes section
  const recentSection = document.createElement('div');
  recentSection.className = 'stats-section';
  recentSection.innerHTML = '<h3>Recent Quizzes</h3>';
  
  const quizTable = document.createElement('table');
  quizTable.className = 'stats-table recent-quizzes';
  quizTable.innerHTML = `
    <thead>
      <tr>
        <th>Date</th>
        <th>Subject</th>
        <th>Score</th>
        <th>Time</th>
        <th>Questions</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  
  const quizTbody = quizTable.querySelector('tbody');
  history.forEach(quiz => {
    const date = new Date(quiz.created_at);
    const formattedDate = date.toLocaleDateString() + ' ' + 
      date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
    const score = (quiz.correct / quiz.total * 100).toFixed(1);
    const passClass = score >= 65 ? 'pass' : 'no-pass';
    
    const mins = Math.floor(quiz.duration_seconds / 60);
    const secs = quiz.duration_seconds % 60;
    const timeClass = quiz.negative_time ? 'negative-time' : '';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formattedDate}</td>
      <td>${quiz.subject || 'Mixed'}</td>
      <td class="${passClass}">${score}% (${quiz.correct}/${quiz.total})</td>
      <td class="${timeClass}">${mins}m ${secs}s</td>
      <td>${quiz.total}</td>
    `;
    
    quizTbody.appendChild(row);
  });
  
  recentSection.appendChild(quizTable);
  container.appendChild(recentSection);
  
  // Create performance chart using chart.js
  // This will run after the DOM has been updated
  setTimeout(() => {
    createPerformanceChart(history);
  }, 0);
}

/**
 * Create a line chart showing quiz performance over time
 */
function createPerformanceChart(history) {
  if (!window.Chart) {
    // Dynamically load Chart.js if not available
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => createChart();
    document.head.appendChild(script);
  } else {
    createChart();
  }
  
  function createChart() {
    const canvas = document.getElementById('performance-chart');
    if (!canvas) return;
    
    // Process data for chart
    const chartData = history.slice().reverse().map(quiz => ({
      date: new Date(quiz.created_at),
      score: (quiz.correct / quiz.total) * 100
    }));
    
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: chartData.map(d => d.date.toLocaleDateString()),
        datasets: [
          {
            label: 'Score (%)',
            data: chartData.map(d => d.score),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: false
          },
          {
            label: 'Passing Score (65%)',
            data: Array(chartData.length).fill(65),
            borderColor: 'rgba(255, 99, 132, 0.7)',
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 100,
            title: {
              display: true,
              text: 'Score (%)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Quiz Date'
            }
          }
        }
      }
    });
  }
}
