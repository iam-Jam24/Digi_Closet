import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-brand-900 text-white hover:bg-brand-800 active:bg-brand-950',
  secondary: 'bg-brand-100 text-brand-900 hover:bg-brand-200 active:bg-brand-300',
  outline: 'border border-brand-300 text-brand-900 hover:bg-brand-50 active:bg-brand-100',
  ghost: 'text-brand-600 hover:bg-brand-100 hover:text-brand-900 active:bg-brand-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
