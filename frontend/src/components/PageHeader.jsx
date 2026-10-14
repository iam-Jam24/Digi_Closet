export default function PageHeader({
  title,
  subtitle,
  action,
  className = '',
}) {
  return (
    <div className={`page-header ${className}`}>
      <div>
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-header__action">{action}</div>}
    </div>
  );
}
