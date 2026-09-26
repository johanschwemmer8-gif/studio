"use client";

import {
    ArrowLeft,
    ArrowRight,
    HelpCircle,
    MessageCircle,
    PackageSearch,
    Scale,
    Sparkles,
} from "lucide-react";

import { ShopperHeader } from "../shopper-header";
import type {
    ShopperExperienceBranding,
    ShopperExperienceProduct,
} from "../types";

type AriSignatureDiscoverProps = {
    branding: ShopperExperienceBranding;
    product?: ShopperExperienceProduct;
    sessionId?: string;
    onAskAri: () => void;
    onExplore: () => void;
    onSuitability: () => void;
    onCompare: () => void;
    onBack: () => void;
};

type DiscoveryActionProps = {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
};

function DiscoveryAction({
    title,
    description,
    icon,
    onClick,
}: DiscoveryActionProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-[18px] border border-slate-100 bg-white p-3.5 text-left shadow-sm transition hover:border-blue-100 hover:bg-blue-50/30"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-blue-50 text-blue-700">
                {icon}
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black text-slate-900">
                    {title}
                </p>

                <p className="mt-0.5 text-[9px] leading-relaxed text-slate-500">
                    {description}
                </p>
            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
        </button>
    );
}

export function AriSignatureDiscover({
    branding,
    product,
    sessionId,
    onAskAri,
    onExplore,
    onSuitability,
    onCompare,
    onBack,
}: AriSignatureDiscoverProps) {
    const productName = product?.name?.trim();

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

                <section className="overflow-hidden rounded-[22px] bg-[#07162f] p-4 text-white shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/10 text-sky-300">
                            <Sparkles className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-[8px] font-black uppercase tracking-[0.17em] text-sky-300">
                                Discover
                            </p>

                            <h2 className="mt-1 text-[19px] font-black leading-tight">
                                Find what&apos;s useful next.
                            </h2>

                            <p className="mt-1.5 text-[10px] leading-relaxed text-white/60">
                                {productName
                                    ? `Explore useful ways to understand ${productName}.`
                                    : "Explore useful ways to understand this product."}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-3 space-y-2">
                    <DiscoveryAction
                        title="Explore product information"
                        description="See product information Ari can support with reliable evidence."
                        icon={<PackageSearch className="h-4.5 w-4.5" />}
                        onClick={onExplore}
                    />

                    <DiscoveryAction
                        title="See if it fits your needs"
                        description="Tell Ari what matters to you and check what the evidence supports."
                        icon={<HelpCircle className="h-4.5 w-4.5" />}
                        onClick={onSuitability}
                    />

                    <DiscoveryAction
                        title="Compare another option"
                        description="Compare this product with another product without leaving your current shopper context."
                        icon={<Scale className="h-4.5 w-4.5" />}
                        onClick={onCompare}
                    />

                    <DiscoveryAction
                        title="Ask Ari"
                        description="Ask your own question about this product."
                        icon={<MessageCircle className="h-4.5 w-4.5" />}
                        onClick={onAskAri}
                    />
                </section>

                <section className="mt-3 rounded-[18px] border border-slate-200 bg-white px-3.5 py-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">
                        Discovery integrity
                    </p>

                    <p className="mt-1 text-[8px] leading-relaxed text-slate-400">
                        Ari only presents available experiences and supported
                        product information. Sponsored content, when eligible,
                        is identified separately.
                    </p>
                </section>

                {!sessionId?.trim() && (
                    <p className="mt-3 px-2 text-center text-[8px] leading-relaxed text-slate-400">
                        Some product-specific discovery experiences require an
                        active shopper session.
                    </p>
                )}
            </main>
        </div>
    );
}
