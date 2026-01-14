import React from 'react';
import { Resend } from 'resend';
import { VerificationEmail } from './templates/VerificationEmail';
import { PasswordResetEmail } from './templates/PasswordResetEmail';
import { WelcomeEmail } from './templates/WelcomeEmail';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'NEO Education <noreply@neo-edu.vn>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface EmailResult {
  success: boolean;
  error?: string;
}

/**
 * Check if email service is configured
 */
function isEmailConfigured(): boolean {
  return resend !== null;
}

/**
 * Send verification email to new user
 */
export async function sendVerificationEmail(
  email: string,
  userName: string,
  token: string
): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.warn('Email service not configured. Skipping verification email.');
    console.log(`[DEV] Verification URL: ${APP_URL}/auth/verify?token=${token}`);
    return { success: true }; // Return success in dev mode
  }

  const verificationUrl = `${APP_URL}/auth/verify?token=${token}`;

  try {
    const { error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Xác thực email của bạn - NEO Education',
      react: VerificationEmail({ userName, verificationUrl }),
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  token: string
): Promise<EmailResult> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

  if (!isEmailConfigured()) {
    console.warn('Email service not configured. Skipping password reset email.');
    console.log(`[DEV] Reset URL: ${resetUrl}`);
    return { success: true }; // Return success in dev mode
  }

  try {
    const { error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Đặt lại mật khẩu - NEO Education',
      react: PasswordResetEmail({ userName, resetUrl }),
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(
  email: string,
  userName: string
): Promise<EmailResult> {
  const loginUrl = `${APP_URL}/auth/login`;

  if (!isEmailConfigured()) {
    console.warn('Email service not configured. Skipping welcome email.');
    return { success: true }; // Return success in dev mode
  }

  try {
    const { error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Chào mừng bạn đến với NEO Education! 🎉',
      react: WelcomeEmail({ userName, loginUrl }),
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generic email sending function for custom emails
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html?: string;
  react?: React.ReactElement;
}): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.warn('Email service not configured. Skipping email.');
    console.log(`[DEV] Would send email to ${options.to}: ${options.subject}`);
    return { success: true };
  }

  try {
    // Build send options based on what's provided
    const sendOptions = {
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      ...(options.react ? { react: options.react } : {}),
      ...(options.html && !options.react ? { html: options.html } : {}),
    } as any;

    const { error } = await resend!.emails.send(sendOptions);

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Re-export templates for preview/testing
export { VerificationEmail, PasswordResetEmail, WelcomeEmail };
