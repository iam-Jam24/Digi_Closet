export default function Avatar({
  name = '',
  src,
  size = 'md',
  className = '',
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const classes = ['avatar', `avatar--${size}`, className].filter(Boolean).join(' ');

  if (src) {
    return <img src={src} alt={name} className={classes} />;
  }

  return <div className={classes}>{initials || '?'}</div>;
}
