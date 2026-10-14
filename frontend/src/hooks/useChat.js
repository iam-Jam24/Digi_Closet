import { useState, useCallback } from 'react';
import api from '../services/api';

export default function useChat() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (message) => {
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    try {
      setSending(true);
      setError(null);
      const { data } = await api.post('/chat', { message, conversationId });
      setConversationId(data.data.conversationId);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.data.reply, mode: data.data.mode }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message.');
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't process that. Please try again.",
        mode: 'error',
      }]);
    } finally {
      setSending(false);
    }
  }, [conversationId]);

  const newConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  return { messages, sending, error, sendMessage, newConversation };
}
