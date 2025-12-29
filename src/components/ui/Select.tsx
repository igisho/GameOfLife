import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '../../lib/cn';

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'inline-flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-[var(--panel-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="opacity-70">▾</SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({ className, children, position = 'popper', ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        className={cn(
          'z-50 max-h-[320px] min-w-[12rem] overflow-hidden rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-1 shadow-lg shadow-black/30',
          className
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex cursor-default select-none items-center rounded-lg px-2 py-2 text-sm outline-none data-[highlighted]:bg-[var(--control)] data-[highlighted]:text-[var(--text)]',
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="ml-auto text-xs opacity-80">✓</SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
