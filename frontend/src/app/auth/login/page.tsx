'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon, ArrowDownTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 animate-slide-left">
      {/* Left Side - Login Form */}
      <div className="w-1/2 bg-white flex items-center justify-center p-8 border-r border-gray-200">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Patch Manager</h1>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Enter your email and password to access your patch management dashboard.
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                placeholder="Enter your email"
                style={{ color: email ? '#111827' : '#6b7280' }}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                  placeholder="Enter your password"
                  style={{ color: password ? '#111827' : '#6b7280' }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember Me
                </label>
              </div>
              <div className="text-sm">
                <Link
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-b from-blue-600 to-blue-800 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Log In"
              )}
            </button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  href="/auth/register"
                  className="font-medium text-blue-600 hover:text-blue-800"
                >
                  Register Now.
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Promotional Content */}
      <div className="w-1/2 bg-gradient-to-br from-blue-700 to-blue-800 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400 rounded-full"></div>
          <div className="absolute top-32 right-20 w-24 h-24 bg-blue-300 rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-blue-500 rounded-full"></div>
          <div className="absolute bottom-32 right-10 w-28 h-28 bg-blue-400 rounded-full"></div>
        </div>

        <div className="relative z-10 text-center text-white max-w-lg">
          <h2 className="text-4xl font-bold mb-4">
            Secure your systems with intelligent patch management.
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Log in to access your patch management dashboard and keep your infrastructure secure.
          </p>

          {/* Dashboard Preview */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">1,247</div>
                <div className="text-sm opacity-80">Systems Patched</div>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <div className="text-2xl font-bold">98.5%</div>
                <div className="text-sm opacity-80">Security Score</div>
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-lg font-semibold mb-2">Patch Status</div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Critical
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                  Important
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  Optional
                </span>
              </div>
            </div>
          </div>

          {/* Feature Icons */}
          <div className="mt-8 flex justify-center space-x-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm opacity-80">Security</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <ArrowDownTrayIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm opacity-80">Automation</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                <ExclamationTriangleIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm opacity-80">Monitoring</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between text-sm text-gray-500">
        <span>Copyright © 2025 Patch Management System.</span>
        <Link href="#" className="hover:text-gray-700">
          Privacy Policy
        </Link>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-left {
          animation: fade-in-left 0.6s ease-out forwards;
        }

        /* Override browser autofill styles */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px white inset !important;
          -webkit-text-fill-color: #111827 !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        /* For Firefox */
        input:-moz-autofill {
          background-color: white !important;
          color: #111827 !important;
        }

        /* High specificity placeholder styles */
        input[type="email"]::placeholder,
        input[type="password"]::placeholder,
        input[type="text"]::placeholder {
          color: #6b7280 !important;
          opacity: 1 !important;
        }

        input[type="email"]::-webkit-input-placeholder,
        input[type="password"]::-webkit-input-placeholder,
        input[type="text"]::-webkit-input-placeholder {
          color: #6b7280 !important;
          opacity: 1 !important;
        }

        input[type="email"]::-moz-placeholder,
        input[type="password"]::-moz-placeholder,
        input[type="text"]::-moz-placeholder {
          color: #6b7280 !important;
          opacity: 1 !important;
        }

        input[type="email"]:-ms-input-placeholder,
        input[type="password"]:-ms-input-placeholder,
        input[type="text"]:-ms-input-placeholder {
          color: #6b7280 !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}


























