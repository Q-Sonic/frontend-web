import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { config } from '../utils/config';

interface TopbarProps {
  /** Override app name; defaults to config.APP_NAME */
  appName?: string;
  /** Right slot (e.g. UserMenu, or Login/Register on landing) */
  right?: ReactNode;
  /** Dark theme for landing and app consistency */
  variant?: 'dark' | 'light';
}

export function Topbar({
  appName = config.APP_NAME,
  right,
  variant = 'dark',
}: TopbarProps) {
  const isDark = variant === 'dark';
  const headerClass = isDark
    ? 'bg-neutral-950 border-neutral-800'
    : 'bg-white border-neutral-200';
  const textClass = isDark ? 'text-white' : 'text-neutral-900';
  const logoAccent = 'bg-gradient-to-r from-violet-500 to-blue-600 bg-clip-text text-transparent';
  const displayName = appName.replace(/^Q\s*-?/i, ''); // "Q-Sonic" -> "Sonic"

  return (
    <header
      className={`sticky top-0 z-10 flex items-center justify-between h-14 px-4 border-b ${headerClass}`}
    >
      <Link to="/" className="flex items-baseline gap-1.5">
        <span className={`text-xl font-bold ${logoAccent}`}>Q</span>
        <span className={`text-lg font-semibold ${textClass}`}>-{displayName}</span>
        <span className={`text-xs font-normal ml-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
          {config.APP_TAGLINE}
        </span>
      </Link>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}
