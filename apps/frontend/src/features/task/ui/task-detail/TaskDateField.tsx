import { useEffect, useState } from 'react';

interface TaskDateFieldProps {
  /** Date in yyyy-MM-dd form, or empty string when unset. */
  value: string;
  disabled: boolean;
  min?: string;
  /** Shown as a tooltip — explains e.g. why the field is locked. */
  title?: string;
  onCommit: (value: string | null) => void;
}

/**
 * Date input with a local draft. While typing, Chrome reports "" until all
 * segments are filled — committing that immediately would wipe the stored
 * date and the refetch would clear the half-typed input. So: complete dates
 * commit on change, clearing commits only on blur.
 */
export function TaskDateField({ value, disabled, min, title, onCommit }: TaskDateFieldProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  return (
    <input
      type="date"
      disabled={disabled}
      value={draft}
      min={min}
      title={title}
      onChange={(e) => {
        setDraft(e.target.value);
        if (e.target.value && e.target.value !== value) onCommit(e.target.value);
      }}
      onBlur={() => {
        if (!draft && value) onCommit(null);
      }}
      className="rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[13px] outline-none transition-colors hover:border-border focus:border-primary disabled:cursor-not-allowed disabled:text-faint"
    />
  );
}
