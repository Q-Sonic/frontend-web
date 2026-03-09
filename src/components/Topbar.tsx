import type { ReactNode } from 'react';

interface TopbarProps {
  appName?: string;
  right?: ReactNode;
}

export function Topbar({ appName = 'App', right }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 bg-white border-b border-neutral-200">
      <span className="text-lg font-semibold text-neutral-900">{appName}</span>
      <div className="flex items-center">{right}</div>
    </header>
  );
}
