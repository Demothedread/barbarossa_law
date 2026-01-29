import { createStartMenu } from "./lq-start-menu.js";
import { getIconString } from "./lunaire-icons.js";

/**
 * Exam bank section with multi-mode routing.
 * @param {Function} onStartQuiz - Callback to start a quiz.
 * @param {Function} onGenerateQuestions - Callback to launch question generator.
 * @returns {HTMLElement}
 */
export function createExamBankSection(onStartQuiz, onGenerateQuestions) {
  const section = document.createElement("section");
  section.className = "exam-bank-section module-frame";
  section.id = "exam-bank";

  const header = document.createElement("div");
  header.className = "exam-bank-header";
  header.innerHTML = `
    <h2>${getIconString("compass", 28)} Barbarossa Exam Question Bank</h2>
    <p>
      Choose a quiz mode below. Each one pulls from the multiple-choice bank and
      routes into a distinct experience — from cross-out overtime to retro game show chaos.
    </p>
  `;

  const modeGrid = document.createElement("div");
  modeGrid.className = "exam-bank-modes";
  modeGrid.innerHTML = `
    <div class="exam-mode-card">
      <h3>${getIconString("flagPin", 24)} Standard Raid</h3>
      <p>Classic multiple-choice sprint with steady timing.</p>
      <button class="btn-start-quiz" data-mode="standard">Set Sail</button>
    </div>
    <div class="exam-mode-card">
      <h3>${getIconString("trophy", 24)} Quiz Show Nebula</h3>
      <p>Retro 1970s game show energy and dramatic timer cues.</p>
      <button class="btn-start-quiz" data-mode="quiz-show">Roll Camera</button>
    </div>
    <div class="exam-mode-card">
      <h3>${getIconString("golfClub", 24)} Friendly Dock</h3>
      <p>No timer. Learn with instant feedback and zero pressure.</p>
      <button class="btn-start-quiz" data-mode="friendly">Warm Up</button>
    </div>
    <div class="exam-mode-card highlight">
      <h3>${getIconString("pirateSkull", 24)} Barbarossa Overtime</h3>
      <p>Cross out answers, keep editing after the clock hits zero, and track negative time.</p>
      <button class="btn-start-quiz" data-mode="barbarossa-overtime">Engage Overtime</button>
    </div>
  `;

  const startMenu = createStartMenu(onStartQuiz, onGenerateQuestions);
  startMenu.classList.add("exam-bank-menu");

  section.appendChild(header);
  section.appendChild(modeGrid);
  section.appendChild(startMenu);

  return section;
}
