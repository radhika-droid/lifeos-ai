import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Signup() {
  const { signup, isLoading, error, clearError } = useAuthStore();
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
    <div className="min-h-dvh flex items-center justify-center px-4 bg-bg-primary">
      {/* Background glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-secondary/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-accent/30 animate-pulse-glow">
            L
          </div>
          <h1 className="text-2xl font-bold gradient-text">Create your account</h1>
          <p className="text-sm text-text-secondary mt-1">Start your personal AI operating system</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          <Input
            label="Name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => {
              clearError();
              setName(e.target.value);
            }}
            required
            autoComplete="name"
          />

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
            minLength={6}
            autoComplete="new-password"
          />

          <Button type="submit" loading={isLoading} className="w-full" size="lg">
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
