import {
    ArrowLeft,
    ChevronDown,
    Menu,
    ShoppingBag,
} from "lucide-react";

import type { ShopperExperienceBranding } from "./types";

type ShopperHeaderProps = {
    branding: ShopperExperienceBranding;
    onMenu?: () => void;
    onBack?: () => void;
    onMinimize?: () => void;
};

export function ShopperHeader({
    branding,
    onMenu,
    onBack,
    onMinimize,
}: ShopperHeaderProps) {
    const hasLeadingAction = Boolean(onBack || onMinimize);

    return (
        <header className="relative flex h-[66px] items-center bg-[#07162f] px-4 pt-2 text-white">
            {hasLeadingAction && (
                <button
                    type="button"
                    onClick={onBack ?? onMinimize}
                    aria-label={
                        onBack
                            ? "Back to shopper experience"
                            : "Minimize Ari conversation"
                    }
                    className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08]"
                >
                    {onBack ? (
                        <ArrowLeft className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </button>
            )}

            <div
                className="flex min-w-0 flex-1 items-center"
                style={{
                    justifyContent: branding.logoAlign ?? "flex-start",
                    padding: branding.logoPadding
                        ? `${branding.logoPadding}px`
                        : undefined,
                }}
            >
                {branding.logoUrl ? (
                    <img
                        src={branding.logoUrl}
                        alt="Retailer"
                        style={{
                            width: branding.logoWidth
                                ? `${branding.logoWidth}px`
                                : undefined,
                        }}
                        className="max-h-8 max-w-[145px] object-contain"
                    />
                ) : (
                    <div>
                        <div className="text-[15px] font-black tracking-tight">
                            iNteract
                        </div>
                        <div className="mt-0.5 text-[6px] font-black uppercase tracking-[0.24em] text-sky-300">
                            Point of Decision
                        </div>
                    </div>
                )}
            </div>

            <div className="ml-3 flex shrink-0 items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08]">
                    <ShoppingBag className="h-3.5 w-3.5" />
                </div>

                <button
                    type="button"
                    onClick={onMenu}
                    disabled={!onMenu}
                    aria-label="Open Ari menu"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] disabled:cursor-default"
                >
                    <Menu className="h-4 w-4" />
                </button>
            </div>

            <div className="absolute inset-x-4 bottom-0 h-px bg-white/[0.08]" />
        </header>
    );
}
