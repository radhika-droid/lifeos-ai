import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Signup() {
  const { signup, logout, user, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await signup({ name: name.trim(), email: email.trim(), password });
      navigate('/');
    } catch {
      // error is set in store
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 lg:p-8 bg-[#0f0f13] relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="fixed top-1/4 right-1/4 translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/4 -translate-x-1/2 translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 animate-fade-in">
        
        {/* Left Side: Visual Showcase Card */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 rounded-3xl bg-gradient-to-br from-[#1b1b26]/90 via-[#161622]/80 to-[#12121a]/90 border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden min-h-[560px]">
          <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:20px_20px] opacity-15" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/30">
                🚀
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
                Join LifeOS AI
              </span>
            </div>

            <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight mb-3">
              Upgrade Your Focus, Habit Discipline & Life Strategy
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Create your account to unlock private workspace data, personalized ML model training, and smart recommendations that learn your habits.
            </p>
          </div>

          {/* Testimonial / Highlights */}
          <div className="space-y-3 my-6 relative z-10">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-4">
              <div className="text-3xl">👥</div>
              <div>
                <h4 className="text-sm font-semibold text-white">Multi-User Ready</h4>
                <p className="text-xs text-zinc-400">Share your live link with friends; each user gets an isolated database profile and ML weights.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-4">
              <div className="text-3xl">🧠</div>
              <div>
                <h4 className="text-sm font-semibold text-white">Self-Trained Model</h4>
                <p className="text-xs text-zinc-400">Your completed tasks and check-ins continuously train your custom decision algorithm.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-zinc-400 relative z-10">
            <span>✨ Free tier instant access</span>
            <span>🛡️ End-to-end data isolation</span>
          </div>
        </div>

        {/* Right Side: Sign Up Form */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="text-center lg:text-left mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl mx-auto lg:mx-0 mb-4 shadow-lg shadow-purple-500/30 lg:hidden">
              🚀
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Start your personalized AI life dashboard in seconds
            </p>
          </div>

          {/* Active Session Notice */}
          {isAuthenticated && user && (
            <div className="p-4 mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex flex-col gap-2 text-sm text-zinc-200 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Currently signed in as <strong className="text-white">{user.email}</strong>
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
                Go to Dashboard →
              </Button>
            </div>
          )}

          {/* Form Card */}
          <div className="p-6 lg:p-8 rounded-3xl bg-[#161622]/90 border border-white/10 shadow-xl backdrop-blur-xl space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm animate-fade-in flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="Radhika or your name"
                value={name}
                onChange={(e) => {
                  clearError();
                  setName(e.target.value);
                }}
                required
                autoComplete="name"
              />

              <Input
                label="Email Address"
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
                placeholder="•••••••• (min 6 characters)"
                value={password}
                onChange={(e) => {
                  clearError();
                  setPassword(e.target.value);
                }}
                required
                minLength={6}
                autoComplete="new-password"
              />

              <Button type="submit" loading={isLoading} className="w-full" size="lg">
                Get Started Free
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-zinc-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
