import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../lib/cn';

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

type DangerRange = {
  from: number;
  to: number;
};

type Props = SliderProps & {
  dangerRanges?: DangerRange[];
};

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

export default function Slider({ className, dangerRanges, ...props }: Props) {
  const min = Number.isFinite(props.min) ? (props.min as number) : 0;
  const max = Number.isFinite(props.max) ? (props.max as number) : 100;
  const span = Math.max(1e-9, max - min);

  const segments = (dangerRanges ?? [])
    .map(({ from, to }) => {
      const a = clamp(from, min, max);
      const b = clamp(to, min, max);
      const left = ((Math.min(a, b) - min) / span) * 100;
      const width = (Math.abs(b - a) / span) * 100;
      return { left, width };
    })
    .filter((s) => s.width > 0.25);

  const values = Array.isArray(props.value) ? props.value : [];
  const isDanger =
    values.length > 0 &&
    (dangerRanges ?? []).some((r) => {
      const lo = Math.min(r.from, r.to);
      const hi = Math.max(r.from, r.to);
      return values.some((v) => Number.isFinite(v) && v >= lo && v <= hi);
    });

  return (
    <SliderPrimitive.Root
      className={cn('relative flex w-full touch-none select-none items-center px-2', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[var(--control)]">
        {segments.length > 0 ? (
          <div className="absolute inset-0 z-0">
            {segments.map((s, i) => (
              <span
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                className="absolute top-0 h-full"
                style={{
                  left: `${s.left}%`,
                  width: `${s.width}%`,
                  backgroundColor: 'color-mix(in srgb, var(--danger) 65%, transparent)',
                }}
              />
            ))}
          </div>
        ) : null}
        <SliderPrimitive.Range className="absolute h-full bg-[var(--primary)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          'relative z-20 block h-4 w-4 rounded-full border bg-[var(--text)] shadow transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)]',
          isDanger ? 'border-[var(--danger-border)]' : 'border-[var(--control-border)]'
        )}
      />
    </SliderPrimitive.Root>
  );
}
