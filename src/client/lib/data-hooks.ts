"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "./api-client";

/**
 * NEO-EDU Data Hooks
 * React hooks tối ưu cho việc fetch data
 * - Auto-refresh khi cần
 * - Offline fallback
 * - Loading/error states
 * - Deduplication built-in từ api-client
 */

// ============================================
// GENERIC HOOK
// ============================================
interface UseDataResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

function useData<T>(
  fetchFn: () => Promise<T>,
  offlineKey?: string,
  deps: unknown[] = []
): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      if (mountedRef.current) {
        setData(result);
        // Save for offline
        if (offlineKey) {
          api.saveForOffline(offlineKey, result);
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
        // Try offline fallback
        if (offlineKey) {
          const offline = api.getOfflineData<T>(offlineKey);
          if (offline) setData(offline);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return { data, isLoading, error, refresh: fetchData };
}

// ============================================
// SUBJECTS HOOK
// ============================================
export function useSubjects() {
  return useData(
    async () => {
      const res = await api.fetchSubjects();
      return res.data;
    },
    "subjects"
  );
}

export function useSubject(slug: string) {
  return useData(
    async () => {
      const res = await api.fetchSubjectBySlug(slug);
      return res.data;
    },
    `subject_${slug}`,
    [slug]
  );
}

// ============================================
// USER HOOKS
// ============================================
export function useUserStats() {
  return useData(
    () => api.fetchUserStats(),
    "user_stats"
  );
}

export function useUserActivities(limit = 10) {
  return useData(
    () => api.fetchUserActivities(limit),
    "user_activities",
    [limit]
  );
}

export function useUserProgress() {
  return useData(
    () => api.fetchUserProgress(),
    "user_progress"
  );
}

/**
 * Combined dashboard data - 1 hook thay vì 3 hooks riêng
 * Tối ưu: chỉ 1 lần re-render thay vì 3 lần
 */
export function useDashboardData() {
  return useData(
    () => api.fetchUserDashboardData(),
    "dashboard_data"
  );
}

// ============================================
// EXAMS HOOKS
// ============================================
export function useExams(subjectId?: string, limit?: number) {
  return useData(
    async () => {
      const res = await api.fetchExams({ subjectId, limit });
      return res.data;
    },
    `exams_${subjectId || "all"}`,
    [subjectId, limit]
  );
}

export function useExam(slug: string) {
  return useData(
    async () => {
      const res = await api.fetchExamBySlug(slug);
      return res.data;
    },
    `exam_${slug}`,
    [slug]
  );
}

// ============================================
// PRACTICE HOOK
// ============================================
interface PracticeParams {
  subjectId: string;
  chapterId?: string;
  topicId?: string;
  questionIds?: number[];
  limit?: number;
}

export function usePracticeQuestions(params: PracticeParams) {
  return useData(
    async () => {
      const res = await api.fetchPracticeQuestions(params);
      return res.data;
    },
    undefined, // Don't cache practice - always fresh
    [params.subjectId, params.chapterId, params.topicId, params.limit]
  );
}

// ============================================
// TOPIC HOOKS
// ============================================
export function useTopic(slug: string) {
  return useData(
    async () => {
      const res = await api.fetchTopic(slug);
      return res.data;
    },
    `topic_${slug}`,
    [slug]
  );
}

// ============================================
// SETTINGS HOOKS
// ============================================
export function useSettings() {
  const result = useData(
    () => api.fetchSettings(),
    "settings"
  );

  const updateSettings = useCallback(async (settings: Partial<api.UserSettings>) => {
    await api.updateSettings(settings);
    result.refresh();
  }, [result]);

  return { ...result, updateSettings };
}

// ============================================
// PUBLIC STATS HOOK
// ============================================
export function usePublicStats() {
  return useData(
    () => api.fetchPublicStats(),
    "public_stats"
  );
}

// ============================================
// AUTO-REFRESH HOOK
// ============================================
export function useAutoRefresh<T>(
  hook: () => UseDataResult<T>,
  intervalMs: number
): UseDataResult<T> {
  const result = hook();

  useEffect(() => {
    const interval = setInterval(() => {
      result.refresh();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [result, intervalMs]);

  return result;
}

// ============================================
// ONLINE STATUS HOOK
// ============================================
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

// ============================================
// SYNC HOOK - Đồng bộ data khi online lại
// ============================================
export function useSyncOnReconnect(refreshFunctions: (() => Promise<void>)[]) {
  const isOnline = useOnlineStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      // Back online - refresh all data
      wasOffline.current = false;
      Promise.all(refreshFunctions.map(fn => fn()));
    }
  }, [isOnline, refreshFunctions]);
}
