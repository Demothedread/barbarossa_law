/**
 * Subtopic selector component
 * This creates a dropdown selector for subtopics based on the selected subject
 */
import { fetchSubtopics } from './lq-api.js';

/**
 * Create a subtopic selector that updates based on selected subject
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.subjectSelector - The subject selector element
 * @param {function} options.onChange - Callback when subtopic is changed
 * @returns {HTMLElement} - The subtopic selector container
 */
export function createSubtopicSelector({ subjectSelector, onChange } = {}) {
  const container = document.createElement('div');
  container.className = 'subtopic-selector-container';
  
  const label = document.createElement('label');
  label.textContent = 'Subtopic:';
  label.className = 'subtopic-label';
  
  const selectContainer = document.createElement('div');
  selectContainer.className = 'select-wrapper';
  
  const select = document.createElement('select');
  select.id = 'subtopic-select';
  select.className = 'subtopic-select';
  
  // Add "All Subtopics" option
  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'All Subtopics';
  select.appendChild(allOption);
  
  selectContainer.appendChild(select);
  container.appendChild(label);
  container.appendChild(selectContainer);
  
  // Function to update subtopics based on selected subject
  const updateSubtopics = async (subject) => {
    try {
      // Show loading state
      select.disabled = true;
      allOption.textContent = 'Loading subtopics...';
      
      // Clear existing options except the first one
      while (select.options.length > 1) {
        select.remove(1);
      }
      
      // Fetch subtopics for the selected subject
      const subtopics = await fetchSubtopics(subject);
      
      // Reset "All" option text
      allOption.textContent = 'All Subtopics';
      
      // Add subtopic options
      subtopics.forEach(subtopic => {
        if (subtopic) { // Only add non-empty subtopics
          const option = document.createElement('option');
          option.value = subtopic;
          option.textContent = subtopic;
          select.appendChild(option);
        }
      });
      
      // Enable select
      select.disabled = false;
      
      // If no subtopics, show a message
      if (subtopics.length === 0) {
        const noSubtopicsOption = document.createElement('option');
        noSubtopicsOption.disabled = true;
        noSubtopicsOption.textContent = 'No subtopics available';
        select.appendChild(noSubtopicsOption);
      }
    } catch (error) {
      console.error('Error updating subtopics:', error);
      allOption.textContent = 'Error loading subtopics';
    }
  };
  
  // Initialize subtopics if subject selector is provided
  if (subjectSelector) {
    const initialSubject = subjectSelector.value;
    if (initialSubject) {
      updateSubtopics(initialSubject);
    }
    
    // Listen for changes to the subject
    subjectSelector.addEventListener('change', (event) => {
      updateSubtopics(event.target.value);
      // Reset subtopic selection when subject changes
      select.value = '';
    });
  }
  
  // Add change event listener
  if (onChange) {
    select.addEventListener('change', (event) => {
      onChange(event.target.value);
    });
  }
  
  return container;
}