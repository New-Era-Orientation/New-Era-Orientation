'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Verify token on mount
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();
        setIsTokenValid(data.valid);
      } catch {
        setIsTokenValid(false);
      } finally {
        setIsVerifying(false);
      }
    }

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Đã xảy ra lỗi');
        return;
      }

      setIsSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login?message=password-reset');
      }, 3000);
    } catch {
      setError('Không thể kết nối đến server');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  // Invalid or missing token
  if (!token || !isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Link không hợp lệ
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
            Vui lòng yêu cầu link mới.
          </p>
          <div className="space-y-3">
            <Link
              href="/auth/forgot-password"
              className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              Yêu cầu link mới
            </Link>
            <Link
              href="/auth/login"
              className="block w-full py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Đặt lại mật khẩu thành công!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Mật khẩu của bạn đã được thay đổi. Đang chuyển hướng đến trang đăng nhập...
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chuyển hướng trong 3 giây...
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              🎓 NEO Education
            </h2>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
            Đặt mật khẩu mới
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Nhập mật khẩu mới cho tài khoản của bạn.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Password requirements */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Yêu cầu mật khẩu:
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li className={`flex items-center gap-2 ${password.length >= 6 ? 'text-green-600 dark:text-green-400' : ''}`}>
                {password.length >= 6 ? <CheckCircle className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-current" />}
                Ít nhất 6 ký tự
              </li>
              <li className={`flex items-center gap-2 ${password === confirmPassword && password.length > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                {password === confirmPassword && password.length > 0 ? <CheckCircle className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-current" />}
                Mật khẩu xác nhận khớp
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading || password.length < 6 || password !== confirmPassword}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Đặt mật khẩu mới'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
