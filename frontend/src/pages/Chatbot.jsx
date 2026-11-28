import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, Plus, History, Trash2, X } from 'lucide-react';
import useChat from '../hooks/useChat';
import useWardrobe from '../hooks/useWardrobe';
import ChatBubble, { ChatTypingIndicator } from '../components/ChatBubble';
import ConfirmDialog from '../components/ConfirmDialog';

const SUGGESTED_QUESTIONS = [
  'What should I wear today?',
  'Suggest an outfit for a date.',
  'How can I style my black jeans?',
  'What is missing from my wardrobe?',
];

const dayLabel = (date) => {
  if (!date) return '';
  const days = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (days < 1) return 'Today';
  if (days < 2) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(date).toLocaleDateString([], { day: 'numeric', month: 'short' });
};

export default function Chatbot() {
  const navigate = useNavigate();
  const {
    messages, conversationId, conversations, sending, error,
    sendMessage, loadConversation, deleteConversation, clearHistory, newConversation,
  } = useChat();
  const { items: wardrobeItems, loading: wardrobeLoading } = useWardrobe();

  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim() || sending) return;
    sendMessage(input);
    setInput('');
  };

  const handleClear = async () => {
    await clearHistory();
    setConfirmClear(false);
  };

  const startNew = () => {
    newConversation();
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const wardrobeCount = wardrobeItems.length;

  return (
    <div className="animate-fade-in">
      <div className="studio-chat">
        {showHistory && <button type="button" className="studio-chat__scrim" onClick={() => setShowHistory(false)} aria-label="Close conversations" />}

        <aside className={`studio-chat__sidebar ${showHistory ? 'is-open' : ''}`} aria-label="Conversations">
          <div className="studio-chat__sidebar-head">
            <span className="studio-chat__label">Conversations</span>
            <button type="button" className="studio-chat__icon-btn studio-chat__close" onClick={() => setShowHistory(false)} aria-label="Close conversations">
              <X size={16} />
            </button>
          </div>

          <button type="button" className="studio-chat__new" onClick={startNew}>
            <Plus size={15} /> New chat
          </button>

          <div className="studio-chat__list custom-scrollbar">
            {conversations.length === 0 ? (
              <p className="studio-chat__empty-list">No chats yet.</p>
            ) : (
              conversations.map((c) => (
                <div
                  key={c._id}
                  role="button"
                  tabIndex={0}
                  className={`studio-chat__thread ${c._id === conversationId ? 'is-active' : ''}`}
                  onClick={() => { loadConversation(c._id); setShowHistory(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { loadConversation(c._id); setShowHistory(false); } }}
                >
                  <span className="studio-chat__thread-text">
                    <span className="studio-chat__thread-title" title={c.title}>{c.title || 'Styling chat'}</span>
                    <span className="studio-chat__thread-date">{dayLabel(c.updatedAt)}</span>
                  </span>
                  <button
                    type="button"
                    className="studio-chat__thread-delete"
                    onClick={(e) => { e.stopPropagation(); deleteConversation(c._id); }}
                    aria-label="Delete conversation"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {conversations.length > 0 && (
            <button type="button" className="studio-chat__clear" onClick={() => setConfirmClear(true)}>
              <Trash2 size={13} /> Clear all
            </button>
          )}
        </aside>

        <section className="studio-chat__main">
          <header className="studio-chat__topbar">
            <button type="button" className="studio-chat__icon-btn studio-chat__history-btn" onClick={() => setShowHistory(true)} aria-label="Show conversations">
              <History size={17} />
            </button>
            <div className="studio-chat__persona">
              <h1 className="studio-chat__persona-name">DigiCloset Stylist</h1>
            </div>
            {messages.length > 0 && (
              <button type="button" className="studio-chat__icon-btn" onClick={startNew} aria-label="New conversation" title="New conversation">
                <Plus size={17} />
              </button>
            )}
          </header>

          <div className="studio-chat__messages custom-scrollbar">
            {messages.length === 0 ? (
              <div className="studio-chat__welcome">
                <span className="studio-chat__label">Your personal stylist</span>
                <h2 className="studio-chat__welcome-title">What can I help you <em>wear?</em></h2>
                <p className="studio-chat__welcome-text">Outfits, styling, or what to buy next.</p>
                <div className="studio-chat__prompts">
                  {SUGGESTED_QUESTIONS.map((text) => (
                    <button key={text} type="button" className="studio-chat__prompt" onClick={() => sendMessage(text)} disabled={sending}>
                      {text}
                    </button>
                  ))}
                </div>
                {!wardrobeLoading && wardrobeCount === 0 && (
                  <p className="studio-chat__note">
                    Answers are general until you{' '}
                    <button type="button" className="studio-chat__link" onClick={() => navigate('/wardrobe')}>add clothes</button>.
                  </p>
                )}
              </div>
            ) : (
              <div className="studio-chat__thread-view">
                {messages.map((m, i) => (
                  <ChatBubble
                    key={`${i}-${m.createdAt}`}
                    role={m.role}
                    content={m.content}
                    failed={m.failed}
                    onRetry={() => sendMessage(m.content)}
                  />
                ))}
                {sending && <ChatTypingIndicator />}
                <div ref={scrollRef} />
              </div>
            )}
          </div>

          {error && <p className="studio-chat__error" role="alert">{error}</p>}

          <form onSubmit={handleSend} className="studio-chat__composer">
            <div className="studio-chat__composer-box">
              <input
                ref={inputRef}
                className="studio-chat__input"
                placeholder="Ask your stylist anything…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={1000}
                disabled={sending}
                aria-label="Message"
              />
              <button type="submit" className="studio-chat__send" disabled={!input.trim() || sending} aria-label="Send message">
                <ArrowUp size={18} />
              </button>
            </div>
          </form>
        </section>
      </div>

      <ConfirmDialog
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClear}
        title="Clear chat history?"
        message="All of your past conversations will be permanently deleted."
        confirmLabel="Clear history"
      />
    </div>
  );
}
