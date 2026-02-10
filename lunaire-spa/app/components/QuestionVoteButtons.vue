<template>
  <div v-if="isGenerated" class="vote-buttons">
    <button
      class="vote-btn vote-up"
      :class="{ active: userVote === 'up' }"
      :disabled="isVoting"
      @click="vote('up')"
      title="Approve as model question"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="vote-icon"
      >
        <path
          d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"
          transform="rotate(-90 12 12)"
        />
      </svg>
      <span v-if="voteCounts.up > 0" class="vote-count">{{
        voteCounts.up
      }}</span>
    </button>

    <button
      class="vote-btn vote-down"
      :class="{ active: userVote === 'down' }"
      :disabled="isVoting"
      @click="vote('down')"
      title="Reject question"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="vote-icon"
      >
        <path
          d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"
          transform="rotate(90 12 12)"
        />
      </svg>
      <span v-if="voteCounts.down > 0" class="vote-count">{{
        voteCounts.down
      }}</span>
    </button>

    <span
      v-if="isModelQuestion"
      class="model-badge"
      title="Approved model question"
    >
      ⭐ Model
    </span>
    <span v-else-if="approvalStatus === 'rejected'" class="rejected-badge">
      ❌ Rejected
    </span>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

const props = defineProps<{
  questionId: string;
  isGenerated: boolean;
  userId?: string;
  anonymousId?: string;
}>();

const emit = defineEmits<{
  (e: "voted", vote: "up" | "down"): void;
  (
    e: "statusChanged",
    status: { isModel: boolean; approval: string | null },
  ): void;
}>();

const api = useApi();

const isVoting = ref(false);
const userVote = ref<"up" | "down" | null>(null);
const voteCounts = ref({ up: 0, down: 0 });
const isModelQuestion = ref(false);
const approvalStatus = ref<string | null>(null);

// Load initial vote status
onMounted(async () => {
  if (props.isGenerated) {
    await loadVoteStatus();
  }
});

// Reload when question changes
watch(
  () => props.questionId,
  async () => {
    if (props.isGenerated) {
      await loadVoteStatus();
    }
  },
);

async function loadVoteStatus() {
  try {
    const status = await api.getQuestionVoteStatus(
      props.questionId,
      props.userId,
      props.anonymousId,
    );

    userVote.value = status.user_vote;
    voteCounts.value = status.vote_counts;
    isModelQuestion.value = status.is_model_question;
    approvalStatus.value = status.approval_status;
  } catch {
    // Failed to load vote status - will use default state
  }
}

async function vote(voteType: "up" | "down") {
  if (isVoting.value) return;

  isVoting.value = true;

  try {
    const result = await api.voteOnQuestion(
      props.questionId,
      voteType,
      props.userId,
      props.anonymousId,
    );

    userVote.value = voteType;
    voteCounts.value = result.counts;

    // Update model status based on vote
    if (voteType === "up") {
      isModelQuestion.value = true;
      approvalStatus.value = "approved";
    } else {
      approvalStatus.value = "rejected";
    }

    emit("voted", voteType);
    emit("statusChanged", {
      isModel: isModelQuestion.value,
      approval: approvalStatus.value,
    });
  } catch {
    // Failed to vote - will allow retry
  } finally {
    isVoting.value = false;
  }
}
</script>

<style scoped>
.vote-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.vote-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 0.875rem;
}

.vote-btn:hover:not(:disabled) {
  border-color: #d1d5db;
}

.vote-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.vote-icon {
  width: 1rem;
  height: 1rem;
}

.vote-count {
  font-weight: 600;
  font-size: 0.75rem;
}

/* Up vote */
.vote-up {
  color: #059669;
}

.vote-up:hover:not(:disabled) {
  background: #ecfdf5;
  border-color: #34d399;
}

.vote-up.active {
  background: #059669;
  color: #fff;
  border-color: #059669;
}

/* Down vote */
.vote-down {
  color: #dc2626;
}

.vote-down:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #f87171;
}

.vote-down.active {
  background: #dc2626;
  color: #fff;
  border-color: #dc2626;
}

/* Badges */
.model-badge {
  padding: 0.25rem 0.5rem;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #fff;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.rejected-badge {
  padding: 0.25rem 0.5rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
}
</style>
