import { fetchQuestionsByType } from './lq-api.js';
import { createQuiz } from './lq-quiz.js';
import { createReview } from './lq-review.js';
import { createSubtopicSelector } from './lq-subtopic-selector.js';

// Add subtopic selector to the quiz setup form

// Update the quiz setup to include subtopic in the form submission
export function setupQuizWithSubtopics(container) {
  const quizSetup = createQuizSetup({
    onStart: async (options) => {
      try {
        // Show loading indicator
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) loadingDiv.style.display = 'block';
        
        // Fetch questions with subtopic filter if specified
        const result = await fetchQuestionsByType(
          options.n,
          options.subject,
          options.questionType,
          options.subtopic // Include subtopic in API call
        );
        
        // Hide loading
        if (loadingDiv) loadingDiv.style.display = 'none';
        
        if (result && result.questions && result.questions.length > 0) {
          // Create quiz component with the questions
          const quizElement = createApiQuiz(
            result.questions,
            {
              timer: options.timer,
              highlightEnabled: true
            },
            (quizResults) => {
              // When quiz is complete, show the review screen
              const reviewElement = createReview(
                result.questions,
                quizResults.answers,
                {
                  duration_s: quizResults.duration_s,
                  aiExplanations: quizResults.aiExplanations
                }
              );
              container.innerHTML = '';
              container.appendChild(reviewElement);
            }
          );
          
          // Replace content with quiz
          container.innerHTML = '';
          container.appendChild(quizElement);
          
        } else {
          // Show error if no questions found
          const errorDiv = document.createElement('div');
          errorDiv.className = 'error-message';
          errorDiv.textContent = 'No questions available with the selected criteria. Please try different options.';
          container.innerHTML = '';
          container.appendChild(errorDiv);
        }
      } catch (error) {
        // Handle error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = `Error: ${error.message}`;
        container.innerHTML = '';
        container.appendChild(errorDiv);
        
        // Hide loading
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) loadingDiv.style.display = 'none';
      }
    }
  });
  
  // Add it to the container
  container.innerHTML = '';
  container.appendChild(quizSetup);
  
  // Return the setup component for additional manipulation
  return quizSetup;
}