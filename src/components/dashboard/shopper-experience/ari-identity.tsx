import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type AriIdentityProps = {
    imageUrl?: string;
    variant?: 'hero' | 'avatar';
    className?: string;
};

export function AriIdentity({
    imageUrl,
    variant = 'hero',
    className,
}: AriIdentityProps) {
    if (variant === 'avatar') {
        return (
            <div
                className={cn(
                    'relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-sky-100 to-indigo-100 shadow-md',
                    className
                )}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Ari"
                        className="h-full w-full object-cover object-top"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                'relative flex min-h-[180px] items-end justify-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-sky-50 via-white to-blue-100',
                className
            )}
        >
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt="Ari, your shopping assistant"
                    className="h-full w-full object-contain object-bottom"
                />
            ) : (
                <div className="mb-7 flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
                        <Sparkles className="h-7 w-7 text-blue-600" />
                    </div>
                    <p className="mt-3 text-xs font-bold text-slate-700">
                        Ari character asset
                    </p>
                </div>
            )}
        </div>
    );
}
