import { PackageOpen } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'Nothing here yet',
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-brand-400" />
      </div>
      <h3 className="text-lg font-semibold text-brand-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-brand-500 max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
