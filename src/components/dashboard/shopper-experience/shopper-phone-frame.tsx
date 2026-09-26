import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ShopperPhoneFrameProps = {
    children: ReactNode;
    className?: string;
    screenClassName?: string;
};

export function ShopperPhoneFrame({
    children,
    className,
    screenClassName,
}: ShopperPhoneFrameProps) {
    return (
        <div
            className={cn(
                'relative mx-auto w-full max-w-[390px] rounded-[3rem] bg-slate-950 p-[7px] shadow-2xl',
                className
            )}
        >
            <div
                aria-hidden="true"
                className="absolute left-1/2 top-[11px] z-30 h-[24px] w-[108px] -translate-x-1/2 rounded-full bg-slate-950"
            />
            <div
                className={cn(
                    'relative aspect-[390/844] overflow-hidden rounded-[2.55rem] bg-white',
                    screenClassName
                )}
            >
                {children}
            </div>
        </div>
    );
}
