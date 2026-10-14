import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  return (
    <div className={`loading-spinner loading-spinner--${size} ${className}`} role="status" aria-label="Loading">
      <Loader2 className="loading-spinner__icon animate-spin" />
    </div>
  );
}
