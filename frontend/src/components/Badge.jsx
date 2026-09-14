const variants = {
  default: 'bg-brand-100 text-brand-700',
  dark: 'bg-brand-900 text-white',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-sky-50 text-sky-700',
};

export default function Badge({
  children,
  variant = 'default',
  className = '',
}) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5
        text-xs font-medium rounded-full
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
