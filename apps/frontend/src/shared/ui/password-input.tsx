import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { IconInput } from './icon-input';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

/** Password field with a lock icon and a show/hide visibility toggle. */
export function PasswordInput({ error, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const ToggleIcon = visible ? EyeOff : Eye;

  return (
    <IconInput
      icon={Lock}
      type={visible ? 'text' : 'password'}
      error={error}
      trailing={
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="flex items-center p-1 text-faint transition-colors hover:text-muted-foreground"
        >
          <ToggleIcon className="h-4 w-4" />
        </button>
      }
      {...props}
    />
  );
}
