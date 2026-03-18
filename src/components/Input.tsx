import { useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  showPasswordToggle?: boolean;
  /** Icon node rendered on the left side of the input */
  icon?: ReactNode;
  /** Show a success state (green border) when true */
  success?: boolean;
}

/* ── Eye icons ── */
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export function Input({
  label,
  error,
  hint,
  id,
  className = '',
  type,
  showPasswordToggle,
  icon,
  success,
  disabled,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const isPasswordField = type === 'password';
  const useToggle = showPasswordToggle && isPasswordField;
  const inputType = useToggle ? (showPassword ? 'text' : 'password') : type;

  /* ── Border/ring state ── */
  const borderState = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
    : success
    ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20'
    : 'border-white/10 focus:border-[#00d4c8] focus:ring-[#00d4c8]/20';

  const inputBase = [
    'w-full bg-[#1a1d24] text-white placeholder:text-white/25',
    'rounded-lg border py-3 px-4',
    'text-sm leading-5',
    'outline-none ring-0 focus:ring-2 transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    borderState,
    icon ? 'pl-10' : '',
    useToggle ? 'pr-10' : '',
    className,
  ].filter(Boolean).join(' ');

  const inputEl = (
    <input
      id={inputId}
      type={inputType}
      disabled={disabled}
      className={inputBase}
      aria-invalid={!!error}
      aria-describedby={
        error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
      }
      onFocus={(e) => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
      {...props}
    />
  );

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className={`text-sm font-medium transition-colors duration-150 ${
            isFocused ? 'text-[#00d4c8]' : error ? 'text-red-400' : 'text-white/60'
          }`}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {/* Left icon */}
        {icon && (
          <span
            className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150 ${
              isFocused ? 'text-[#00d4c8]' : error ? 'text-red-400' : 'text-white/30'
            }`}
          >
            {icon}
          </span>
        )}

        {useToggle ? (
          <>
            {inputEl}
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 focus:outline-none transition-colors duration-150"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </>
        ) : (
          inputEl
        )}
      </div>

      {/* Error message */}
      {error && (
        <p
          id={`${inputId}-error`}
          className="flex items-center gap-1 text-xs text-red-400 animate-[fadeSlideIn_0.2s_ease]"
          role="alert"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.75a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5zm.75 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
          {error}
        </p>
      )}

      {/* Hint message (shown when no error) */}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="text-xs text-white/35">
          {hint}
        </p>
      )}
    </div>
  );
}
