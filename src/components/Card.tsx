import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function Card({ title, children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden ${className}`.trim()}
      {...props}
    >
      {title && (
        <div className="px-4 py-3 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
