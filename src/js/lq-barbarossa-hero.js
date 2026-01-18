/**
 * Barbarossa hero module.
 * Builds the atomic-age pirate hero section.
 */
export function createBarbarossaHero() {
  const section = document.createElement('section');
  section.className = 'barbarossa-hero module-frame';
  section.id = 'barbarossa-hero';

  section.innerHTML = `
    <div class="barbarossa-hero-content">
      <div class="barbarossa-hero-copy">
        <p class="hero-eyebrow">🚀 Retrofuturist Bar Exam Fleet</p>
        <h1 class="hero-title">Barbarossa: Red-Beard Space Pirate of the Atomic Age</h1>
        <p class="hero-subtitle">
          Barbarossa is our mascot — a red-bearded, muscle-queen corsair who captains a chrome
          rocket-skiff across the cosmic seas. He is drawn like the fearless lead of a 1950s
          Saturday morning cartoon, and he is here to keep your studies fierce and fearless.
        </p>
        <div class="hero-actions">
          <button class="btn-primary btn-start-quiz" data-mode="barbarossa-overtime">
            ⚔️ Start the Barbarossa Overtime Exam
          </button>
          <a class="btn-secondary hero-scroll-link" href="#exam-bank">Explore the Question Bank</a>
        </div>
      </div>
      <div class="barbarossa-mascot">
        <div class="mascot-portrait" role="img" aria-label="Illustration of Barbarossa, a red-bearded space pirate hero.">
          <div class="mascot-halo"></div>
          <div class="mascot-badge">B</div>
          <div class="mascot-details">
            <span>Atomic Beard</span>
            <span>Starboard Sabre</span>
            <span>Rocket-Skiff Pilot</span>
          </div>
        </div>
        <div class="mascot-caption">
          “Captain Barbarossa drives a flame-tailed rocket skiff through nebula storms —
          with a grin, a lesson plan, and a treasure map of bar exam topics.”
        </div>
      </div>
    </div>
  `;

  return section;
}
