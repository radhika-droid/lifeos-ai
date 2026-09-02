import { useState, useRef, useEffect } from 'react';
import api from '../../lib/api';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/chat/message', { messages: newMessages });
      const botMsg: ChatMessage = { role: 'model', text: res.data.reply };
      setMessages([...newMessages, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        role: 'model',
        text: '⚠️ Sorry, I couldn\'t process that. Please check that your GEMINI_API_KEY is configured and try again.',
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating Action Button ─────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-fab"
        aria-label="Toggle AI Chat"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* ── Chat Panel ─────────────────────────────── */}
      <div className={`chat-panel ${isOpen ? 'chat-panel-open' : ''}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-icon">
            <span>🧠</span>
          </div>
          <div>
            <h3 className="chat-header-title">LifeOS AI</h3>
            <p className="chat-header-subtitle">
              {isLoading ? 'Thinking...' : 'Ask me anything about your tasks'}
            </p>
          </div>
          <button onClick={() => setIsOpen(false)} className="chat-close-btn" aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">🧠</div>
              <p className="chat-empty-title">Hey! I'm your LifeOS AI assistant.</p>
              <p className="chat-empty-subtitle">Ask me things like:</p>
              <div className="chat-suggestions">
                {[
                  'What tasks are pending?',
                  'What should I work on now?',
                  'How are my habits going?',
                  'Show my goals progress',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    className="chat-suggestion-btn"
                    onClick={() => {
                      setInput(suggestion);
                      setTimeout(() => {
                        const userMsg: ChatMessage = { role: 'user', text: suggestion };
                        const newMessages = [userMsg];
                        setMessages(newMessages);
                        setIsLoading(true);
                        api.post('/chat/message', { messages: newMessages })
                          .then((res) => {
                            setMessages([...newMessages, { role: 'model', text: res.data.reply }]);
                          })
                          .catch(() => {
                            setMessages([...newMessages, { role: 'model', text: '⚠️ Could not connect. Check your API key.' }]);
                          })
                          .finally(() => {
                            setIsLoading(false);
                            setInput('');
                          });
                      }, 0);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
              {msg.role === 'model' && <span className="chat-bubble-avatar">🧠</span>}
              <div className={`chat-bubble-content ${msg.role === 'user' ? 'chat-bubble-content-user' : 'chat-bubble-content-bot'}`}>
                <ChatFormattedText text={msg.text} />
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-bubble chat-bubble-bot">
              <span className="chat-bubble-avatar">🧠</span>
              <div className="chat-bubble-content chat-bubble-content-bot">
                <div className="chat-typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask LifeOS AI..."
            className="chat-input"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="chat-send-btn"
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

/** Renders markdown-like text with bold and line breaks */
function ChatFormattedText({ text }: { text: string }) {
  // Split by newlines, then handle **bold** within each line
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            return <span key={j}>{part}</span>;
          })}
        </span>
      ))}
    </>
  );
}
