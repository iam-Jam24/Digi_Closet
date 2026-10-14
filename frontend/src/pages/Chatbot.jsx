import { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw } from 'lucide-react';
import useChat from '../hooks/useChat';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import ChatBubble, { ChatTypingIndicator } from '../components/ChatBubble';
import EmptyState from '../components/EmptyState';
import { Bot } from 'lucide-react';

const SUGGESTIONS = [
  'What should I wear to college tomorrow?',
  'Suggest an outfit using my existing wardrobe.',
  'What essential items are missing from my closet?',
];

export default function Chatbot() {
  const { messages, sending, sendMessage, newConversation } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 8rem)' }}>
      <PageHeader
        title="AI Fashion Chatbot"
        subtitle="Ask questions about your wardrobe and get grounded styling advice."
        action={<Button variant="ghost" onClick={newConversation}><RotateCcw size={16} /> New Chat</Button>}
      />

      <Card padding={false} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>
          {messages.length === 0 ? (
            <div>
              <EmptyState icon={Bot} title="Start a conversation" description="Ask about outfits, your wardrobe, or styling advice." />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center' }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="filter-chip" onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => <ChatBubble key={i} role={m.role} content={m.content} mode={m.mode} />)}
              {sending && <ChatTypingIndicator />}
              <div ref={scrollRef} />
            </>
          )}
        </div>

        <form onSubmit={handleSend} className="chat-input-bar">
          <Input placeholder="Ask about your wardrobe or styling..." value={input} onChange={(e) => setInput(e.target.value)} />
          <Button type="submit" loading={sending} disabled={!input.trim()}><Send size={16} /></Button>
        </form>
      </Card>
    </div>
  );
}
