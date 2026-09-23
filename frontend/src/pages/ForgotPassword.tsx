import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const handleRequestReset = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setMessage(res.data.message);
      if (res.data.reset_token) {
        setGeneratedToken(res.data.reset_token);
        setToken(res.data.reset_token);
      }
      setStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.post('/auth/reset-password', {
        token: token.trim(),
        new_password: newPassword,
      });
      setMessage(res.data.message || 'Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please check your token.');
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold gradient-text">Reset Your Password</h1>
          <p className="text-sm text-text-secondary mt-1">
            {step === 'request'
              ? 'Enter your email to receive reset instructions'
              : 'Enter your reset token and new password'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-6 space-y-4">
          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm">
              {message}
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setError(null);
                  setEmail(e.target.value);
                }}
                required
                autoComplete="email"
              />

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Generate Reset Link
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {generatedToken && (
                <div className="p-3 rounded-xl bg-bg-secondary border border-border-default text-xs space-y-1">
                  <span className="text-text-secondary block">🔑 Demo Reset Token:</span>
                  <code className="block bg-bg-primary p-2 rounded text-accent font-mono break-all text-[11px]">
                    {generatedToken}
                  </code>
                </div>
              )}

              <Input
                label="Reset Token"
                type="text"
                placeholder="Paste token here"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />

              <Input
                label="New Password"
                type="password"
                placeholder="•••••••• (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Reset Password
              </Button>
            </form>
          )}

          <div className="pt-2 text-center flex items-center justify-between text-xs text-text-secondary">
            {step === 'reset' && (
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-text-secondary hover:text-text-primary underline cursor-pointer"
              >
                ← Change Email
              </button>
            )}
            <Link to="/login" className="text-accent hover:text-accent-hover font-medium ml-auto">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
