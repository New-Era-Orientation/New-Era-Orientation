"use client";

/**
 * NEO-EDU API Client
 * Shared API layer cho cả Web và Mobile/Desktop apps
 * Features:
 * - Request deduplication (không gọi trùng)
 * - Caching với TTL
 * - Offline support
 * - Auto retry
 * - Request batching
 */

// ============================================
// TYPES
// ============================================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  cacheTTL: {
    subjects: number;      // Hiếm thay đổi
    user: number;          // Thay đổi trung bình
    stats: number;         // Thay đổi thường xuyên
    exams: number;         // Hiếm thay đổi
    activities: number;    // Thay đổi thường xuyên
  };
}

// ============================================
// CONFIG
// ============================================
const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: typeof window !== "undefined" 
    ? (process.env.NEXT_PUBLIC_API_URL || "") 
    : "",
  timeout: 10000,
  retries: 2,
  cacheTTL: {
    subjects: 30 * 60 * 1000,     // 30 phút - hiếm thay đổi
    user: 5 * 60 * 1000,          // 5 phút
    stats: 60 * 1000,             // 1 phút
    exams: 15 * 60 * 1000,        // 15 phút
    activities: 30 * 1000,        // 30 giây
  },
};

// ============================================
// CACHE & DEDUPLICATION
// ============================================
const cache = new Map<string, CacheEntry<unknown>>();
const pendingRequests = new Map<string, PendingRequest<unknown>>();

function getCacheKey(endpoint: string, params?: Record<string, unknown>): string {
  const paramStr = params ? JSON.stringify(params) : "";
  return `${endpoint}:${paramStr}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  
  const isExpired = Date.now() - entry.timestamp > entry.ttl;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

// ============================================
// CORE FETCH
// ============================================
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = DEFAULT_CONFIG.retries
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (retries > 0 && !(error instanceof DOMException && error.name === "AbortError")) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry<T>(url, options, retries - 1);
    }
    
    throw error;
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  ttl?: number
): Promise<T> {
  const cacheKey = getCacheKey(endpoint, options.body ? JSON.parse(options.body as string) : undefined);
  const isGet = !options.method || options.method === "GET";

  // Check cache for GET requests
  if (isGet && ttl) {
    const cached = getFromCache<T>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Deduplicate concurrent requests
  if (isGet) {
    const pending = pendingRequests.get(cacheKey) as PendingRequest<T> | undefined;
    if (pending && Date.now() - pending.timestamp < 5000) {
      return pending.promise;
    }
  }

  const url = `${DEFAULT_CONFIG.baseUrl}/api${endpoint}`;
  const promise = fetchWithRetry<T>(url, options);

  if (isGet) {
    pendingRequests.set(cacheKey, { promise, timestamp: Date.now() });
  }

  try {
    const data = await promise;
    
    if (isGet && ttl) {
      setCache(cacheKey, data, ttl);
    }
    
    return data;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

// ============================================
// API METHODS
// ============================================

// --- Subjects ---
export async function fetchSubjects() {
  return apiRequest<{ success: boolean; data: SubjectInfo[] }>(
    "/subjects",
    {},
    DEFAULT_CONFIG.cacheTTL.subjects
  );
}

export async function fetchSubjectBySlug(slug: string) {
  return apiRequest<{ success: boolean; data: SubjectInfo }>(
    `/subjects/${slug}`,
    {},
    DEFAULT_CONFIG.cacheTTL.subjects
  );
}

// --- User ---
export async function fetchUserStats() {
  return apiRequest<UserStats>(
    "/user/stats",
    {},
    DEFAULT_CONFIG.cacheTTL.stats
  );
}

export async function fetchUserActivities(limit = 10) {
  return apiRequest<UserActivity[]>(
    `/user/activities?limit=${limit}`,
    {},
    DEFAULT_CONFIG.cacheTTL.activities
  );
}

export async function fetchUserProgress() {
  return apiRequest<StudyProgress>(
    "/user/study-progress",
    {},
    DEFAULT_CONFIG.cacheTTL.stats
  );
}

// --- Combined User Data (giảm requests) ---
export async function fetchUserDashboardData() {
  // Sử dụng combined endpoint - 1 request thay vì 3
  return apiRequest<{
    success: boolean;
    data: {
      stats: UserStats;
      activities: UserActivity[];
      progress: StudyProgress;
    };
  }>(
    "/dashboard",
    {},
    DEFAULT_CONFIG.cacheTTL.stats
  ).then(res => res.data);
}

// --- Exams ---
export async function fetchExams(params?: { subjectId?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.subjectId) query.set("subjectId", params.subjectId);
  if (params?.limit) query.set("limit", params.limit.toString());
  
  return apiRequest<{ success: boolean; data: ExamInfo[] }>(
    `/exams?${query.toString()}`,
    {},
    DEFAULT_CONFIG.cacheTTL.exams
  );
}

export async function fetchExamBySlug(slug: string) {
  return apiRequest<{ success: boolean; data: ExamDetail }>(
    `/exams/${slug}`,
    {},
    DEFAULT_CONFIG.cacheTTL.exams
  );
}

export async function submitExam(slug: string, answers: Record<string, string>) {
  return apiRequest<ExamResult>(
    `/exams/${slug}/submit`,
    {
      method: "POST",
      body: JSON.stringify({ answers }),
    }
  );
}

// --- Practice ---
export async function fetchPracticeQuestions(params: {
  subjectId: string;
  chapterId?: string;
  topicId?: string;
  questionIds?: number[];
  limit?: number;
}) {
  return apiRequest<{ success: boolean; data: Question[] }>(
    "/practice",
    {
      method: "POST",
      body: JSON.stringify(params),
    }
  );
}

// --- Topics ---
export async function fetchTopic(slug: string) {
  return apiRequest<{ success: boolean; data: TopicDetail }>(
    `/topics/${slug}`,
    {},
    DEFAULT_CONFIG.cacheTTL.subjects
  );
}

export async function markTopicComplete(slug: string) {
  return apiRequest<{ success: boolean }>(
    `/topics/${slug}/complete`,
    { method: "POST" }
  );
}

// --- Stats (Public) ---
export async function fetchPublicStats() {
  return apiRequest<PublicStats>(
    "/stats",
    {},
    DEFAULT_CONFIG.cacheTTL.subjects
  );
}

// --- Settings ---
export async function fetchSettings() {
  return apiRequest<UserSettings>("/settings", {}, DEFAULT_CONFIG.cacheTTL.user);
}

export async function updateSettings(settings: Partial<UserSettings>) {
  invalidateCache("/settings");
  return apiRequest<{ success: boolean }>(
    "/settings",
    {
      method: "PUT",
      body: JSON.stringify(settings),
    }
  );
}

// ============================================
// CACHE MANAGEMENT
// ============================================
export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
}

export function invalidateUserCache(): void {
  invalidateCache("/user/");
  invalidateCache("/settings");
}

export function invalidateAllCache(): void {
  cache.clear();
  pendingRequests.clear();
}

// ============================================
// OFFLINE SUPPORT
// ============================================
const OFFLINE_STORAGE_KEY = "neo_offline_data";

export function saveForOffline<T>(key: string, data: T): void {
  try {
    const stored = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || "{}");
    stored[key] = { data, timestamp: Date.now() };
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    console.warn("Failed to save offline data:", e);
  }
}

export function getOfflineData<T>(key: string): T | null {
  try {
    const stored = JSON.parse(localStorage.getItem(OFFLINE_STORAGE_KEY) || "{}");
    return stored[key]?.data || null;
  } catch {
    return null;
  }
}

// ============================================
// TYPES (shared)
// ============================================
export interface SubjectInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  practiceMode: "CHAPTER" | "TOPIC" | "QUESTION_IDS";
  school: { id: string; name: string; code: string | null } | null;
  chapters: ChapterInfo[];
}

export interface ChapterInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  topicCount: number;
  questionCount?: number;
  topics: TopicInfo[];
}

export interface TopicInfo {
  id: string;
  name: string;
  slug: string;
  order: number;
  description?: string | null;
  questionCount?: number;
}

export interface TopicDetail extends TopicInfo {
  content: string;
  videoUrl?: string;
  duration?: number;
}

export interface UserStats {
  examsCompleted: number;
  averageScore: number;
  studyTime: number;
  progress: number;
  streak: number;
}

export interface UserActivity {
  id: string;
  title: string;
  type: "exam" | "study" | "practice";
  score?: number;
  createdAt: string;
}

export interface StudyProgress {
  totalTopics: number;
  completedTopics: number;
  percentage: number;
}

export interface ExamInfo {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration: number;
  questionCount: number;
}

export interface ExamDetail extends ExamInfo {
  questions: Question[];
}

export interface Question {
  id: string;
  content: string;
  options: QuestionOption[];
  images?: string[];
}

export interface QuestionOption {
  id: string;
  content: string;
  isCorrect?: boolean;
}

export interface ExamResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  details: {
    questionId: string;
    correct: boolean;
    userAnswer: string;
    correctAnswer: string;
  }[];
}

export interface PublicStats {
  totalUsers: number;
  totalExams: number;
  totalQuestions: number;
}

export interface UserSettings {
  theme: "light" | "dark" | "system";
  notifications: boolean;
  emailNotifications: boolean;
  selectedSubjectId?: string;
}
