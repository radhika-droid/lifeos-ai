import { useState } from 'react';
import { useAuthStore } from '../lib/store';
import api from '../lib/api';

export default function Profile() {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name || 'User');
  const [email] = useState(user?.email || '');
  const [bio, setBio] = useState('LifeOS AI Power User & Productivity Lead');
  const [defaultEnergy, setDefaultEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [focusDuration, setFocusDuration] = useState(25);
  const [saved, setSaved] = useState(false);

  // Model Training state
  const [training, setTraining] = useState(false);
  const [trainStatus, setTrainStatus] = useState<string | null>(null);

  // Share link state
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTrainModel = async () => {
    setTraining(true);
    setTrainStatus(null);
    try {
      const res = await api.post('/analytics/train-model');
      if (res.data.success) {
        setTrainStatus(`✅ Model Fine-Tuned! ${res.data.message}`);
      } else {
        setTrainStatus(`⚠️ ${res.data.error || 'Insufficient data to train yet'}`);
      }
    } catch (err: any) {
      setTrainStatus(`⚠️ Failed to train model: ${err.message}`);
    } finally {
      setTraining(false);
    }
  };

  const handleCopyShareLink = () => {
    const link = window.location.origin;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          👤 User Profile & Settings
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your credentials, AI preferences, personalized ML model, and friend invites.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Credentials & Info */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            🔑 Account Information
          </h2>

          <div className="flex items-center gap-4 py-2 border-b border-border-default">
            <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-accent/20">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-text-primary">{name}</h3>
              <p className="text-xs text-text-secondary">{email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent/20 text-accent border border-accent/30">
                PRO Member
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="w-full bg-bg-secondary border border-border-default rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <input
              type="email"
              disabled
              className="w-full bg-bg-secondary/50 border border-border-default rounded-xl p-3 text-sm text-text-muted cursor-not-allowed"
              value={email}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
              Personal Bio
            </label>
            <textarea
              className="w-full bg-bg-secondary border border-border-default rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
              rows={2}
              value={bio}
              onChange={e => setBio(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm shadow-md shadow-accent/30 hover:opacity-90 transition-opacity cursor-pointer"
          >
            {saved ? '✓ Profile Saved!' : 'Save Changes'}
          </button>

          {/* Share App Link section */}
          <div className="pt-4 border-t border-border-default space-y-2">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              🚀 Invite Friends (Multi-User)
            </h3>
            <p className="text-xs text-text-secondary">
              Share your deployed LifeOS link with 3-4 friends so they can create their own accounts.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={window.location.origin}
                className="w-full bg-bg-secondary border border-border-default rounded-xl p-2.5 text-xs text-text-primary font-mono select-all"
              />
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="px-4 py-2.5 rounded-xl bg-accent/20 border border-accent/40 text-accent font-semibold text-xs hover:bg-accent/30 transition-colors whitespace-nowrap cursor-pointer"
              >
                {copied ? '✓ Copied!' : '📋 Copy Link'}
              </button>
            </div>
          </div>
        </div>

        {/* AI & App Preferences */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            ⚙️ AI & Personalization Engine
          </h2>

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-2">
              Default Energy Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: '🪫 Low' },
                { id: 'medium', label: '🔋 Medium' },
                { id: 'high', label: '⚡ High' },
              ].map(e => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setDefaultEnergy(e.id as any)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    defaultEnergy === e.id
                      ? 'border-accent bg-accent/15 text-accent shadow-sm'
                      : 'border-border-default bg-bg-secondary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
              Focus Block Timer (Minutes)
            </label>
            <input
              type="number"
              min={5}
              max={120}
              className="w-full bg-bg-secondary border border-border-default rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent"
              value={focusDuration}
              onChange={e => setFocusDuration(parseInt(e.target.value) || 25)}
            />
          </div>

          {/* Model Personalization Section */}
          <div className="p-4 rounded-xl bg-bg-secondary border border-accent/20 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                🤖 Personal AI ML Model
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold border border-accent/30">
                Gradient Boosting
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              LifeOS logs your task outcomes to train a machine learning model tailored to your habits and peak energy times.
            </p>
            <button
              type="button"
              onClick={handleTrainModel}
              disabled={training}
              className="w-full py-2.5 rounded-xl border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {training ? '⏳ Fine-Tuning ML Model...' : '⚡ Train ML Model on My Data'}
            </button>
            {trainStatus && (
              <p className="text-xs text-accent font-medium mt-1 animate-fade-in">{trainStatus}</p>
            )}
          </div>

          {/* Lifetime Stats */}
          <div className="pt-4 border-t border-border-default">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              📈 Lifetime Productivity Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-bg-secondary border border-border-default text-center">
                <span className="text-xl font-bold gradient-text block">24</span>
                <span className="text-[11px] text-text-secondary">Tasks Completed</span>
              </div>
              <div className="p-3 rounded-xl bg-bg-secondary border border-border-default text-center">
                <span className="text-xl font-bold gradient-text block">12🔥</span>
                <span className="text-[11px] text-text-secondary">Best Habit Streak</span>
              </div>
              <div className="p-3 rounded-xl bg-bg-secondary border border-border-default text-center">
                <span className="text-xl font-bold gradient-text block">18</span>
                <span className="text-[11px] text-text-secondary">Mood Check-Ins</span>
              </div>
              <div className="p-3 rounded-xl bg-bg-secondary border border-border-default text-center">
                <span className="text-xl font-bold gradient-text block">34</span>
                <span className="text-[11px] text-text-secondary">AI Buddy Chats</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
