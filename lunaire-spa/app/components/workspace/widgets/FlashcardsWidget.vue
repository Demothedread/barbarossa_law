<template>
  <div class="flashcards-widget">
    <div class="flashcard-container">
      <div class="flashcard" :class="{ flipped: isFlipped }" @click="flipCard">
        <div class="flashcard-inner">
          <div class="flashcard-front">
            <div class="card-label">Question</div>
            <div class="card-content">{{ currentCard?.front }}</div>
          </div>
          <div class="flashcard-back">
            <div class="card-label">Answer</div>
            <div class="card-content">{{ currentCard?.back }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="flashcard-controls">
      <button
        class="control-btn control-btn--wrong"
        @click="markCard(false)"
        title="Needs Review"
      >
        ❌
      </button>
      <div class="card-counter">
        {{ currentIndex + 1 }} / {{ cards.length }}
      </div>
      <button
        class="control-btn control-btn--correct"
        @click="markCard(true)"
        title="Got It!"
      >
        ✅
      </button>
    </div>

    <div class="flashcard-progress">
      <div class="progress-stats">
        <span class="stat correct">✅ {{ correctCount }}</span>
        <span class="stat wrong">❌ {{ wrongCount }}</span>
      </div>
      <button class="shuffle-btn" @click="shuffleCards">🔀 Shuffle</button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Flashcard {
  id: string;
  front: string;
  back: string;
}

// Sample flashcards (would come from API in production)
const cards = ref<Flashcard[]>([
  {
    id: "1",
    front: "What are the elements of a valid contract?",
    back: "Offer, Acceptance, Consideration, Capacity, Legality",
  },
  {
    id: "2",
    front: "What is the Rule Against Perpetuities?",
    back: "No interest is good unless it must vest, if at all, not later than 21 years after some life in being at the creation of the interest.",
  },
  {
    id: "3",
    front: "What are the elements of negligence?",
    back: "Duty, Breach, Causation (actual & proximate), Damages",
  },
  {
    id: "4",
    front: "What is promissory estoppel?",
    back: "A promise which the promisor should reasonably expect to induce action or forbearance, and which does induce such action, is binding if injustice can only be avoided by enforcement.",
  },
  {
    id: "5",
    front: "What is the difference between assault and battery?",
    back: "Battery: intentional harmful/offensive contact. Assault: intentional act causing apprehension of imminent harmful/offensive contact.",
  },
]);

const currentIndex = ref(0);
const isFlipped = ref(false);
const correctCount = ref(0);
const wrongCount = ref(0);

const currentCard = computed(() => cards.value[currentIndex.value]);

const flipCard = () => {
  isFlipped.value = !isFlipped.value;
};

const markCard = (correct: boolean) => {
  if (correct) {
    correctCount.value++;
  } else {
    wrongCount.value++;
  }

  // Move to next card
  isFlipped.value = false;
  setTimeout(() => {
    currentIndex.value = (currentIndex.value + 1) % cards.value.length;
  }, 200);
};

const shuffleCards = () => {
  cards.value = [...cards.value].sort(() => Math.random() - 0.5);
  currentIndex.value = 0;
  isFlipped.value = false;
  correctCount.value = 0;
  wrongCount.value = 0;
};
</script>

<style scoped>
.flashcards-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
}

.flashcard-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
}

.flashcard {
  width: 100%;
  max-width: 400px;
  height: 200px;
  cursor: pointer;
}

.flashcard-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flashcard.flipped .flashcard-inner {
  transform: rotateY(180deg);
}

.flashcard-front,
.flashcard-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(100, 116, 139, 0.3);
}

.flashcard-front {
  background: linear-gradient(
    135deg,
    rgba(56, 189, 248, 0.1),
    rgba(59, 130, 246, 0.1)
  );
}

.flashcard-back {
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.1),
    rgba(16, 185, 129, 0.1)
  );
  transform: rotateY(180deg);
}

.card-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.card-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 1rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
}

.flashcard-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px 0;
}

.control-btn {
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn--wrong {
  background: rgba(239, 68, 68, 0.2);
}

.control-btn--wrong:hover {
  background: rgba(239, 68, 68, 0.3);
  transform: scale(1.1);
}

.control-btn--correct {
  background: rgba(34, 197, 94, 0.2);
}

.control-btn--correct:hover {
  background: rgba(34, 197, 94, 0.3);
  transform: scale(1.1);
}

.card-counter {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  min-width: 60px;
  text-align: center;
}

.flashcard-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
}

.progress-stats {
  display: flex;
  gap: 16px;
}

.stat {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.shuffle-btn {
  padding: 8px 16px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.shuffle-btn:hover {
  background: rgba(100, 116, 139, 0.2);
  color: #fff;
}
</style>
