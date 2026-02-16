import { z } from 'zod';

/**
 * User registration validation schema
 */
export const registerSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(50, 'Tên quá dài'),
  email: z.string().email('Email không hợp lệ'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Exam creation validation schema
 */
export const createExamSchema = z.object({
  title: z.string().min(5, 'Tiêu đề phải có ít nhất 5 ký tự').max(200),
  description: z.string().max(1000).optional(),
  subjectId: z.string().uuid('Chọn môn học hợp lệ'),
  duration: z.number().min(5, 'Thời gian tối thiểu 5 phút').max(180, 'Tối đa 3 giờ'),
  totalPoints: z.number().min(1).max(100),
  questions: z.array(z.object({
    questionId: z.string().uuid(),
    order: z.number().int().min(0),
    points: z.number().positive(),
  })).min(1, 'Cần ít nhất 1 câu hỏi'),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;

/**
 * Question creation validation schema
 */
export const createQuestionSchema = z.object({
  content: z.string().min(10, 'Nội dung câu hỏi quá ngắn'),
  explanation: z.string().optional(),
  typeId: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  subjectId: z.string().uuid(),
  options: z.array(z.object({
    content: z.string().min(1, 'Nội dung đáp án không được trống'),
    isCorrect: z.boolean(),
    order: z.number().int(),
  })).min(2, 'Cần ít nhất 2 đáp án'),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

/**
 * AI Tutor message validation
 */
export const aiMessageSchema = z.object({
  message: z.string().min(1, 'Vui lòng nhập tin nhắn').max(2000, 'Tin nhắn quá dài'),
  context: z.object({
    subjectId: z.string().optional(),
    topicId: z.string().optional(),
    currentQuestion: z.string().optional(),
  }).optional(),
});

export type AIMessageInput = z.infer<typeof aiMessageSchema>;
