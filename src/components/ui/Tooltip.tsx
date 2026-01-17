import { type ReactNode } from 'react';

import { cn } from '../../lib/cn';

type Props = {
  label: string;
  children: ReactNode;
  sideOffset?: number;
  /** Default: top */
  side?: 'top' | 'bottom';
};

export default function Tooltip({ label, children, sideOffset = 8, side = 'top' }: Props) {
  const offset = 'calc(100% + ' + sideOffset + 'px)';

  const style =
    side === 'bottom'
      ? { top: offset, bottom: 'auto' as const }
      : { bottom: offset, top: 'auto' as const };

  return (
    <span className="relative inline-flex group overflow-visible">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 max-w-[520px] whitespace-normal rounded-xl border border-[var(--panel-border)] px-3 py-2 text-[11px] font-medium leading-4 text-[var(--text)] opacity-0 shadow-md transition-opacity',
          'bg-[var(--panel)] group-hover:opacity-100'
        )}
        style={style}
      >
        {label}
      </span>
    </span>
  );
}
