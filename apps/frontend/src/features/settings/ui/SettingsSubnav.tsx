import { cn } from '@/shared/lib/utils';

export interface SubnavItem<K extends string> {
  key: K;
  label: string;
}

interface SettingsSubnavProps<K extends string> {
  items: readonly SubnavItem<K>[];
  active: K;
  onChange: (key: K) => void;
}

/** Segmented control used to switch between settings sections (General / Members …). */
export function SettingsSubnav<K extends string>({
  items,
  active,
  onChange,
}: SettingsSubnavProps<K>) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-0.5">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={cn(
            'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
            active === item.key
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
