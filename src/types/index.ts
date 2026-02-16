/**
 * Common type definitions for NEO
 * Replacing 'any' with proper types
 */

// Database model types
export interface Exam {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  subjectId: string;
  type: 'MIDTERM' | 'FINAL' | 'PRACTICE' | 'MOCK';
  duration: number;
  totalPoints: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  subject?: Subject;
  parts?: ExamPart[];
  attempts?: ExamAttempt[];
}

export interface ExamPart {
  id: string;
  examId: string;
  name: string;
  order: number;
  questions: ExamQuestion[];
}

export interface ExamQuestion {
  id: string;
  examId: string;
  questionId: string;
  order: number;
  points: number;
  question?: Question;
}

export interface Question {
  id: string;
  content: string;
  explanation?: string | null;
  typeId: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_BLANK';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  subjectId: string;
  createdAt: Date;
  updatedAt: Date;
  subject?: Subject;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  questionId: string;
  content: string;
  isCorrect: boolean;
  order: number;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  code?: string | null;
  description?: string | null;
  icon?: string | null;
  order: number;
  practiceMode: 'QUESTION_IDS' | 'TOPIC_BASED';
  schoolId?: string | null;
  chapters?: Chapter[];
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  slug: string;
  description?: string | null;
  order: number;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  chapterId: string;
  name: string;
  slug: string;
  content?: string | null;
  videoUrl?: string | null;
  duration?: number | null;
  order: number;
}

export interface ExamAttempt {
  id: string;
  userId: string;
  examId: string;
  startedAt: Date;
  submittedAt?: Date | null;
  score?: number | null;
  totalPoints: number;
  timeSpent?: number | null;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  answers?: Answer[];
  exam?: Exam;
}

export interface Answer {
  id: string;
  attemptId: string;
  questionId: string;
  optionId?: string | null;
  textAnswer?: string | null;
  isCorrect?: boolean | null;
  points?: number | null;
}

export interface UserProgress {
  id: string;
  userId: string;
  topicId?: string | null;
  completed: boolean;
  score?: number | null;
  timeSpent: number;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics types
export interface ExamAnalytics {
  totalAttempts: number;
  uniqueUsers: number;
  averageScore: number;
  passRate: number;
  averageTime: number;
  scoreDistribution: ScoreDistribution[];
  questionPerformance: QuestionPerformance[];
  timePerformance: TimePerformance[];
  commonMistakes: CommonMistake[];
  topicPerformance: TopicPerformance[];
  attemptProgress: AttemptProgress[];
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface QuestionPerformance {
  questionId: string;
  content: string;
  correctRate: number;
  avgTime: number;
  attemptCount: number;
}

export interface TimePerformance {
  examDuration: number;
  avgTimeSpent: number;
  timeEfficiency: number;
}

export interface CommonMistake {
  questionId: string;
  content: string;
  wrongAnswerRate: number;
  mostChosenWrong: string;
}

export interface TopicPerformance {
  topicId: string;
  name: string;
  avgScore: number;
  totalAttempts: number;
}

export interface AttemptProgress {
  date: string;
  attempts: number;
  avgScore: number;
}

export interface LearningAnalytics {
  studyTime: number;
  completedTopics: number;
  totalTopics: number;
  averageScore: number;
  streakDays: number;
  topicMastery: TopicMastery[];
  weaknesses: Weakness[];
  studyPatterns: StudyPattern[];
  progressTrends: ProgressTrend[];
  skillRadar: SkillRadarItem[];
  overallMastery: number;
  improvementRate: number;
}

export interface TopicMastery {
  topicId: string;
  name: string;
  mastery: number;
  totalAttempts: number;
}

export interface Weakness {
  topicId: string;
  name: string;
  weaknessScore: number;
  recommendedAction: string;
}

export interface StudyPattern {
  dayOfWeek: number;
  hourOfDay: number;
  activity: number;
}

export interface ProgressTrend {
  date: string;
  score: number;
  attempts: number;
}

export interface SkillRadarItem {
  skill: string;
  score: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
