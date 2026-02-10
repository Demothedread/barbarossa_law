/**
 * Offline Storage Composable
 *
 * Provides IndexedDB-based caching for questions and quiz data
 * to enable offline study capabilities.
 */

import { computed, ref } from "vue";

const DB_NAME = "monobloc-offline";
const DB_VERSION = 1;

interface CachedQuestion {
  id: string;
  question: string;
  subject: string;
  subtopic?: string;
  choices: string[];
  answer: string;
  cachedAt: number;
}

interface CachedQuiz {
  id: string;
  subject: string;
  questions: CachedQuestion[];
  cachedAt: number;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Questions store
      if (!db.objectStoreNames.contains("questions")) {
        const questionStore = db.createObjectStore("questions", {
          keyPath: "id",
        });
        questionStore.createIndex("subject", "subject", { unique: false });
        questionStore.createIndex("cachedAt", "cachedAt", { unique: false });
      }

      // Quiz cache store
      if (!db.objectStoreNames.contains("quizzes")) {
        const quizStore = db.createObjectStore("quizzes", { keyPath: "id" });
        quizStore.createIndex("subject", "subject", { unique: false });
        quizStore.createIndex("cachedAt", "cachedAt", { unique: false });
      }

      // Pending sync store (for offline quiz results)
      if (!db.objectStoreNames.contains("pendingSync")) {
        db.createObjectStore("pendingSync", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
  });
}

/**
 * Use offline storage for questions and quizzes
 */
export function useOfflineStorage() {
  const isOnline = ref(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const cacheSize = ref(0);
  const lastSyncTime = ref<Date | null>(null);

  // Listen for online/offline events
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      isOnline.value = true;
      syncPendingData();
    });
    window.addEventListener("offline", () => {
      isOnline.value = false;
    });
  }

  /**
   * Cache questions for offline use
   */
  async function cacheQuestions(questions: CachedQuestion[]): Promise<void> {
    const db = await openDB();
    const tx = db.transaction("questions", "readwrite");
    const store = tx.objectStore("questions");

    const now = Date.now();
    for (const question of questions) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put({ ...question, cachedAt: now });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    await updateCacheStats();
  }

  /**
   * Get cached questions by subject
   */
  async function getCachedQuestions(
    subject?: string,
    limit = 50,
  ): Promise<CachedQuestion[]> {
    const db = await openDB();
    const tx = db.transaction("questions", "readonly");
    const store = tx.objectStore("questions");

    return new Promise((resolve, reject) => {
      let request: IDBRequest;

      if (subject) {
        const index = store.index("subject");
        request = index.getAll(subject, limit);
      } else {
        request = store.getAll(undefined, limit);
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache a quiz for offline replay
   */
  async function cacheQuiz(quiz: CachedQuiz): Promise<void> {
    const db = await openDB();
    const tx = db.transaction("quizzes", "readwrite");
    const store = tx.objectStore("quizzes");

    await new Promise<void>((resolve, reject) => {
      const request = store.put({ ...quiz, cachedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached quizzes
   */
  async function getCachedQuizzes(subject?: string): Promise<CachedQuiz[]> {
    const db = await openDB();
    const tx = db.transaction("quizzes", "readonly");
    const store = tx.objectStore("quizzes");

    return new Promise((resolve, reject) => {
      let request: IDBRequest;

      if (subject) {
        const index = store.index("subject");
        request = index.getAll(subject);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Queue data for sync when online
   */
  async function queueForSync(data: Record<string, unknown>): Promise<void> {
    const db = await openDB();
    const tx = db.transaction("pendingSync", "readwrite");
    const store = tx.objectStore("pendingSync");

    await new Promise<void>((resolve, reject) => {
      const request = store.add({
        data,
        timestamp: Date.now(),
        type: data.type || "unknown",
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sync pending data when online
   */
  async function syncPendingData(): Promise<void> {
    if (!isOnline.value) return;

    const db = await openDB();
    const tx = db.transaction("pendingSync", "readwrite");
    const store = tx.objectStore("pendingSync");

    const pending = await new Promise<
      Array<{ id: number; data: Record<string, unknown>; type: string }>
    >((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    for (const item of pending) {
      try {
        // Attempt to sync based on type
        if (item.type === "quiz_result") {
          // Would call API here to sync quiz results
          // await api.submitQuizResult(item.data);
        }

        // Remove from pending queue on success
        await new Promise<void>((resolve, reject) => {
          const deleteRequest = store.delete(item.id);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
      } catch {
        // Keep in queue if sync fails
      }
    }

    lastSyncTime.value = new Date();
  }

  /**
   * Clear old cached data
   */
  async function clearOldCache(
    maxAgeMs = 7 * 24 * 60 * 60 * 1000,
  ): Promise<void> {
    const db = await openDB();
    const cutoff = Date.now() - maxAgeMs;

    // Clear old questions
    const questionTx = db.transaction("questions", "readwrite");
    const questionStore = questionTx.objectStore("questions");
    const questionIndex = questionStore.index("cachedAt");

    await new Promise<void>((resolve, reject) => {
      const range = IDBKeyRange.upperBound(cutoff);
      const request = questionIndex.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });

    await updateCacheStats();
  }

  /**
   * Update cache statistics
   */
  async function updateCacheStats(): Promise<void> {
    try {
      const db = await openDB();
      const tx = db.transaction("questions", "readonly");
      const store = tx.objectStore("questions");

      const count = await new Promise<number>((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      cacheSize.value = count;
    } catch {
      cacheSize.value = 0;
    }
  }

  /**
   * Check if IndexedDB is available
   */
  const isSupported = computed(() => {
    return typeof indexedDB !== "undefined";
  });

  /**
   * Get storage estimate
   */
  async function getStorageEstimate(): Promise<{
    usage: number;
    quota: number;
  } | null> {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    } catch {
      return null;
    }
  }

  return {
    // State
    isOnline,
    isSupported,
    cacheSize,
    lastSyncTime,

    // Methods
    cacheQuestions,
    getCachedQuestions,
    cacheQuiz,
    getCachedQuizzes,
    queueForSync,
    syncPendingData,
    clearOldCache,
    getStorageEstimate,
  };
}
