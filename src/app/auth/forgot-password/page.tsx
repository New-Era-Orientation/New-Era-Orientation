'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Đã xảy ra lỗi');
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError('Không thể kết nối đến server');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kiểm tra email của bạn
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Nếu tài khoản với email <strong>{email}</strong> tồn tại, 
              chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              Link sẽ hết hạn sau 1 giờ. Kiểm tra cả thư mục spam nếu không thấy email.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/auth/login"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
            
            <button
              onClick={() => {
                setIsSubmitted(false);
                setEmail('');
              }}
              className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Gửi lại với email khác
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            Quên mật khẩu?
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang gửi...
              </>
            ) : (
              'Gửi hướng dẫn'
            )}
          </button>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
