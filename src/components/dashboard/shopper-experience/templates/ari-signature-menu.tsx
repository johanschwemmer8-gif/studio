"use client";

import {
    ArrowLeft,
    ArrowRight,
    Compass,
    HelpCircle,
    MessageCircle,
    PackageSearch,
    Scale,
} from "lucide-react";

import type { ShopperExperienceBranding } from "../types";
import { ShopperHeader } from "../shopper-header";

type AriSignatureMenuProps = {
    branding: ShopperExperienceBranding;
    onAskAri: () => void;
    onExplore: () => void;
    onSuitability: () => void;
    onCompare: () => void;
    onDiscover?: () => void;
    onBack: () => void;
};

type MenuActionProps = {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick?: () => void;
    comingSoon?: boolean;
};

function MenuAction({
    title,
    description,
    icon,
    onClick,
    comingSoon = false,
}: MenuActionProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className="flex w-full items-center gap-3 rounded-[18px] bg-white p-3.5 text-left shadow-sm disabled:cursor-default"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-blue-50 text-blue-700">
                {icon}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="text-[11px] font-black text-slate-900">
                        {title}
                    </p>

                    {comingSoon && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[7px] font-black uppercase tracking-wide text-slate-500">
                            Coming soon
                        </span>
                    )}
                </div>

                <p className="mt-0.5 text-[9px] leading-relaxed text-slate-500">
                    {description}
                </p>
            </div>

            {!comingSoon && (
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
            )}
        </button>
    );
}

export function AriSignatureMenu({
    branding,
    onAskAri,
    onExplore,
    onSuitability,
    onCompare,
    onDiscover,
    onBack,
}: AriSignatureMenuProps) {
    return (
        <div className="flex h-full min-h-0 flex-col bg-[#f5f7fb]">
            <ShopperHeader branding={branding} />

            <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-3 inline-flex items-center gap-1.5 text-[9px] font-black text-blue-700"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to product
                </button>

                <section className="rounded-[22px] bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-blue-50">
                            <HelpCircle className="h-5 w-5 text-blue-700" />
                        </div>

                        <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.17em] text-blue-600">
                                Ari
                            </p>

                            <h2 className="mt-1 text-[19px] font-black leading-tight text-slate-950">
                                What can I help you with?
                            </h2>

                            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                                Choose what you&apos;d like to do with this product.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-3 space-y-2">
                    <MenuAction
                        title="Ask Ari"
                        description="Ask a question about this product."
                        icon={<MessageCircle className="h-4.5 w-4.5" />}
                        onClick={onAskAri}
                    />

                    <MenuAction
                        title="Explore this product"
                        description="See reliable information available about this product."
                        icon={<PackageSearch className="h-4.5 w-4.5" />}
                        onClick={onExplore}
                    />

                    <MenuAction
                        title="Is this right for me?"
                        description="Tell Ari what you're looking for and get evidence-bounded guidance."
                        icon={<HelpCircle className="h-4.5 w-4.5" />}
                        onClick={onSuitability}
                    />

                    <MenuAction
                        title="Compare options"
                        description="Compare this product with another option."
                        icon={<Scale className="h-4.5 w-4.5" />}
                        onClick={onCompare}
                    />

                    <MenuAction
                        title="Discover"
                        description="Find relevant content and experiences."
                        icon={<Compass className="h-4.5 w-4.5" />}
                        onClick={onDiscover}
                        comingSoon={!onDiscover}
                    />
                </section>

                <p className="mt-4 px-2 text-center text-[8px] leading-relaxed text-slate-400">
                    Ari keeps your current shopper session and product context
                    while you move between these experiences.
                </p>
            </main>
        </div>
    );
}
