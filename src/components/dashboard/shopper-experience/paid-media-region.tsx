"use client";

import { Play, X } from "lucide-react";

type PaidMediaRegionProps = {
    kind: "video" | "brandStrip";
    onExit: () => void;
};

export function PaidMediaRegion({
    kind,
    onExit,
}: PaidMediaRegionProps) {
    if (kind === "video") {
        return (
            <section
                className="relative flex h-full min-h-0 overflow-hidden bg-[#07162f] text-white"
                aria-label="Brand or supplier video preview"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-[#07162f] via-[#0b2851] to-[#135d91]" />

                <div className="relative flex min-w-0 flex-1 items-center gap-3 px-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10">
                        <Play className="ml-0.5 h-4 w-4 fill-current" />
                    </div>

                    <div className="min-w-0">
                        <p className="text-[7px] font-black uppercase tracking-[0.18em] text-sky-300">
                            Brand / Supplier Video
                        </p>

                        <p className="mt-1 text-[11px] font-black leading-tight">
                            Eligible video experience
                        </p>

                        <p className="mt-1 text-[8px] text-white/60">
                            Preview of the reserved ¼-screen media region.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onExit}
                    aria-label="Exit video"
                    className="relative m-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                    <X className="h-4 w-4" />
                </button>
            </section>
        );
    }

    return (
        <section
            className="relative flex h-full min-h-0 items-center overflow-hidden border-t border-blue-100 bg-gradient-to-r from-white via-blue-50 to-sky-50 px-4"
            aria-label="Brand or supplier strip preview"
        >
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-600 px-2 py-1 text-[6px] font-black uppercase tracking-[0.14em] text-white">
                        Brand
                    </span>

                    <p className="truncate text-[9px] font-black text-slate-900">
                        Eligible Brand / Supplier Strip
                    </p>
                </div>

                <p className="mt-1 truncate text-[7px] text-slate-400">
                    Reserved ⅛-screen premium placement
                </p>
            </div>

            <button
                type="button"
                onClick={onExit}
                aria-label="Exit brand strip"
                className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </section>
    );
}
