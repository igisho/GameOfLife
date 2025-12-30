import { type ReactNode } from 'react';

import { cn } from '../../lib/cn';

type Props = {
  label: string;
  children: ReactNode;
  sideOffset?: number;
};

export default function Tooltip({ label, children, sideOffset = 8 }: Props) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--panel-border)] px-2 py-1 text-[11px] font-medium text-[var(--text)] opacity-0 shadow-md transition-opacity',
          'bg-[var(--panel)] group-hover:opacity-100'
        )}
        style={{ bottom: `calc(100% + ${sideOffset}px)` }}
      >
        {label}
      </span>
    </span>
  );
}
