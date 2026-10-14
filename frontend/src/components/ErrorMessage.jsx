import { AlertCircle } from 'lucide-react';
import Button from './Button';

export default function ErrorMessage({
  message = 'Something went wrong.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`error-message ${className}`} role="alert">
      <div className="error-message__icon">
        <AlertCircle size={28} />
      </div>
      <p className="error-message__text">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>Try Again</Button>
      )}
    </div>
  );
}
