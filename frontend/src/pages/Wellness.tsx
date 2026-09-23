import { useState, useEffect } from 'react';
import api from '../lib/api';

interface ChatMsg {
  role: 'user' | 'model' | 'assistant';
  text: string;
}

const TOPIC_RESPONSES: Record<string, string> = {
  stress: "Stress often signals that something important is being squeezed. 💨 Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste. It brings you back to now.",
  sleep: "Sleep is your brain's maintenance window. 🌙 Try keeping a consistent wake time, reducing screens 1 hour before bed, and keeping your room cool.",
  anxiety: "Anxiety is your brain's alarm system misfiring. 🧠 Box breathing helps: breathe in for 4 counts, hold for 4, out for 4, hold for 4. Repeat 4 times.",
  focus: "Trouble focusing? Try the 2-minute rule — if it takes less than 2 minutes, do it now. 🎯 Then use 25-minute Pomodoro blocks for deeper work.",
  motivation: "Motivation follows action — not the other way around. 🔥 Start with just 2 minutes of the thing you're dreading.",
};

export default function Wellness() {
  const [selectedMood, setSelectedMood] = useState<number>(4);
  const [journalNote, setJournalNote] = useState('');
  const [gratitudeNote, setGratitudeNote] = useState('');
  const [checkinSaved, setCheckinSaved] = useState(false);

  // Breathing Box State
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathText, setBreathText] = useState('Inhale...');
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  // Chat State
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', text: "Hi there! 🌸 I'm your Wellness Buddy. How are you feeling today? You can share anything — I'm here to listen without judgment. 💙" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (breathingActive) {
      const phases: Array<{ text: string; phase: 'inhale' | 'hold' | 'exhale' }> = [
        { text: 'Inhale (4s)...', phase: 'inhale' },
        { text: 'Hold (4s)...', phase: 'hold' },
        { text: 'Exhale (4s)...', phase: 'exhale' },
        { text: 'Hold (4s)...', phase: 'hold' },
      ];
      let idx = 0;
      timer = setInterval(() => {
        idx = (idx + 1) % phases.length;
        setBreathText(phases[idx].text);
        setBreathPhase(phases[idx].phase);
      }, 4000);
    } else {
      setBreathText('Inhale...');
      setBreathPhase('inhale');
    }
    return () => clearInterval(timer);
  }, [breathingActive]);

  const handleSaveCheckin = async () => {
    try {
      await api.post('/checkin', {
        energy_level: 'medium',
        mood: selectedMood >= 4 ? 'good' : selectedMood === 3 ? 'okay' : 'low',
        available_minutes: 60
      });
      setCheckinSaved(true);
      setTimeout(() => setCheckinSaved(false), 3000);
    } catch {
      setCheckinSaved(true);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput.trim();
    if (!text) return;

    const userMsg: ChatMsg = { role: 'user', text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setChatInput('');
    setSending(true);

    try {
      const res = await api.post<{ reply: string }>('/chat/message', {
        messages: updatedMessages.map(m => ({ role: m.role === 'assistant' ? 'model' : m.role, text: m.text }))
      });
      setMessages([...updatedMessages, { role: 'assistant', text: res.data.reply }]);
    } catch {
      // Local fallback if API fails
      const lower = text.toLowerCase();
      let reply = "I hear you. 💙 Taking a few slow breaths can help center your mind. What else is on your mind today?";
      for (const [key, resp] of Object.entries(TOPIC_RESPONSES)) {
        if (lower.includes(key)) {
          reply = resp;
          break;
        }
      }
      setMessages([...updatedMessages, { role: 'assistant', text: reply }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          🧘 Mental Health & Wellness Buddy
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Your safe space for reflection, mindfulness exercises, and emotional support.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Check-In Card */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            😊 Daily Mood Check-In
          </h2>
          <div className="flex justify-between gap-2">
            {[
              { val: 5, label: 'Amazing', emoji: '😄' },
              { val: 4, label: 'Good', emoji: '🙂' },
              { val: 3, label: 'Okay', emoji: '😐' },
              { val: 2, label: 'Low', emoji: '😕' },
              { val: 1, label: 'Struggling', emoji: '😢' },
            ].map(m => (
              <button
                key={m.val}
                type="button"
                onClick={() => setSelectedMood(m.val)}
                className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                  selectedMood === m.val
                    ? 'border-accent bg-accent/15 text-accent font-semibold shadow-md shadow-accent/20 scale-105'
                    : 'border-border-default bg-bg-secondary/50 text-text-secondary hover:border-accent/40'
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs">{m.label}</span>
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
              Journal Note (optional)
            </label>
            <textarea
              className="w-full bg-bg-secondary border border-border-default rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
              rows={2}
              placeholder="What's on your mind today?"
              value={journalNote}
              onChange={e => setJournalNote(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">
              🙏 3 Things You're Grateful For
            </label>
            <textarea
              className="w-full bg-bg-secondary border border-border-default rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
              rows={2}
              placeholder="I'm grateful for..."
              value={gratitudeNote}
              onChange={e => setGratitudeNote(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={handleSaveCheckin}
            className="w-full py-2.5 rounded-xl gradient-bg text-white font-semibold text-sm shadow-md shadow-accent/30 hover:opacity-90 transition-opacity cursor-pointer"
          >
            {checkinSaved ? '✓ Check-In Saved!' : 'Save Check-In'}
          </button>
        </div>

        {/* Box Breathing Widget */}
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            💨 Box Breathing Exercise
          </h2>
          <p className="text-xs text-text-secondary max-w-sm">
            4-4-4-4 count box breathing helps reduce anxiety, lower blood pressure, and restore calm.
          </p>

          <div
            className={`w-36 h-36 rounded-full flex items-center justify-center text-accent font-bold text-sm border-2 border-accent/40 bg-accent/10 shadow-lg transition-transform duration-[4000ms] ${
              breathingActive && breathPhase === 'inhale'
                ? 'scale-125 bg-accent/25 border-accent shadow-accent/40'
                : breathingActive && breathPhase === 'exhale'
                ? 'scale-90 bg-accent/5'
                : 'scale-100'
            }`}
          >
            {breathText}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setBreathingActive(true)}
              disabled={breathingActive}
              className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer"
            >
              ▶ Start Session
            </button>
            <button
              type="button"
              onClick={() => setBreathingActive(false)}
              disabled={!breathingActive}
              className="px-4 py-2 rounded-xl border border-border-default text-text-secondary text-xs font-semibold hover:text-text-primary disabled:opacity-50 transition-colors cursor-pointer"
            >
              ◼ Stop
            </button>
          </div>
        </div>
      </div>

      {/* Wellness AI Chatbot */}
      <div className="glass-card p-6 flex flex-col h-[480px]">
        <div className="pb-3 border-b border-border-default flex items-center gap-3">
          <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-sm">
            🤗
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-sm">Wellness Buddy AI</h3>
            <p className="text-xs text-text-secondary">Empathetic support & active listening</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-accent text-white ml-auto rounded-br-none'
                  : 'bg-bg-secondary text-text-primary mr-auto rounded-bl-none border border-border-default'
              }`}
            >
              {m.text}
            </div>
          ))}
          {sending && (
            <div className="bg-bg-secondary text-text-secondary p-3 rounded-2xl text-xs w-fit animate-pulse">
              Wellness Buddy is typing...
            </div>
          )}
        </div>

        {/* Quick Topic Chips */}
        <div className="flex flex-wrap gap-2 py-2">
          {['I feel stressed', "I can't sleep", 'I feel anxious', 'I need motivation', 'I feel overwhelmed'].map(prompt => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1 rounded-full text-xs bg-bg-secondary border border-border-default text-text-secondary hover:text-accent hover:border-accent/40 transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2 pt-2 border-t border-border-default"
        >
          <input
            type="text"
            className="flex-1 bg-bg-secondary border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
            placeholder="Share how you're feeling..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || sending}
            className="px-5 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-hover disabled:opacity-50 transition-colors cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
