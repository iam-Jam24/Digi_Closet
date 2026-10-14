export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  const classes = [
    'badge',
    `badge--${variant}`,
    size === 'sm' ? 'badge--sm' : '',
    className,
  ].filter(Boolean).join(' ');

  return <span className={classes}>{children}</span>;
}
