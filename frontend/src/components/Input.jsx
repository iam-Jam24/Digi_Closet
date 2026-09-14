import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
  label,
  type = 'text',
  error,
  icon: Icon,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-brand-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          type={inputType}
          className={`
            w-full px-3 py-2.5 text-sm
            bg-white border rounded-lg
            text-brand-900 placeholder:text-brand-400
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-brand-900/10 focus:border-brand-400
            ${Icon ? 'pl-10' : ''}
            ${isPassword ? 'pr-10' : ''}
            ${error
              ? 'border-red-300 focus:ring-red-500/10 focus:border-red-400'
              : 'border-brand-200 hover:border-brand-300'
            }
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-600 transition-colors"
          >
            {showPassword
              ? <EyeOff className="w-4 h-4" />
              : <Eye className="w-4 h-4" />
            }
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
