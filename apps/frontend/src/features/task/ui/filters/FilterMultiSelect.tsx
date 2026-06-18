import { useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useClickOutside } from '@/shared/hooks/use-click-outside';

interface FilterMultiSelectProps<T extends string> {
  label: string;
  options: Array<{ value: T; label: string }>;
  selected: T[];
  onChange: (selected: T[]) => void;
}

/** Compact checkbox-dropdown used by the task filters toolbar. */
export function FilterMultiSelect<T extends string>({
  label,
  options,
  selected,
  onChange,
}: FilterMultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setOpen(false));

  const toggle = (value: T) =>
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );

  const isActive = selected.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors',
          isActive
            ? 'border-primary/40 bg-primary/5 text-primary'
            : 'border-border text-muted-foreground hover:text-foreground',
        )}
      >
        {label}
        {isActive && (
          <span className="rounded-full bg-primary px-1.5 text-[10.5px] font-bold text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-44 rounded-xl border border-border bg-white p-1 shadow-lg">
          {options.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-muted/60"
              >
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border-[1.5px] transition-colors',
                    checked ? 'border-primary bg-primary text-white' : 'border-border',
                  )}
                >
                  {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
