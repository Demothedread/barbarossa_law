import { fetchAIExplanations, saveQuizHistory } from "./lq-api.js";
import { getIconString } from "./lunaire-icons.js";

/**
 * Create a review screen summarizing answers and stats.
 */
// Static review: questions from static questionData, use ProgressTracker for stats
function createStaticReview(questions, answers, tracker) {
  const container = document.createElement("div");
  container.className = "review";
  questions.forEach((q, idx) => {
    const block = document.createElement("div");
    const text = document.createElement("p");
    text.textContent = q.text;
    block.appendChild(text);
    const list = document.createElement("ul");
    q.choices.forEach((c, i) => {
      const li = document.createElement("li");
      li.textContent = c;
      if (i === q.correct) li.classList.add("correct");
      if (i === answers[idx] && i !== q.correct) li.classList.add("incorrect");
      list.appendChild(li);
    });
    block.appendChild(list);
    const expl = document.createElement("p");
    expl.textContent = q.explanation;
    block.appendChild(expl);
    container.appendChild(block);
  });
  const stats = tracker.getTopicStats();
  const statsDiv = document.createElement("div");
  Object.entries(stats).forEach(([topic, info]) => {
    const p = document.createElement("p");
    p.textContent =
      `${topic}: ${info.correctPercent.toFixed(0)}% correct, ` +
      `${info.percentOfTotal.toFixed(0)}% of questions, ` +
      `Avg ${Math.round(info.avgTimeMs / 1000)}s each`;
    statsDiv.appendChild(p);
  });
  container.appendChild(statsDiv);
  return container;
}

// API-based review: questions from backend, use meta info for summary
function createApiReview(questions, answers, meta) {
  const container = document.createElement("div");
  container.className = "review";

  // Create state for question-by-question navigation
  const state = {
    currentQuestion: 0,
    totalQuestions: questions.length,
    aiExplanations: meta.aiExplanations || null, // Use pre-fetched explanations if available
    loadingExplanations: false,
  };

  // Create fixed summary header
  const summaryHeader = document.createElement("div");
  summaryHeader.className = "review-header";

  const mins = Math.floor(meta.duration_s / 60);
  const secs = meta.duration_s % 60;

  // Get the current subject if available
  const subject = questions[0]?.subject || "All Subjects";

  // Calculate subject-specific score if we can determine it
  let subjectScore = {
    correct: 0,
    total: 0,
  };

  // Calculate subject-specific scores
  questions.forEach((q, idx) => {
    if (q.subject === subject) {
      subjectScore.total++;
      if (answers[idx] !== null && "ABCD"[answers[idx]] === q.answer) {
        subjectScore.correct++;
      }
    }
  });

  const scoreHtml = `
    <div class="score-summary">
      <div class="total-score">
        <h3>Total Score: ${meta.correct}/${meta.total} (${(
    (meta.correct / meta.total) *
    100
  ).toFixed(1)}%)</h3>
        <p>Time: ${mins}m ${secs}s</p>
      </div>
      <div class="subject-score">
        <h4>${subject} Score: ${subjectScore.correct}/${subjectScore.total} 
            (${
              subjectScore.total > 0
                ? ((subjectScore.correct / subjectScore.total) * 100).toFixed(1)
                : 0
            }%)</h4>
      </div>
    </div>
  `;

  summaryHeader.innerHTML = scoreHtml;
  container.appendChild(summaryHeader);

  // Create question container that will be updated
  const questionContainer = document.createElement("div");
  questionContainer.className = "question-review-container";
  container.appendChild(questionContainer);

  // Create navigation controls
  const navControls = document.createElement("div");
  navControls.className = "review-navigation";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "< Previous";
  prevBtn.onclick = () => {
    if (state.currentQuestion > 0) {
      state.currentQuestion--;
      renderQuestion();
    }
  };

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next >";
  nextBtn.onclick = () => {
    if (state.currentQuestion < state.totalQuestions - 1) {
      state.currentQuestion++;
      renderQuestion();
    }
  };

  const questionCounter = document.createElement("span");
  questionCounter.className = "question-counter";

  navControls.appendChild(prevBtn);
  navControls.appendChild(questionCounter);
  navControls.appendChild(nextBtn);

  container.appendChild(navControls);

  // Fetch AI explanations as soon as review screen loads (if not already available)
  async function loadAIExplanations() {
    // If explanations are already available from background fetch, skip the API call
    if (
      state.aiExplanations !== null &&
      Object.keys(state.aiExplanations).length > 0
    ) {
      console.log("Using pre-fetched AI explanations from background fetch");
      playCompletionSound(meta.correct, meta.total);
      // Still save quiz history
      try {
        const negativeTime =
          meta.duration_s > (questions.length * 60 * meta.timer || 0);
        await saveQuizHistory({
          user_id: localStorage.getItem("userId") || "anonymous",
          subject: questions[0]?.subject || "",
          correct: meta.correct,
          total: meta.total,
          duration_seconds: meta.duration_s,
          questions: questions.map((q) => q.idx),
          answers: answers,
          negative_time: negativeTime,
        });
      } catch (error) {
        console.error("Failed to save quiz history:", error);
      }
      return;
    }

    if (state.loadingExplanations) return;

    state.loadingExplanations = true;

    // Create loading indicator
    const loadingEl = document.createElement("div");
    loadingEl.className = "ai-loading";
    loadingEl.textContent = "Loading AI explanations...";
    container.appendChild(loadingEl);

    try {
      console.log("Fetching AI explanations (fallback)...");
      // Get question IDs
      const questionIds = questions.map((q) => q.idx);
      state.aiExplanations = await fetchAIExplanations(questionIds);

      // Play completion sound after explanations are loaded
      playCompletionSound(meta.correct, meta.total);

      // Save quiz history with completion info
      const negativeTime =
        meta.duration_s > (questions.length * 60 * meta.timer || 0);
      await saveQuizHistory({
        user_id: localStorage.getItem("userId") || "anonymous",
        subject: questions[0]?.subject || "",
        correct: meta.correct,
        total: meta.total,
        duration_seconds: meta.duration_s,
        questions: questions.map((q) => q.idx),
        answers: answers,
        negative_time: negativeTime,
      });
    } catch (error) {
      console.error("Failed to load AI explanations:", error);
      state.aiExplanations = {};
      // Still play sound even if explanations fail
      playCompletionSound(meta.correct, meta.total);
    } finally {
      state.loadingExplanations = false;
      if (container.contains(loadingEl)) {
        container.removeChild(loadingEl);
      }
      // Re-render current question with AI explanations
      renderQuestion();
    }
  }

  async function fetchAudioFiles(folder) {
    try {
      const response = await fetch(`${folder}files.json`);
      if (!response.ok)
        throw new Error(`Failed to fetch audio files from ${folder}`);
      return await response.json(); // Expecting a JSON array of file names
    } catch (error) {
      console.error("Error fetching audio files:", error);
      return []; // Return an empty array on failure
    }
  }

  async function playCompletionSound(correct, total) {
    const percentage = (correct / total) * 100;
    const folder = percentage >= 65 ? "assets/winner/" : "assets/losers/";

    try {
      const songs = await fetchAudioFiles(folder);
      if (songs.length === 0) throw new Error("No audio files available");

      const randomSong = songs[Math.floor(Math.random() * songs.length)];
      const audio = new Audio(`${folder}${randomSong}`);
      audio.volume = 0.6;
      audio.currentTime = 0; // Start from the beginning
      audio.play().catch((e) => console.log("Audio play failed:", e));

      // Stop playback after 10 seconds
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0; // Reset to the beginning
      }, 10000);

      // Add visual celebration or motivation
      const reviewElement = container.querySelector(".review-header");
      if (reviewElement) {
        if (percentage >= 65) {
          reviewElement.classList.add("success-celebration");
          createConfettiEffect(reviewElement);
        } else {
          reviewElement.classList.add("failure-motivation");
        }
      }
    } catch (error) {
      console.error("Failed to play completion sound:", error);
    }
  }

  // Confetti effect for high scores
  function createConfettiEffect(element) {
    const colors = [
      "#FF69B4",
      "#FF7F7F",
      "#98FB98",
      "#E6E6FA",
      "#FFFACD",
      "#87CEEB",
    ];

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement("div");
      confetti.style.position = "absolute";
      confetti.style.width = "10px";
      confetti.style.height = "10px";
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + "%";
      confetti.style.animationName = "confetti-fall";
      confetti.style.animationDuration = Math.random() * 3 + 2 + "s";
      confetti.style.animationTimingFunction = "ease-out";
      confetti.style.animationFillMode = "forwards";

      element.style.position = "relative";
      element.appendChild(confetti);

      // Remove confetti after animation
      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      }, 5000);
    }

    // Add confetti CSS animation if not already present
    if (!document.querySelector("#confetti-style")) {
      const style = document.createElement("style");
      style.id = "confetti-style";
      style.textContent = `
        @keyframes confetti-fall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Start loading AI explanations
  loadAIExplanations();

  // Function to render current question
  function renderQuestion() {
    const idx = state.currentQuestion;
    const q = questions[idx];
    const userAnswer = answers[idx];
    const correctIdx = ["A", "B", "C", "D"].indexOf(q.answer);

    // Update question counter
    questionCounter.textContent = `Question ${idx + 1} of ${
      state.totalQuestions
    }`;

    // Update prev/next buttons
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === state.totalQuestions - 1;

    // Clear container
    questionContainer.innerHTML = "";

    // Create question block
    const questionBlock = document.createElement("div");
    questionBlock.className = "question-review";

    // Add prompt if exists
    if (q.prompt && q.prompt.trim()) {
      const promptElement = document.createElement("div");
      promptElement.className = "prompt-review";
      promptElement.textContent = q.prompt;
      questionBlock.appendChild(promptElement);
    }

    // Add question text
    const questionText = document.createElement("div");
    questionText.className = "question-text-review";
    questionText.textContent = q.question;
    questionBlock.appendChild(questionText);

    // Add choices with integrated AI explanations
    const choicesList = document.createElement("ul");
    choicesList.className = "choices-review";

    const letters = ["A", "B", "C", "D"];

    // Get AI explanations if available
    const aiData =
      state.aiExplanations && state.aiExplanations[q.idx]
        ? state.aiExplanations[q.idx]
        : null;

    q.choices.forEach((choice, i) => {
      const li = document.createElement("li");
      li.className = "choice-container";

      // Create choice header with letter and text
      const choiceHeader = document.createElement("div");
      choiceHeader.className = "choice-header";

      // Apply appropriate styling based on correct answer and user's answer
      if (i === correctIdx) {
        choiceHeader.className += " correct-answer";
        li.classList.add("correct-choice");
      }
      if (userAnswer === i && i !== correctIdx) {
        choiceHeader.className += " incorrect-answer";
        li.classList.add("user-incorrect");
      }
      if (userAnswer === i) {
        choiceHeader.className += " user-selected";
        li.classList.add("user-choice");
      }

      const letter = letters[i];
      const isCorrect = i === correctIdx;

      // Choice text with status indicator
      if (isCorrect) {
        choiceHeader.innerHTML = `<span class="choice-letter correct">${letter}.</span> <span class="choice-text">${choice}</span> <span class="correct-indicator">${getIconString(
          "check",
          14,
        )} CORRECT</span>`;
      } else {
        choiceHeader.innerHTML = `<span class="choice-letter">${letter}.</span> <span class="choice-text">${choice}</span>`;
      }

      li.appendChild(choiceHeader);

      // Add AI explanation if available - handle both data formats
      let explanation = null;

      if (aiData) {
        // Try new format first: aiData.explanations[letter]
        if (aiData.explanations && aiData.explanations[letter]) {
          explanation = aiData.explanations[letter];
        }
        // Try old format: aiData.choice_x_explanation
        else {
          const oldFormatKey = `choice_${letter.toLowerCase()}_explanation`;
          if (aiData[oldFormatKey]) {
            explanation = aiData[oldFormatKey];
          }
        }
      }

      if (explanation) {
        const explanationContainer = document.createElement("div");
        explanationContainer.className = `ai-explanation-content ${
          isCorrect ? "correct-explanation" : "incorrect-explanation"
        }`;

        // Auto-expand correct answer, keep others collapsed
        if (isCorrect) {
          explanationContainer.classList.add("expanded");
          explanationContainer.style.display = "block";
        } else {
          explanationContainer.style.display = "none";
          // Make header clickable to expand
          choiceHeader.style.cursor = "pointer";
          choiceHeader.addEventListener("click", () => {
            const isExpanded = explanationContainer.style.display === "block";
            explanationContainer.style.display = isExpanded ? "none" : "block";
            explanationContainer.classList.toggle("expanded");
          });
        }

        explanationContainer.innerHTML = `
          <div class="ai-explanation-header">${getIconString(
            "book",
            20,
          )} Dorothy's Analysis:</div>
          <div class="ai-explanation-text">${explanation}</div>
        `;

        li.appendChild(explanationContainer);
      }

      choicesList.appendChild(li);
    });

    questionBlock.appendChild(choicesList);

    // Add subtopic and gold passage after choices
    if (aiData && aiData.subtopic) {
      const subtopicElement = document.createElement("div");
      subtopicElement.className = "subtopic-badge";
      subtopicElement.innerHTML = `<span class="subtopic-label">Subtopic:</span> <span class="subtopic-name">${aiData.subtopic}</span>`;
      questionBlock.appendChild(subtopicElement);
    }

    // Add gold passage explanation
    if (q.gold_passage && q.gold_passage.trim()) {
      const explanationTitle = document.createElement("h4");
      explanationTitle.textContent = "Rule of Law:";
      explanationTitle.className = "explanation-title";

      const explanationBox = document.createElement("div");
      explanationBox.className = "gold-explanation";
      explanationBox.innerHTML = q.gold_passage;

      questionBlock.appendChild(explanationTitle);
      questionBlock.appendChild(explanationBox);
    }

    // Show loading indicator if explanations are still loading
    if (state.loadingExplanations) {
      const loadingEl = document.createElement("div");
      loadingEl.className = "ai-loading";
      loadingEl.textContent = "Loading AI explanations...";
      questionBlock.appendChild(loadingEl);
    }

    questionContainer.appendChild(questionBlock);
  }

  // Render first question
  renderQuestion();

  return container;
}

/**
 * createReview dispatcher: static or API-based review screen
 * @param {...*} args - arguments for static (questions, answers, tracker) or API (questions, answers, meta)
 */
export function createReview(...args) {
  const third = args[2];
  if (third && typeof third.getTopicStats === "function") {
    return createStaticReview(...args);
  }
  return createApiReview(...args);
}
