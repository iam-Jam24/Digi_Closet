export default function PageHeader({
  title,
  subtitle,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 ${className}`}>
      <div>
        <h1 className="text-2xl font-bold text-brand-900 font-display">
          {title}
        </h1>
        {subtitle && (
          <p className="text-brand-500 mt-1 text-sm">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
