import { Eye, EyeOff } from 'lucide-react';
import { ReactNode, useState } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const authInputClass =
    'h-11 rounded-xl border-black/10 bg-[#F7FAF8] px-3.5 text-sm text-tk-deep placeholder:text-[var(--tk-muted)] focus-visible:ring-2 focus-visible:ring-tk-accent focus-visible:ring-offset-0 dark:border-white/[0.18] dark:bg-white/[0.08] dark:text-white dark:placeholder:text-white/40';

interface PasswordFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    autoComplete: string;
    placeholder: string;
    disabled: boolean;
    tabIndex: number;
    hint?: string;
    minLength?: number;
    autoFocus?: boolean;
    action?: ReactNode;
}

export default function PasswordField({
    id,
    label,
    value,
    onChange,
    error,
    autoComplete,
    placeholder,
    disabled,
    tabIndex,
    hint,
    minLength,
    autoFocus = false,
    action,
}: PasswordFieldProps) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
                <Label htmlFor={id}>{label}</Label>
                {action}
            </div>
            <div className="relative">
                <Input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    required
                    minLength={minLength}
                    autoFocus={autoFocus}
                    tabIndex={tabIndex}
                    autoComplete={autoComplete}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={cn(authInputClass, 'pr-12')}
                />
                <button
                    type="button"
                    onClick={() => setVisible((current) => !current)}
                    aria-label={visible ? `Sembunyikan ${label}` : `Tampilkan ${label}`}
                    aria-pressed={visible}
                    className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-full text-[var(--tk-muted)] transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                >
                    {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </button>
            </div>
            {hint && <p className="text-xs text-[var(--tk-muted)]">{hint}</p>}
            <InputError message={error} className="text-tk-danger" />
        </div>
    );
}
