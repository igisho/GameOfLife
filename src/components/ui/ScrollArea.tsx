import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '../../lib/cn';

export default function ScrollArea({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root className={cn('relative w-full min-w-0 overflow-hidden', className)} {...props}>
      <ScrollAreaPrimitive.Viewport className="h-full w-full min-w-0">{children}</ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className="absolute right-1 top-1 bottom-1 flex w-2 touch-none select-none rounded-full bg-transparent p-0.5 transition-colors"
      >
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-white/15" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner className="bg-transparent" />
    </ScrollAreaPrimitive.Root>
  );
}
