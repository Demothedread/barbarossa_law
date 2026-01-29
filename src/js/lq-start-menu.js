import {
  fetchQuestionsByType,
  fetchSubjects,
  getVectorStoreStatus,
} from "./lq-api.js";
import { getIconString } from "./lunaire-icons.js";

/**
 * Create a start menu allowing users to choose number, subject, question type, and timer options.
 * @param {(opts:object)=>void} onStart Callback invoked when quiz should start.
 * @param {(opts:object)=>void} onGenerateQuestions Callback invoked when question generation is requested.
 * @returns {HTMLElement}
 */
export function createStartMenu(onStart, onGenerateQuestions) {
  const container = document.createElement("div");
  container.className = "start-menu";

  // Create Question Generator Section
  const generatorSection = createQuestionGeneratorSection(onGenerateQuestions);
  container.appendChild(generatorSection);

  // Create divider
  const divider = document.createElement("div");
  divider.className = "section-divider";
  divider.innerHTML = `
    <div class="divider-line"></div>
    <span class="divider-text">OR</span>
    <div class="divider-line"></div>
  `;
  container.appendChild(divider);

  // Create Quiz Setup Section
  const quizSection = document.createElement("div");
  quizSection.className = "quiz-setup-section";

  const quizHeader = document.createElement("div");
  quizHeader.className = "section-header";
  quizHeader.innerHTML = `
    <h3>${getIconString("flagPin", 24)} Start Quiz with Existing Questions</h3>
    <p>Choose from our database of law questions</p>
  `;
  quizSection.appendChild(quizHeader);

  const form = document.createElement("form");

  // Quick Start Buttons Section
  const quickStartSection = document.createElement("div");
  quickStartSection.className = "quick-start-section";
  quickStartSection.innerHTML = `
    <div class="quick-start-header">
      <span class="quick-start-label">${getIconString(
        "rocket",
        16,
      )} Quick Start:</span>
    </div>
    <div class="quick-start-buttons">
      <button type="button" class="quick-start-btn" data-count="9">9 Questions</button>
      <button type="button" class="quick-start-btn" data-count="50">50 Questions</button>
      <button type="button" class="quick-start-btn" data-count="100">100 Questions</button>
    </div>
  `;
  form.appendChild(quickStartSection);

  // Custom question count section with slider
  const customCountSection = document.createElement("div");
  customCountSection.className = "custom-count-section";

  const customToggle = document.createElement("button");
  customToggle.type = "button";
  customToggle.className = "custom-count-toggle";
  customToggle.innerHTML = `${getIconString("gear", 16)} Custom Amount`;

  const customControls = document.createElement("div");
  customControls.className = "custom-count-controls";
  customControls.style.display = "none";

  // Number of questions
  const labelNum = document.createElement("label");
  labelNum.textContent = "Number of Questions: ";
  const inputNum = document.createElement("input");
  inputNum.type = "number";
  inputNum.min = "1";
  inputNum.value = "9";
  inputNum.className = "question-count-input";
  labelNum.appendChild(inputNum);

  // Range slider for custom count
  const sliderContainer = document.createElement("div");
  sliderContainer.className = "slider-container";
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "1";
  slider.max = "200";
  slider.value = "9";
  slider.className = "question-count-slider";

  const sliderLabels = document.createElement("div");
  sliderLabels.className = "slider-labels";
  sliderLabels.innerHTML =
    "<span>1</span><span>50</span><span>100</span><span>200</span>";

  sliderContainer.appendChild(slider);
  sliderContainer.appendChild(sliderLabels);

  // Sync slider and input
  slider.addEventListener("input", () => {
    inputNum.value = slider.value;
  });
  inputNum.addEventListener("input", () => {
    slider.value = inputNum.value;
  });

  customControls.appendChild(labelNum);
  customControls.appendChild(sliderContainer);

  customToggle.addEventListener("click", () => {
    const isVisible = customControls.style.display !== "none";
    customControls.style.display = isVisible ? "none" : "block";
    customToggle.classList.toggle("active", !isVisible);
  });

  customCountSection.appendChild(customToggle);
  customCountSection.appendChild(customControls);
  form.appendChild(customCountSection);

  // Quick start button handlers
  quickStartSection.querySelectorAll(".quick-start-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const count = parseInt(btn.dataset.count);
      inputNum.value = count;
      slider.value = count;
      // Highlight selected button
      quickStartSection
        .querySelectorAll(".quick-start-btn")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  // Default select the 9 question button
  quickStartSection.querySelector('[data-count="9"]').classList.add("selected");

  // Subject
  const labelSub = document.createElement("label");
  labelSub.textContent = " Subject: ";
  const selectSub = document.createElement("select");
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "(Any)";
  selectSub.appendChild(defaultOpt);
  labelSub.appendChild(selectSub);
  form.appendChild(labelSub);

  // Question Type
  const labelType = document.createElement("label");
  labelType.textContent = " Question Type: ";
  const selectType = document.createElement("select");

  const mixOpt = document.createElement("option");
  mixOpt.value = "mix";
  mixOpt.textContent = "Mix (All Questions)";
  selectType.appendChild(mixOpt);

  const mbeOpt = document.createElement("option");
  mbeOpt.value = "mbe";
  mbeOpt.textContent = "MBE Only";
  selectType.appendChild(mbeOpt);

  const generatedOpt = document.createElement("option");
  generatedOpt.value = "generated";
  generatedOpt.textContent = "AI Generated Only";
  selectType.appendChild(generatedOpt);

  labelType.appendChild(selectType);
  form.appendChild(labelType);

  // Hide Answers Until End Toggle
  const answerRevealSection = document.createElement("div");
  answerRevealSection.className = "answer-reveal-section";

  const hideAnswersLabel = document.createElement("label");
  hideAnswersLabel.className = "toggle-label";
  hideAnswersLabel.innerHTML = `
    <span class="toggle-text">${getIconString(
      "lock",
      16,
    )} Hide Correct Answers Until End:</span>
    <div class="toggle-switch">
      <input type="checkbox" id="hideAnswersToggle" class="toggle-input">
      <span class="toggle-slider"></span>
    </div>
  `;

  const hideAnswersCheckbox =
    hideAnswersLabel.querySelector("#hideAnswersToggle");

  const hideAnswersDesc = document.createElement("p");
  hideAnswersDesc.className = "toggle-description";
  hideAnswersDesc.textContent =
    "When enabled, correct answers won't be revealed until you finish the entire question set.";

  answerRevealSection.appendChild(hideAnswersLabel);
  answerRevealSection.appendChild(hideAnswersDesc);
  form.appendChild(answerRevealSection);

  // Quiz Mode Selection
  const labelMode = document.createElement("label");
  labelMode.textContent = " Quiz Mode: ";
  const selectMode = document.createElement("select");

  const standardOpt = document.createElement("option");
  standardOpt.value = "standard";
  standardOpt.textContent = "Standard Quiz";
  selectMode.appendChild(standardOpt);

  const quizShowOpt = document.createElement("option");
  quizShowOpt.value = "quiz-show";
  quizShowOpt.textContent = "Quiz Show Mode (1970s Game Show)";
  selectMode.appendChild(quizShowOpt);

  const friendlyOpt = document.createElement("option");
  friendlyOpt.value = "friendly";
  friendlyOpt.textContent = "Friendly Mode (Baseball Theme)";
  selectMode.appendChild(friendlyOpt);

  const barbarossaOpt = document.createElement("option");
  barbarossaOpt.value = "barbarossa-overtime";
  barbarossaOpt.textContent = "Barbarossa Overtime (Cross-Out + Negative Time)";
  selectMode.appendChild(barbarossaOpt);

  labelMode.appendChild(selectMode);
  form.appendChild(labelMode);

  // Timer setting
  const labelTimer = document.createElement("label");
  labelTimer.textContent = " Minutes per Question: ";
  const inputTimer = document.createElement("input");
  inputTimer.type = "number";
  inputTimer.min = "0.5";
  inputTimer.max = "10";
  inputTimer.step = "0.1";
  inputTimer.value = "1.8";
  labelTimer.appendChild(inputTimer);
  form.appendChild(labelTimer);

  // Quiz Show mode description
  const quizShowDesc = document.createElement("div");
  quizShowDesc.className = "quiz-show-description";
  quizShowDesc.style.display = "none";
  quizShowDesc.innerHTML = `
  <div class="mode-description">
    <h4>${getIconString("moon", 20)} Quiz Show Mode Features:</h4>
    <ul>
      <li>${getIconString("trophy", 16)} TV show intro sequence</li>
      <li>${getIconString("chart", 16)} Game show scoring with time bonuses</li>
      <li>${getIconString(
        "clock",
        16,
      )} Dramatic 1970s-style timer with 10-second warning</li>
      <li>${getIconString(
        "star",
        16,
      )} Retro gameboard background with glowing squares</li>
      <li>${getIconString("flagPin", 16)} High score leaderboard</li>
      <li>${getIconString(
        "user",
        16,
      )} Game show host personality and encouragement</li>
    </ul>
    <p><em>Experience law quizzing like a classic 1970s game show!</em></p>
  </div>
`;
  form.appendChild(quizShowDesc);

  // Friendly mode description
  const friendlyDesc = document.createElement("div");
  friendlyDesc.className = "friendly-description";
  friendlyDesc.style.display = "none";
  friendlyDesc.innerHTML = `
  <div class="mode-description">
    <h4>${getIconString("user", 20)} Friendly Mode Features:</h4>
    <ul>
      <li>${getIconString(
        "clubhouse",
        16,
      )} Baseball stadium intro with diamond background</li>
      <li>${getIconString("book", 16)} No timer - take your time to learn!</li>
      <li>${getIconString(
        "check",
        16,
      )} Immediate answer reveal after each question</li>
      <li>${getIconString(
        "golfClub",
        16,
      )} "On deck" and "In the hole" topic selection</li>
      <li>${getIconString(
        "chart",
        16,
      )} Baseball scoreboard with runs for/against</li>
      <li>${getIconString(
        "star",
        16,
      )} Baseball terminology and encouragement</li>
      <li>${getIconString(
        "flagPin",
        16,
      )} Educational focus with detailed explanations</li>
    </ul>
    <p><em>A relaxed, educational experience with baseball charm!</em></p>
  </div>
`;
  form.appendChild(friendlyDesc);

  const barbarossaDesc = document.createElement("div");
  barbarossaDesc.className = "barbarossa-description";
  barbarossaDesc.style.display = "none";
  barbarossaDesc.innerHTML = `
    <div class="mode-description">
      <h4>${getIconString("pirateSkull", 20)} Barbarossa Overtime Features:</h4>
      <ul>
        <li>${getIconString(
          "pencil",
          16,
        )} Cross out choices before committing</li>
        <li>${getIconString(
          "clock",
          16,
        )} Timer keeps running into negative time</li>
        <li>${getIconString(
          "gear",
          16,
        )} Edit answers anytime, even after time expires</li>
        <li>${getIconString(
          "rocket",
          16,
        )} Atomic-age pirate theming and sounds</li>
      </ul>
      <p><em>Finish strong, even after the clock hits zero.</em></p>
    </div>
  `;
  form.appendChild(barbarossaDesc);

  // Update description visibility based on mode selection
  selectMode.addEventListener("change", () => {
    // Hide all descriptions first
    quizShowDesc.style.display = "none";
    friendlyDesc.style.display = "none";
    barbarossaDesc.style.display = "none";

    if (selectMode.value === "quiz-show") {
      quizShowDesc.style.display = "block";
      // Auto-switch to quiz-show theme if not already
      if (
        window.themeManager &&
        window.themeManager.currentTheme !== "quiz-show"
      ) {
        window.themeManager.applyTheme("quiz-show");
      }
    } else if (selectMode.value === "friendly") {
      friendlyDesc.style.display = "block";
      // Auto-switch to friendly theme if not already
      if (
        window.themeManager &&
        window.themeManager.currentTheme !== "friendly"
      ) {
        window.themeManager.applyTheme("friendly");
      }
    } else if (selectMode.value === "barbarossa-overtime") {
      barbarossaDesc.style.display = "block";
      if (
        window.themeManager &&
        window.themeManager.currentTheme !== "barbarossa"
      ) {
        window.themeManager.applyTheme("barbarossa");
      }
    }
  });

  // Submit button
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.innerHTML = `${getIconString("rocket", 16)} Start Quiz`;
  submitBtn.className = "btn btn-primary start-btn";
  form.appendChild(submitBtn);

  quizSection.appendChild(form);
  container.appendChild(quizSection);

  // Load subjects and set up form
  loadSubjects();

  // Handle form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const n = parseInt(inputNum.value) || 9;
    const subject = selectSub.value;
    const questionType = selectType.value;
    const quizMode = selectMode.value;
    const timer = parseFloat(inputTimer.value) || 1.8;
    const hideAnswersUntilEnd = hideAnswersCheckbox.checked;

    if (n > 0) {
      onStart({
        n,
        subject,
        questionType,
        quizMode,
        timer,
        hideAnswersUntilEnd,
      });
    }
  });

  // Update max questions based on filters
  async function updateMax() {
    const subject = selectSub.value;
    const questionType = selectType.value;
    let n = 999;
    try {
      const res = await fetchQuestionsByType(999, subject, questionType);
      n = res.available || 999;
    } catch (error) {
      console.error("Error fetching available questions:", error);
    }
    inputNum.max = n;
    if (parseInt(inputNum.value) > n) inputNum.value = n;
  }

  selectSub.addEventListener("change", updateMax);
  selectType.addEventListener("change", updateMax);
  updateMax();

  return container;

  // === HELPER FUNCTIONS ===

  function createQuestionGeneratorSection(onGenerateQuestions) {
    const section = document.createElement("div");
    section.className = "generator-section";

    const header = document.createElement("div");
    header.className = "section-header featured";
    header.innerHTML = `
      <h3>${getIconString("hal", 24)} AI Question Generator</h3>
      <p>Create new custom questions with AI</p>
      <div class="feature-badges">
        <span class="badge">Custom Instructions</span>
        <span class="badge">Subject Targeting</span>
        <span class="badge">Difficulty Control</span>
      </div>
    `;
    section.appendChild(header);

    const content = document.createElement("div");
    content.className = "generator-content";
    content.id = "generatorContent";

    // Quick setup form
    const quickForm = document.createElement("div");
    quickForm.className = "quick-generator-form";
    quickForm.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label for="quickQuestions">Questions:</label>
          <select id="quickQuestions" class="form-select">
            <option value="5">5 Questions</option>
            <option value="10" selected>10 Questions</option>
            <option value="15">15 Questions</option>
            <option value="20">20 Questions</option>
            <option value="25">25 Questions</option>
          </select>
        </div>
        <div class="form-group">
          <label for="quickSubject">Focus:</label>
          <select id="quickSubject" class="form-select">
            <option value="">All Subjects</option>
            <option value="contracts">Contracts</option>
            <option value="torts">Torts</option>
            <option value="criminal-law">Criminal Law</option>
            <option value="constitutional-law">Constitutional Law</option>
          </select>
        </div>
      </div>
      <div class="generator-actions">
        <button type="button" class="btn btn-secondary btn-full" id="advancedGeneratorBtn">
          ${getIconString("gear", 16)} Advanced Options
        </button>
        <button type="button" class="btn btn-primary btn-full" id="quickGenerateBtn">
          ${getIconString("rocket", 16)} Generate Questions
        </button>
      </div>
    `;

    content.appendChild(quickForm);

    // Status indicator
    const statusIndicator = document.createElement("div");
    statusIndicator.className = "generator-status-mini";
    statusIndicator.id = "generatorStatus";
    statusIndicator.innerHTML = `
      <div class="status-checking">
        <span class="status-icon">${getIconString("clock", 16)}</span>
        <span class="status-text">Checking AI availability...</span>
      </div>
    `;
    content.appendChild(statusIndicator);

    section.appendChild(content);

    // Set up event listeners
    setupGeneratorEvents(onGenerateQuestions);

    // Check generator status
    checkGeneratorStatus();

    return section;
  }

  function setupGeneratorEvents(onGenerateQuestions) {
    // Quick generate button
    setTimeout(() => {
      const quickBtn = document.getElementById("quickGenerateBtn");
      if (quickBtn) {
        quickBtn.addEventListener("click", () => {
          const numQuestions = parseInt(
            document.getElementById("quickQuestions").value,
          );
          const subject = document.getElementById("quickSubject").value;

          if (onGenerateQuestions) {
            onGenerateQuestions({
              mode: "quick",
              numQuestions,
              subject,
              customInstructions: "",
            });
          }
        });
      }

      // Advanced options button
      const advancedBtn = document.getElementById("advancedGeneratorBtn");
      if (advancedBtn) {
        advancedBtn.addEventListener("click", () => {
          if (onGenerateQuestions) {
            onGenerateQuestions({
              mode: "advanced",
            });
          }
        });
      }
    }, 100);
  }

  async function checkGeneratorStatus() {
    setTimeout(async () => {
      const statusEl = document.getElementById("generatorStatus");
      if (!statusEl) return;

      try {
        const status = await getVectorStoreStatus();

        if (status.available) {
          statusEl.innerHTML = `
            <div class="status-ready">
              <span class="status-icon">${getIconString("check", 16)}</span>
              <span class="status-text">AI Generator Ready</span>
            </div>
          `;

          // Enable generator buttons
          const quickBtn = document.getElementById("quickGenerateBtn");
          const advancedBtn = document.getElementById("advancedGeneratorBtn");
          if (quickBtn) quickBtn.disabled = false;
          if (advancedBtn) advancedBtn.disabled = false;
        } else {
          statusEl.innerHTML = `
            <div class="status-unavailable">
              <span class="status-icon">${getIconString("wrong", 16)}</span>
              <span class="status-text">AI Generator Unavailable</span>
            </div>
          `;

          // Disable generator buttons
          const quickBtn = document.getElementById("quickGenerateBtn");
          const advancedBtn = document.getElementById("advancedGeneratorBtn");
          if (quickBtn) quickBtn.disabled = true;
          if (advancedBtn) advancedBtn.disabled = true;
        }
      } catch (error) {
        statusEl.innerHTML = `
          <div class="status-error">
            <span class="status-icon">${getIconString("warning", 16)}</span>
            <span class="status-text">Connection Error</span>
          </div>
        `;

        // Disable generator buttons
        const quickBtn = document.getElementById("quickGenerateBtn");
        const advancedBtn = document.getElementById("advancedGeneratorBtn");
        if (quickBtn) quickBtn.disabled = true;
        if (advancedBtn) advancedBtn.disabled = true;
      }
    }, 500);
  }

  async function loadSubjects() {
    try {
      const subjects = await fetchSubjects();
      subjects.forEach((subject) => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        selectSub.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading subjects:", error);
    }
  }
}
