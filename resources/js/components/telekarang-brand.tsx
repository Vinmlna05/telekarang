import { cn } from '@/lib/utils';

const brandGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';

export function BrandMark({ className }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={cn('inline-block size-7 shrink-0 rounded-[9px] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35)]', brandGradient, className)}
        />
    );
}

export default function TelekarangBrand({ className, markClassName }: { className?: string; markClassName?: string }) {
    return (
        <span className={cn('inline-flex items-center gap-2.5 text-xl font-extrabold tracking-[-0.02em]', className)}>
            <BrandMark className={markClassName} />
            TeleKarang
        </span>
    );
}
