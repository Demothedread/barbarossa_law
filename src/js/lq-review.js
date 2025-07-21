import { fetchAIExplanations, saveQuizHistory } from './lq-api.js';

/**
 * Create a review screen summarizing answers and stats.
 */
// Static review: questions from static questionData, use ProgressTracker for stats
function createStaticReview(questions, answers, tracker) {
  const container = document.createElement('div');
  container.className = 'review';
  questions.forEach((q, idx) => {
    const block = document.createElement('div');
    const text = document.createElement('p');
    text.textContent = q.text;
    block.appendChild(text);
    const list = document.createElement('ul');
    q.choices.forEach((c, i) => {
      const li = document.createElement('li');
      li.textContent = c;
      if (i === q.correct) li.classList.add('correct');
      if (i === answers[idx] && i !== q.correct) li.classList.add('incorrect');
      list.appendChild(li);
    });
    block.appendChild(list);
    const expl = document.createElement('p');
    expl.textContent = q.explanation;
    block.appendChild(expl);
    container.appendChild(block);
  });
  const stats = tracker.getTopicStats();
  const statsDiv = document.createElement('div');
  Object.entries(stats).forEach(([topic, info]) => {
    const p = document.createElement('p');
    p.textContent = `${topic}: ${info.correctPercent.toFixed(0)}% correct, ` +
      `${info.percentOfTotal.toFixed(0)}% of questions, ` +
      `Avg ${Math.round(info.avgTimeMs / 1000)}s each`;
    statsDiv.appendChild(p);
  });
  container.appendChild(statsDiv);
  return container;
}

// API-based review: questions from backend, use meta info for summary
function createApiReview(questions, answers, meta) {
  const container = document.createElement('div');
  container.className = 'review';
  
  // Create state for question-by-question navigation
  const state = {
    currentQuestion: 0,
    totalQuestions: questions.length,
    aiExplanations: meta.aiExplanations || null, // Use pre-fetched explanations if available
    loadingExplanations: false
  };
  
  // Create fixed summary header
  const summaryHeader = document.createElement('div');
  summaryHeader.className = 'review-header';
  
  const mins = Math.floor(meta.duration_s / 60);
  const secs = meta.duration_s % 60;
  
  // Get the current subject if available
  const subject = questions[0]?.subject || 'All Subjects';
  
  // Calculate subject-specific score if we can determine it
  let subjectScore = {
    correct: 0,
    total: 0
  };
  
  // Calculate subject-specific scores
  questions.forEach((q, idx) => {
    if (q.subject === subject) {
      subjectScore.total++;
      if (answers[idx] !== null && 'ABCD'[answers[idx]] === q.answer) {
        subjectScore.correct++;
      }
    }
  });
  
  const scoreHtml = `
    <div class="score-summary">
      <div class="total-score">
        <h3>Total Score: ${meta.correct}/${meta.total} (${((meta.correct/meta.total) * 100).toFixed(1)}%)</h3>
        <p>Time: ${mins}m ${secs}s</p>
      </div>
      <div class="subject-score">
        <h4>${subject} Score: ${subjectScore.correct}/${subjectScore.total} 
            (${subjectScore.total > 0 ? ((subjectScore.correct/subjectScore.total) * 100).toFixed(1) : 0}%)</h4>
      </div>
    </div>
  `;
  
  summaryHeader.innerHTML = scoreHtml;
  container.appendChild(summaryHeader);
  
  // Create question container that will be updated
  const questionContainer = document.createElement('div');
  questionContainer.className = 'question-review-container';
  container.appendChild(questionContainer);
  
  // Create navigation controls
  const navControls = document.createElement('div');
  navControls.className = 'review-navigation';
  
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '< Previous';
  prevBtn.onclick = () => {
    if (state.currentQuestion > 0) {
      state.currentQuestion--;
      renderQuestion();
    }
  };
  
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next >';
  nextBtn.onclick = () => {
    if (state.currentQuestion < state.totalQuestions - 1) {
      state.currentQuestion++;
      renderQuestion();
    }
  };
  
  const questionCounter = document.createElement('span');
  questionCounter.className = 'question-counter';
  
  navControls.appendChild(prevBtn);
  navControls.appendChild(questionCounter);
  navControls.appendChild(nextBtn);
  
  container.appendChild(navControls);
  
  // Fetch AI explanations as soon as review screen loads (if not already available)
  async function loadAIExplanations() {
    // If explanations are already available from background fetch, skip the API call
    if (state.aiExplanations !== null && Object.keys(state.aiExplanations).length > 0) {
      console.log('Using pre-fetched AI explanations from background fetch');
      // Still save quiz history
      try {
        const negativeTime = meta.duration_s > (questions.length * 60 * meta.timer || 0);
        await saveQuizHistory({
          user_id: localStorage.getItem('userId') || 'anonymous',
          subject: questions[0]?.subject || '',
          correct: meta.correct,
          total: meta.total,
          duration_seconds: meta.duration_s,
          questions: questions.map(q => q.idx),
          answers: answers,
          negative_time: negativeTime
        });
      } catch (error) {
        console.error('Failed to save quiz history:', error);
      }
      return;
    }
    
    if (state.loadingExplanations) return;
    
    state.loadingExplanations = true;
    
    // Create loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.className = 'ai-loading';
    loadingEl.textContent = 'Loading AI explanations...';
    container.appendChild(loadingEl);
    
    try {
      console.log('Fetching AI explanations (fallback)...');
      // Get question IDs
      const questionIds = questions.map(q => q.idx);
      state.aiExplanations = await fetchAIExplanations(questionIds);
      
      // Save quiz history with completion info
      const negativeTime = meta.duration_s > (questions.length * 60 * meta.timer || 0);
      await saveQuizHistory({
        user_id: localStorage.getItem('userId') || 'anonymous',
        subject: questions[0]?.subject || '',
        correct: meta.correct,
        total: meta.total,
        duration_seconds: meta.duration_s,
        questions: questions.map(q => q.idx),
        answers: answers,
        negative_time: negativeTime
      });
    } catch (error) {
      console.error('Failed to load AI explanations:', error);
      state.aiExplanations = {};
    } finally {
      state.loadingExplanations = false;
      if (container.contains(loadingEl)) {
        container.removeChild(loadingEl);
      }
      // Re-render current question with AI explanations
      renderQuestion();
    }
  }
  
  // Start loading AI explanations
  loadAIExplanations();
  
  // Function to render current question
  function renderQuestion() {
    const idx = state.currentQuestion;
    const q = questions[idx];
    const userAnswer = answers[idx];
    const correctIdx = ['A','B','C','D'].indexOf(q.answer);
    
    // Update question counter
    questionCounter.textContent = `Question ${idx + 1} of ${state.totalQuestions}`;
    
    // Update prev/next buttons
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === state.totalQuestions - 1;
    
    // Clear container
    questionContainer.innerHTML = '';
    
    // Create question block
    const questionBlock = document.createElement('div');
    questionBlock.className = 'question-review';
    
    // Add prompt if exists
    if (q.prompt && q.prompt.trim()) {
      const promptElement = document.createElement('div');
      promptElement.className = 'prompt-review';
      promptElement.textContent = q.prompt;
      questionBlock.appendChild(promptElement);
    }
    
    // Add question text
    const questionText = document.createElement('div');
    questionText.className = 'question-text-review';
    questionText.textContent = q.question;
    questionBlock.appendChild(questionText);
    
    // Add choices
    const choicesList = document.createElement('ul');
    choicesList.className = 'choices-review';
    
    const letters = ['A', 'B', 'C', 'D'];
    q.choices.forEach((choice, i) => {
      const li = document.createElement('li');
      
      // Apply appropriate styling based on correct answer and user's answer
      if (i === correctIdx) {
        li.className = 'correct-answer';
      }
      if (userAnswer === i && i !== correctIdx) {
        li.className = 'incorrect-answer';
      }
      if (userAnswer === i) {
        li.className += ' user-selected';
      }
      
      li.innerHTML = `<span class="choice-letter">${letters[i]}.</span> ${choice}`;
      choicesList.appendChild(li);
    });
    
    questionBlock.appendChild(choicesList);
    
    // Add gold passage explanation
    if (q.gold_passage && q.gold_passage.trim()) {
      const explanationTitle = document.createElement('h4');
      explanationTitle.textContent = 'Rule of Law:';
      explanationTitle.className = 'explanation-title';
      
      const explanationBox = document.createElement('div');
      explanationBox.className = 'gold-explanation';
      explanationBox.innerHTML = q.gold_passage;
      
      questionBlock.appendChild(explanationTitle);
      questionBlock.appendChild(explanationBox);
    }
    
    // Add AI explanations if available
    if (state.aiExplanations && state.aiExplanations[q.idx]) {
      const aiData = state.aiExplanations[q.idx];
      
      const aiTitle = document.createElement('h4');
      aiTitle.textContent = 'AI Analysis of Answer Choices:';
      aiTitle.className = 'explanation-title ai-title';
      questionBlock.appendChild(aiTitle);
      
      // Create container for AI explanations
      const aiContainer = document.createElement('div');
      aiContainer.className = 'ai-explanations';
      
      // Add explanation for each choice
      const letters = ['A', 'B', 'C', 'D'];
      letters.forEach((letter) => {
        if (!aiData.explanations || !aiData.explanations[letter]) return;
        
        const choiceExp = document.createElement('div');
        const isCorrect = letter === q.answer;
        
        choiceExp.className = isCorrect ? 
          'ai-explanation-choice correct' : 
          'ai-explanation-choice incorrect';
          
        // Create header with choice letter
        const choiceHeader = document.createElement('div');
        choiceHeader.className = 'ai-choice-header';
        choiceHeader.innerHTML = `<strong>Choice ${letter}:</strong>`;
        choiceExp.appendChild(choiceHeader);
        
        // Create explanation text
        const expText = document.createElement('p');
        expText.className = isCorrect ? 'correct-text' : 'incorrect-text';
        expText.innerHTML = aiData.explanations[letter];
        choiceExp.appendChild(expText);
        
        aiContainer.appendChild(choiceExp);
      });
      
      questionBlock.appendChild(aiContainer);
    } else if (state.loadingExplanations) {
      // Show loading indicator for AI explanations
      const loadingEl = document.createElement('div');
      loadingEl.className = 'ai-loading';
      loadingEl.textContent = 'Loading AI explanations...';
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
  if (third && typeof third.getTopicStats === 'function') {
    return createStaticReview(...args);
  }
  return createApiReview(...args);
}
