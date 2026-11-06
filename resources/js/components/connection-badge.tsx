import { Wifi, WifiOff, type LucideIcon } from 'lucide-react';

import type { ConnectionStatus } from '@/hooks/use-connection';
import { cn } from '@/lib/utils';

interface ConnectionBadgeProps {
    status: ConnectionStatus;
    variant?: 'header' | 'surface';
    className?: string;
}

const meta: Record<ConnectionStatus, { label: string; ikon: LucideIcon; surface: string; header: string }> = {
    stabil: {
        label: 'Stabil',
        ikon: Wifi,
        surface: 'border-tk-success/30 bg-tk-success/10 text-tk-success',
        header: 'border-tk-accent/40 bg-tk-accent/15 text-tk-mint',
    },
    lemah: {
        label: 'Lemah',
        ikon: Wifi,
        surface: 'border-tk-warning/30 bg-tk-warning/10 text-tk-warning',
        header: 'border-tk-warning/50 bg-tk-warning/20 text-tk-warning',
    },
    offline: {
        label: 'Offline',
        ikon: WifiOff,
        surface: 'border-tk-danger/30 bg-tk-danger/10 text-tk-danger',
        header: 'border-tk-danger/50 bg-tk-danger/20 text-white',
    },
};

export default function ConnectionBadge({ status, variant = 'surface', className }: ConnectionBadgeProps) {
    const { label, ikon: Ikon, surface, header } = meta[status];

    return (
        <span
            role="status"
            aria-label={`Kualitas koneksi: ${label}`}
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap',
                variant === 'header' ? header : surface,
                className,
            )}
        >
            <Ikon className="size-3.5" aria-hidden="true" />
            {label}
        </span>
    );
}
