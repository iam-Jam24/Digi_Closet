import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  options = [],
  error,
  placeholder = 'Select an option',
  className = '',
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-brand-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`
            w-full px-3 py-2.5 text-sm
            bg-white border rounded-lg
            text-brand-900
            appearance-none cursor-pointer
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-brand-900/10 focus:border-brand-400
            ${error
              ? 'border-red-300 focus:ring-red-500/10 focus:border-red-400'
              : 'border-brand-200 hover:border-brand-300'
            }
          `}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option
              key={typeof option === 'string' ? option : option.value}
              value={typeof option === 'string' ? option : option.value}
            >
              {typeof option === 'string' ? option : option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400 pointer-events-none" />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
