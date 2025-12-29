import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn } from '../../lib/cn';

type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

export default function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded border border-[var(--control-border)] bg-transparent text-[var(--text)] shadow-sm outline-none focus:ring-2 focus:ring-[var(--primary)] data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)]',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="text-[11px] font-bold leading-none text-[var(--text)]">
        ✓
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
