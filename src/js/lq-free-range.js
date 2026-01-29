import { getIconString } from "./lunaire-icons.js";

export const FREE_RANGE_PREFILL_KEY = "lq_free_range_prefill";

/**
 * Free-range drill launcher for any topic and question count.
 * @param {Function} onGenerateQuestions - Callback to launch the generator page.
 * @returns {HTMLElement}
 */
export function createFreeRangeSection(onGenerateQuestions) {
  const section = document.createElement("section");
  section.className = "free-range-section module-frame-blue";
  section.id = "free-range";

  section.innerHTML = `
    <div class="free-range-header">
      <h2>${getIconString("compass", 28)} Free-Range Navigator</h2>
      <p>
        Choose any number of questions, any topic, and any set. We will hand the
        coordinates to the AI generator so you can drill exactly what you want.
      </p>
    </div>
    <form class="free-range-form">
      <label>
        ${getIconString("chart", 16)} Question Count
        <input type="number" name="count" min="1" max="50" value="12" />
      </label>
      <label>
        ${getIconString("telescope", 16)} Topic or Theme
        <input type="text" name="topic" placeholder="e.g., Contracts formation, evidence objections" />
      </label>
      <label>
        ${getIconString("document", 16)} Question Set
        <select name="set">
          <option value="mixed">Mixed MBE + Essays</option>
          <option value="mbe">MBE Only</option>
          <option value="essay">Essay Focus</option>
        </select>
      </label>
      <label>
        ${getIconString("pencil", 16)} Extra Mission Notes
        <input type="text" name="notes" placeholder="Optional custom instructions" />
      </label>
      <button type="submit" class="btn-primary">${getIconString(
        "play",
        20,
      )} Launch Free-Range Drill</button>
    </form>
  `;

  const form = section.querySelector(".free-range-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const rawCount = Number(form.elements.count.value || 12);
    const safeCount = Math.min(Math.max(rawCount, 1), 50);
    const payload = {
      count: safeCount,
      topic: form.elements.topic.value.trim(),
      questionSet: form.elements.set.value,
      notes: form.elements.notes.value.trim(),
    };

    localStorage.setItem(FREE_RANGE_PREFILL_KEY, JSON.stringify(payload));

    if (typeof onGenerateQuestions === "function") {
      onGenerateQuestions(payload);
    }
  });

  return section;
}
