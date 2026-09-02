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
    <div className="min-h-dvh flex items-center justify-center px-4 bg-bg-primary">
      {/* Background glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-accent/30 animate-pulse-glow">
            L
          </div>
          <h1 className="text-2xl font-bold gradient-text">Welcome back</h1>
          <p className="text-sm text-text-secondary mt-1">Sign in to your LifeOS dashboard</p>
        </div>

        {/* Active Session Notice */}
        {isAuthenticated && user && (
          <div className="glass-card p-4 mb-4 border border-accent/30 flex flex-col gap-2 text-sm text-text-primary">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Signed in as <strong className="text-text-primary">{user.email}</strong></span>
              <button
                type="button"
                onClick={() => logout()}
                className="text-xs text-danger hover:underline cursor-pointer"
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

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

          <Button type="submit" loading={isLoading} className="w-full" size="lg">
            Sign In
          </Button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border-default"></div>
            <span className="flex-shrink mx-3 text-xs text-text-muted">OR</span>
            <div className="flex-grow border-t border-border-default"></div>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full border border-border-default hover:border-accent/40 text-accent font-medium py-2.5"
            onClick={handleDemoLogin}
            disabled={isLoading}
          >
            ⚡ Instant Demo Login
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent hover:text-accent-hover transition-colors font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
