<template>
  <div class="about-view">
    <div class="panel-container">
      <div class="panel panel--wide">
        <div class="panel__header">
          <h2 class="panel__title">About This Site</h2>
        </div>
        <div class="panel__body about-content">
          <div class="about-hero">
            <h1>Barbarossa Bar Prep</h1>
            <p class="tagline">
              The Cheap Bar Review That Doesn't Pretend to Care
            </p>
          </div>

          <div class="about-section">
            <h3>Why We Exist</h3>
            <p>
              Because the bar exam preparation industry is a racket. BARBRI
              charges $4,000+ to "empower your learning journey" while NCBE
              charges exorbitant licensing fees for questions they wrote decades
              ago. Meanwhile, the entire legal industry wrings its hands
              wondering why the profession lacks diversity.
            </p>
            <p>
              We built this site because studying for the bar shouldn't cost
              more than a semester of law school. No "spiral instructional
              design." No "Pass Predictor™." No coaches named Brad. Just
              questions and your crushing anxiety.
            </p>
          </div>

          <div class="about-section">
            <h3>The NCBE Problem</h3>
            <p>
              The National Conference of Bar Examiners holds a monopoly on the
              MBE, charging jurisdictions enormous licensing fees that get
              passed on to you. They've made the bar exam a $5,000+ ordeal that
              disproportionately burdens first-generation lawyers and those
              without family wealth.
            </p>
            <p>
              Their copyright threats mean we can't even show you real past
              questions without paying their tribute. This is not how
              professional licensing should work in a democratic society.
            </p>
          </div>

          <div class="about-section">
            <h3>What We Actually Do</h3>
            <p>
              We provide practice questions covering MBE subjects, track your
              progress, and offer AI-powered explanations. No gamification
              theater. No "you're doing great!" when you're not. Just honest
              feedback and the questions you need to practice.
            </p>
          </div>

          <div class="about-footer">
            <p class="club-motto">
              "Unlike those $4,000 courses, we won't pretend you'll be
              'empowered.'"
            </p>
            <p class="established">
              Est. 2026 • The Void of Student Debt • Earth
            </p>
          </div>
        </div>
      </div>

      <div class="panel panel--narrow">
        <div class="panel__header">
          <h2 class="panel__title">The Truth</h2>
        </div>
        <div class="panel__body">
          <ol class="rules-list">
            <li>Bar prep courses are overpriced.</li>
            <li>NCBE is a monopoly.</li>
            <li>65% is "passing" - set your expectations accordingly.</li>
            <li>
              Your law school's pass rate is a better predictor than any "Pass
              Predictor™".
            </li>
            <li>The bar exam tests test-taking, not lawyering.</li>
            <li>Most practicing attorneys couldn't pass the bar today.</li>
            <li>
              The legal profession gatekeeps to protect incumbents, not the
              public.
            </li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-view {
  height: 100%;
}

.about-content {
  max-width: 700px;
}

.about-hero {
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid rgba(65, 90, 119, 0.3);
}

.about-hero h1 {
  font-family: "strenuous", var(--font-display);
  font-size: 2.2rem;
  font-weight: 200;
  color: var(--solar-gold);
  margin-bottom: 8px;
  letter-spacing: 0.1em;
}

.about-hero .tagline {
  font-family: "good-times", var(--font-display);
  font-size: 0.9rem;
  font-weight: 300;
  color: var(--star-silver);
  letter-spacing: 0.2em;
}

.about-section {
  margin-bottom: 32px;
}

.about-section h3 {
  font-family: "good-times", var(--font-display);
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--nebula-teal);
  margin-bottom: 12px;
  letter-spacing: 0.1em;
}

.about-section p {
  font-family: var(--font-legal);
  color: var(--lunar-white);
  line-height: 1.85;
  margin-bottom: 14px;
}

.about-footer {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid rgba(65, 90, 119, 0.3);
  text-align: center;
}

.club-motto {
  font-family: var(--font-legal);
  font-style: italic;
  color: var(--star-silver);
  font-size: 1.15rem;
  margin-bottom: 16px;
}

.established {
  font-family: "nelson-engraved", serif;
  font-size: 0.8rem;
  color: var(--nebula-blue);
  letter-spacing: 0.25em;
  text-transform: uppercase;
}

.rules-list {
  list-style: none;
  counter-reset: rules;
}

.rules-list li {
  counter-increment: rules;
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(65, 90, 119, 0.2);
  color: var(--lunar-white);
  line-height: 1.5;
}

.rules-list li::before {
  content: counter(rules);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--nebula-teal);
  background: rgba(0, 255, 200, 0.1);
  border-radius: 4px;
}

.rules-list li:last-child {
  border-bottom: none;
}
</style>
