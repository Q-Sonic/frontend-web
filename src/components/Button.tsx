import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  fullWidth,
  loading,
  leftIcon,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const base = [
    'inline-flex items-center justify-center gap-2',
    'px-5 py-3 font-semibold text-sm',
    'transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00d4c8]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-[0.98]',
  ].join(' ');

  const variants: Record<string, string> = {
    primary: 'bg-[#00CCCB] text-[#ffffff] shadow-lg shadow-[#00CCCB]/20',
    secondary: 'bg-white/10 text-white hover:bg-white/15 border border-white/10',
    ghost: 'text-white/70 hover:text-white hover:bg-white/10',
    outline: 'bg-transparent text-white border border-white/20 hover:border-white/40 hover:bg-white/5',
  };

  const width = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${width} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </>
      ) : (
        <>
          {leftIcon && <span aria-hidden className="flex-shrink-0">{leftIcon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
