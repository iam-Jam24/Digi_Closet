import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  options = [],
  error,
  placeholder = 'Select an option',
  className = '',
  id,
  ...props
}) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className={`field ${className}`}>
      {label && <label htmlFor={selectId} className="field__label">{label}</label>}
      <div className="select__control">
        <select id={selectId} className={`select ${error ? 'select--error' : ''}`} {...props}>
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
        <ChevronDown className="select__chevron" size={16} aria-hidden="true" />
      </div>
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}
