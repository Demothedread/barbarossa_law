/**
 * Study dock section with bar prep topics and material highlights.
 * @returns {HTMLElement}
 */
export function createStudyDockSection() {
  const section = document.createElement('section');
  section.className = 'study-dock-section module-frame';
  section.id = 'study-dock';

  section.innerHTML = `
    <div class="study-dock-header">
      <h2>📚 Study Dock: Bar Exam Topics & Prep</h2>
      <p>
        Dock here for a quick map of the bar exam universe. Review the core subjects,
        then raid the question bank for targeted practice.
      </p>
    </div>
    <div class="study-dock-grid">
      <div class="study-topic-card">
        <h3>Core MBE Subjects</h3>
        <ul>
          <li>Contracts</li>
          <li>Torts</li>
          <li>Civil Procedure</li>
          <li>Criminal Law & Procedure</li>
          <li>Evidence</li>
          <li>Property</li>
          <li>Constitutional Law</li>
        </ul>
      </div>
      <div class="study-topic-card">
        <h3>Essay & Performance Prep</h3>
        <ul>
          <li>Issue spotting drills</li>
          <li>Rule synthesis outlines</li>
          <li>Timed IRAC sprints</li>
          <li>Performance test task lists</li>
        </ul>
      </div>
      <div class="study-topic-card">
        <h3>Captain’s Prep Tips</h3>
        <ul>
          <li>Track weak subjects weekly.</li>
          <li>Review missed questions within 24 hours.</li>
          <li>Alternate mixed sets with focused drills.</li>
          <li>Simulate exam conditions once per week.</li>
        </ul>
      </div>
    </div>
  `;

  return section;
}
