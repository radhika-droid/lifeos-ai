import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
  const { login, logout, user, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login({ email: email.trim(), password });
      navigate('/');
    } catch {
      // error is set in store
    }
  };

  const handleDemoLogin = async () => {
    try {
      await login({ email: 'demo@lifeos.ai', password: 'password123' });
      navigate('/');
    } catch {
      // error is set in store
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 lg:p-8 bg-[#0f0f13] relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="fixed top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 animate-fade-in">
        
        {/* Left Side: Visual Showcase Card */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 rounded-3xl bg-gradient-to-br from-[#1b1b26]/90 via-[#161622]/80 to-[#12121a]/90 border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden min-h-[560px]">
          {/* Decorative grid pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] opacity-15" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                ⚡
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                LifeOS AI
              </span>
            </div>

            <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight mb-3">
              Your Intelligent Life & Decision Operating System
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Experience an AI-driven personal assistant that predicts your highest-leverage tasks, manages habit loops, and maintains peak mental wellness.
            </p>
          </div>

          {/* Interactive Feature Cards */}
          <div className="space-y-3 my-6 relative z-10">
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3.5 hover:bg-white/[0.07] transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl shrink-0">
                🎯
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Smart Decision Engine</h4>
                <p className="text-xs text-zinc-400">Personalized ML scoring fine-tuned to your daily energy & habits</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3.5 hover:bg-white/[0.07] transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl shrink-0">
                🔥
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">30-Day Habit Loops</h4>
                <p className="text-xs text-zinc-400">Visual heatmaps and consistency tracking with streak protection</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3.5 hover:bg-white/[0.07] transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0">
                🧘
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Mental Wellness & Recovery</h4>
                <p className="text-xs text-zinc-400">Guided box breathing exercises and real-time mood logging</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-zinc-400 relative z-10">
            <span>🔒 Secure JWT Authentication</span>
            <span>⚡ Zero-Lag SQLite Monolith</span>
          </div>
        </div>

        {/* Right Side: Sign In Form */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          {/* Mobile Header */}
          <div className="text-center lg:text-left mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mx-auto lg:mx-0 mb-4 shadow-lg shadow-indigo-500/30 lg:hidden">
              ⚡
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Sign in to manage your tasks, habits, and wellness
            </p>
          </div>

          {/* Active Session Notice */}
          {isAuthenticated && user && (
            <div className="p-4 mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col gap-2 text-sm text-zinc-200 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Signed in as <strong className="text-white">{user.email}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-xs text-rose-400 hover:underline cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
              <Button
                type="button"
                size="sm"
                className="w-full mt-1"
                onClick={() => navigate('/')}
              >
                Continue to Dashboard →
              </Button>
            </div>
          )}

          {/* Login Card */}
          <div className="p-6 lg:p-8 rounded-3xl bg-[#161622]/90 border border-white/10 shadow-xl backdrop-blur-xl space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm animate-fade-in flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  clearError();
                  setEmail(e.target.value);
                }}
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  clearError();
                  setPassword(e.target.value);
                }}
                required
                autoComplete="current-password"
              />

              <div className="flex justify-end text-xs">
                <Link
                  to="/forgot-password"
                  className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" loading={isLoading} className="w-full" size="lg">
                Sign In
              </Button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 text-xs text-zinc-400">OR QUICK TEST</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-medium py-2.5 rounded-xl transition-all"
                onClick={handleDemoLogin}
                disabled={isLoading}
              >
                ⚡ 1-Click Instant Demo Login
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-zinc-400 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Create an account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
