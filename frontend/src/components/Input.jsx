import { useState, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
  label,
  type = 'text',
  error,
  icon: Icon,
  className = '',
  id,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const inputId = id || generatedId;
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const inputClasses = [
    'input',
    Icon ? 'input--with-icon' : '',
    isPassword ? 'input--with-toggle' : '',
    error ? 'input--error' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`field ${className}`}>
      {label && <label htmlFor={inputId} className="field__label">{label}</label>}
      <div className="field__control">
        {Icon && (
          <div className="field__icon" aria-hidden="true">
            <Icon size={16} />
          </div>
        )}
        <input id={inputId} type={inputType} className={inputClasses} {...props} />
        {isPassword && (
          <button
            type="button"
            className="field__toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}
