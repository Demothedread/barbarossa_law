<template>
  <div class="about-view">
    <div class="panel-container">
      <div class="panel panel--wide">
        <div class="panel__header">
          <h2 class="panel__title">About This Site</h2>
        </div>
        <div class="panel__body about-content">
          <div class="about-hero">
            <h1>Deez' Eazy-Breezy Bar Review Bonanza</h1>
            <p class="tagline">
              The Adequate, Unaccredited, Probably Illegal, but Arguably Ethical
              Bar Review
            </p>
          </div>

          <div class="about-section">
            <h3>Why This Exists</h3>
            <p>
              Because the bar exam preparation industry is a racket. BARBRI
              charges $4,000+ to "empower your learning journey" while NCBE
              charges exorbitant licensing fees for questions they wrote decades
              ago. Meanwhile, the entire legal industry wrings its hands
              wondering why the profession lacks diversity.
            </p>
            <p>
              We built this because studying for the bar shouldn't cost more
              than a semester of law school. No "spiral instructional design."
              No "Pass Predictor&trade;." No coaches named Brad. Just questions
              and your crushing anxiety. It's no frills. It's generic. But it's
              the baseline of what you need. And it's free. At monobloc.com.
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
              Their copyright threats mean we can't show you real past questions
              without paying tribute. This is not how professional licensing
              should work in a democratic society. Or maybe this whole site is a
              surreal parody. Who knows! Let's spend weeks litigating that.
            </p>
          </div>

          <div class="about-section">
            <h3>What We Actually Do</h3>
            <p>
              We provide practice questions covering MBE subjects, track your
              progress, and offer AI-powered explanations. No gamification
              theater. No "you're doing great!" when you're not. Just honest
              feedback and the questions you need to practice. Also it's couched
              in fun little mini-games, for legal purposes, that probably won't
              succeed.
            </p>
          </div>

          <div class="about-footer">
            <p class="club-motto">
              "We're not great. We're not even good. But we're here, and we're
              free. monobloc.com"
            </p>
            <p class="established">
              Est. 2026 &bull; Not ABA Accredited &bull; Not NCBE Approved
              &bull; Probably Illegal &bull; Arguably Ethical
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
            <li>
              This course is adequate. We wouldn't recommend it, but here you
              are.
            </li>
            <li>
              NCBE is a nonprofit. They made $50M last year. Nonprofits are fun.
            </li>
            <li>
              65% is "passing" &mdash; the NCBE calls this "minimum competence."
              Inspiring.
            </li>
            <li>
              Your Pass Predictor&trade; is astrology for people with JDs.
            </li>
            <li>The bar exam tests test-taking, not lawyering.</li>
            <li>Most practicing attorneys couldn't pass the bar today.</li>
            <li>This site is free because why is this stuff so expensive.</li>
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
