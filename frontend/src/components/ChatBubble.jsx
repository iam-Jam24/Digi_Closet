import { RotateCcw } from 'lucide-react';

function formatMessageText(text) {
  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    const isBullet = /^([-•*])\s+/.test(trimmed);
    const cleanLine = isBullet ? trimmed.replace(/^[-•*]\s+/, '') : line;

    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
    const parsedLine = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={partIdx} className="chat-bubble__bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={lineIdx} className="chat-bubble__bullet-line">
          <span className="chat-bubble__bullet-dot" />
          <span>{parsedLine}</span>
        </div>
      );
    }

    return (
      <p key={lineIdx} className="chat-bubble__paragraph">
        {parsedLine}
      </p>
    );
  });
}

export default function ChatBubble({ role, content, failed, onRetry }) {
  return (
    <div className={`chat-bubble-row chat-bubble-row--${role}`}>
      <div className={`chat-bubble chat-bubble--${role} ${failed ? 'chat-bubble--failed' : ''}`}>
        <div className="chat-bubble__content">{formatMessageText(content)}</div>
        {failed && (
          <button type="button" className="chat-bubble__retry" onClick={onRetry}>
            <RotateCcw size={12} /> Not sent. Retry
          </button>
        )}
      </div>
    </div>
  );
}

export function ChatTypingIndicator() {
  return (
    <div className="chat-bubble-row chat-bubble-row--assistant">
      <div className="chat-bubble chat-bubble--assistant chat-typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
