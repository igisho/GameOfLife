import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../lib/cn';

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

export default function Slider({ className, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[var(--control)]">
        <SliderPrimitive.Range className="absolute h-full bg-[var(--primary)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-[var(--control-border)] bg-[var(--text)] shadow transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
    </SliderPrimitive.Root>
  );
}
