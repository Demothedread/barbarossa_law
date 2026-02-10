<template>
  <div class="ai-chat-widget">
    <!-- Chat messages -->
    <div class="chat-messages" ref="messagesRef">
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message"
        :class="`message--${message.role}`"
      >
        <div class="message-avatar">
          {{ message.role === "user" ? "👤" : "🤖" }}
        </div>
        <div class="message-content">
          <div class="message-text" v-html="formatMessage(message.content)" />
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>

      <!-- Typing indicator -->
      <div v-if="isLoading" class="message message--assistant">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <!-- Welcome message -->
      <div v-if="messages.length === 0 && !isLoading" class="welcome-message">
        <div class="welcome-icon">🤖</div>
        <h3>AI Study Assistant</h3>
        <p>Ask me anything about bar exam topics!</p>
        <div class="suggested-questions">
          <button
            v-for="q in suggestedQuestions"
            :key="q"
            class="suggested-btn"
            @click="sendMessage(q)"
          >
            {{ q }}
          </button>
        </div>
      </div>
    </div>

    <!-- Input area -->
    <div class="chat-input-area">
      <div class="input-wrapper">
        <textarea
          v-model="inputMessage"
          class="chat-input"
          placeholder="Ask a question about law..."
          @keydown.enter.exact.prevent="handleSend"
          :disabled="isLoading"
          rows="1"
        />
        <button
          class="send-btn"
          @click="handleSend"
          :disabled="!inputMessage.trim() || isLoading"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <div class="input-hint">Press Enter to send • Powered by OpenAI</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const config = useRuntimeConfig();

const messages = ref<ChatMessage[]>([]);
const inputMessage = ref("");
const isLoading = ref(false);
const messagesRef = ref<HTMLElement | null>(null);

const suggestedQuestions = [
  "Explain the Rule Against Perpetuities",
  "What are the elements of negligence?",
  "Difference between assault and battery",
  "What is promissory estoppel?",
];

// Format message with markdown-like syntax
const formatMessage = (content: string): string => {
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
};

// Format timestamp
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Scroll to bottom
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
};

// Send message
const sendMessage = async (content: string) => {
  if (!content.trim()) return;

  // Add user message
  messages.value.push({
    role: "user",
    content: content.trim(),
    timestamp: new Date(),
  });

  inputMessage.value = "";
  isLoading.value = true;
  scrollToBottom();

  try {
    // Call AI API (using vector store for context)
    const response = await $fetch<{ response: string }>("/api/ai/chat", {
      method: "POST",
      body: {
        message: content,
        context: "bar_exam_study",
        history: messages.value.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      },
    });

    messages.value.push({
      role: "assistant",
      content: response.response,
      timestamp: new Date(),
    });
  } catch {
    messages.value.push({
      role: "assistant",
      content:
        "I apologize, but I'm having trouble connecting right now. Please try again later or check your connection.",
      timestamp: new Date(),
    });
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};

// Handle send button/enter
const handleSend = () => {
  sendMessage(inputMessage.value);
};

// Save chat history
watch(
  messages,
  (newMessages) => {
    try {
      localStorage.setItem(
        "monobloc-ai-chat",
        JSON.stringify(newMessages.slice(-50)),
      );
    } catch (e) {
      // Ignore storage errors
    }
  },
  { deep: true },
);

// Load chat history
onMounted(() => {
  try {
    const saved = localStorage.getItem("monobloc-ai-chat");
    if (saved) {
      const parsed = JSON.parse(saved);
      messages.value = parsed.map((m: ChatMessage) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
      scrollToBottom();
    }
  } catch (e) {
    // Ignore parse errors
  }
});
</script>

<style scoped>
.ai-chat-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0f172a;
}

/* Messages area */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;
  max-width: 90%;
}

.message--user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(100, 116, 139, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.message--user .message-avatar {
  background: rgba(56, 189, 248, 0.2);
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-text {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.message--user .message-text {
  background: rgba(56, 189, 248, 0.2);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message--assistant .message-text {
  background: rgba(100, 116, 139, 0.2);
  color: rgba(255, 255, 255, 0.9);
  border-bottom-left-radius: 4px;
}

.message-text :deep(code) {
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85em;
}

.message-time {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  padding: 0 8px;
}

.message--user .message-time {
  text-align: right;
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: rgba(100, 116, 139, 0.2);
  border-radius: 16px;
  border-bottom-left-radius: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

/* Welcome message */
.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 20px;
}

.welcome-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.welcome-message h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.welcome-message p {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 24px;
}

.suggested-questions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.suggested-btn {
  padding: 10px 16px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.suggested-btn:hover {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

/* Input area */
.chat-input-area {
  padding: 12px;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.5);
  color: #fff;
  font-size: 0.9rem;
  resize: none;
  max-height: 120px;
}

.chat-input:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.5);
}

.chat-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.send-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: #38bdf8;
  color: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn svg {
  width: 20px;
  height: 20px;
}

.send-btn:hover:not(:disabled) {
  background: #0ea5e9;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-hint {
  margin-top: 8px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
}

/* Scrollbar */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
}
</style>
