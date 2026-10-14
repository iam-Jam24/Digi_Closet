export default function ChatBubble({ role, content, mode }) {
  return (
    <div className={`chat-bubble-row chat-bubble-row--${role}`}>
      <div className={`chat-bubble chat-bubble--${role}`}>
        {content}
        {role === 'assistant' && mode === 'offline-fallback' && (
          <span className="chat-bubble__mode-tag">⚠ Offline heuristic reply (Gemini API key not configured)</span>
        )}
      </div>
    </div>
  );
}

export function ChatTypingIndicator() {
  return (
    <div className="chat-bubble-row chat-bubble-row--assistant">
      <div className="chat-bubble chat-bubble--assistant chat-typing">
        <span /><span /><span />
      </div>
    </div>
  );
}
