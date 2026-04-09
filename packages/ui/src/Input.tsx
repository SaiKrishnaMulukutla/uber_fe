import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightElement, className = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const errorId = error ? `${props.id ?? props.name}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700" htmlFor={props.id ?? props.name}>
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            {...props}
            ref={ref}
            id={props.id ?? props.name}
            type={inputType}
            aria-describedby={errorId}
            aria-invalid={!!error}
            className={`
              w-full rounded-xl bg-gray-100 border-0
              px-4 py-3 text-sm text-gray-900
              placeholder:text-gray-400
              outline-none ring-0
              focus:ring-2 focus:ring-black/20 focus:bg-white
              transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-10' : ''}
              ${isPassword || rightElement ? 'pr-10' : ''}
              ${error ? 'ring-2 ring-red-400 bg-red-50 focus:ring-red-400' : ''}
              ${className}
            `}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
          {!isPassword && rightElement && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</span>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs text-red-600">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-gray-400">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
