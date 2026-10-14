export default function Card({
  children,
  className = '',
  hover = false,
  padding = true,
  glass = false,
  ...props
}) {
  const classes = [
    'card',
    padding ? 'card--padded' : '',
    hover ? 'card--hover' : '',
    glass ? 'card--glass' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
