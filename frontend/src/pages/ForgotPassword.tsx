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
    <div className="min-h-dvh flex items-center justify-center p-4 lg:p-8 bg-[#0f0f13] relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            🔐
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Account Recovery
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            {step === 'request'
              ? 'Enter your registered email to receive a recovery token'
              : 'Enter the recovery token and choose your new password'}
          </p>
        </div>

        {/* Card */}
        <div className="p-6 lg:p-8 rounded-3xl bg-[#161622]/90 border border-white/10 shadow-xl backdrop-blur-xl space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm animate-fade-in flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm animate-fade-in flex items-center gap-2">
              <span>✅</span>
              <span>{message}</span>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <Input
                label="Registered Email Address"
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
                Generate Recovery Token
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {generatedToken && (
                <div className="p-3.5 rounded-2xl bg-[#0f0f13] border border-indigo-500/30 text-xs space-y-1.5">
                  <span className="text-zinc-400 font-medium block">🔑 Generated Recovery Token:</span>
                  <code className="block bg-black/40 p-2.5 rounded-xl text-indigo-300 font-mono break-all text-[11px] border border-white/5">
                    {generatedToken}
                  </code>
                </div>
              )}

              <Input
                label="Recovery Token"
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
                Confirm & Reset Password
              </Button>
            </form>
          )}

          <div className="pt-2 text-center flex items-center justify-between text-xs text-zinc-400 border-t border-white/10 mt-4">
            {step === 'reset' && (
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-zinc-400 hover:text-white underline cursor-pointer"
              >
                ← Back
              </button>
            )}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium ml-auto">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
