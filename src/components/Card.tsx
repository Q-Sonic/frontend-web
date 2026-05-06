import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  variant?: 'light' | 'dark';
}

export function Card({ title, children, className = '', variant = 'light', ...props }: CardProps) {
  const isDark = variant === 'dark';
  const rootClass = isDark
    ? 'rounded-lg border border-neutral-700 bg-neutral-900/50 shadow-sm overflow-hidden'
    : 'rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden';
  const titleBorderClass = isDark ? 'border-neutral-700' : 'border-neutral-200';
  const titleTextClass = isDark ? 'text-white' : 'text-neutral-900';

  return (
    <div className={`${rootClass} ${className}`.trim()} {...props}>
      {title && (
        <div className={`px-4 py-3 border-b ${titleBorderClass}`}>
          <h2 className={`text-lg font-semibold ${titleTextClass}`}>{title}</h2>
        </div>
      )}
      <div className={`p-4 ${isDark ? 'text-neutral-300' : ''}`}>{children}</div>
    </div>
  );
}
