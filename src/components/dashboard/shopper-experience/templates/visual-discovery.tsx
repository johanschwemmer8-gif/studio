"use client";

import { ImageIcon, MessageCircle, Scale, CheckCircle2, Search, Sparkles } from "lucide-react";
import { ShopperHeader } from "../shopper-header";
import { ShopperInput } from "../shopper-input";
import type { ShopperExperienceProps } from "../types";
import { ShopperPresentationController } from "../shopper-presentation-controller";
import { AriSignatureConversation } from "./ari-signature-conversation";
import { AriSignatureComparison } from "./ari-signature-comparison";
import { AriSignatureSuitability } from "./ari-signature-suitability";
import { AriSignatureExploreProduct } from "./ari-signature-explore-product";
import { AriSignatureMenu } from "./ari-signature-menu";
import { AriSignatureDiscover } from "./ari-signature-discover";

export function VisualDiscovery({
    mode,
    branding,
    product,
    ariImageUrl,
    sessionId,
    initialMediaMode = "none",
}: ShopperExperienceProps) {
    const standardExperience = ({
        openConversation,
        openComparison,
        openSuitability,
        openExplore,
        openMenu,
        openDiscover,
    }: {
        openConversation: (
            start?: import("../shopper-presentation-controller").ShopperConversationStart
        ) => void;
        openComparison: () => void;
        openSuitability: () => void;
        openExplore: () => void;
        openMenu: () => void;
        openDiscover: () => void;
    }) => (
        <div className="flex h-full min-h-0 flex-col bg-[#f5f7fb]">
            <ShopperHeader branding={branding} onMenu={openMenu} />

            <main className="min-h-0 flex-1 overflow-y-auto pb-4">
                {/* VISUAL PRODUCT HERO */}
                <button
                    type="button"
                    onClick={openExplore}
                    className="relative block w-full overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-50 text-left"
                >
                    <div className="flex h-[245px] items-center justify-center">
                        {product?.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt=""
                                className="h-full w-full object-contain p-5"
                            />
                        ) : (
                            <ImageIcon className="h-12 w-12 text-slate-300" />
                        )}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent px-4 pb-4 pt-12 text-white">
                        {product?.brandName && (
                            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-sky-300">
                                {product.brandName}
                            </p>
                        )}

                        <p className="mt-1 text-[17px] font-black leading-tight">
                            {product?.name ?? "Explore this product"}
                        </p>

                        {product?.descriptor && (
                            <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-white/70">
                                {product.descriptor}
                            </p>
                        )}
                    </div>
                </button>

                <div className="px-4">
                    {/* DISCOVERY PRIMARY ACTION */}
                    <section className="pt-4">
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-blue-600">
                            Visual Discovery
                        </p>

                        <div className="mt-2 rounded-[20px] bg-[#07162f] p-4 text-white shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                                    <Search className="h-4 w-4 text-sky-300" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-black">
                                        Discover more
                                    </p>
                                    <p className="mt-1 text-[8px] leading-relaxed text-white/60">
                                        Explore available product information and discovery options.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={openDiscover}
                                className="mt-3 w-full rounded-[14px] bg-white px-3 py-2.5 text-[9px] font-black text-slate-950"
                            >
                                Start discovering
                            </button>
                        </div>
                    </section>

                    {/* SUPPORTING ACTIONS */}
                    <section className="mt-3 grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={openExplore}
                            className="rounded-[16px] bg-white px-2 py-3 text-center shadow-sm"
                        >
                            <ImageIcon className="mx-auto h-4 w-4 text-blue-600" />
                            <p className="mt-1.5 text-[8px] font-black text-slate-900">
                                Product
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={openComparison}
                            className="rounded-[16px] bg-white px-2 py-3 text-center shadow-sm"
                        >
                            <Scale className="mx-auto h-4 w-4 text-blue-600" />
                            <p className="mt-1.5 text-[8px] font-black text-slate-900">
                                Compare
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={openSuitability}
                            className="rounded-[16px] bg-white px-2 py-3 text-center shadow-sm"
                        >
                            <Sparkles className="mx-auto h-4 w-4 text-blue-600" />
                            <p className="mt-1.5 text-[8px] font-black text-slate-900">
                                Right for me?
                            </p>
                        </button>
                    </section>

                    {/* ARI ASSISTANCE */}
                    <section className="mt-3 rounded-[20px] bg-white p-3.5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <img
                                src="/brand/ari/ari-chat-avatar.png"
                                alt="Ari"
                                className="h-11 w-11 shrink-0 object-contain"
                            />

                            <div>
                                <p className="text-[10px] font-black text-slate-900">
                                    Ask Ari
                                </p>
                                <p className="mt-0.5 text-[8px] text-slate-500">
                                    What would you like to know?
                                </p>
                            </div>
                        </div>

                        <div className="mt-3">
                            <ShopperInput
                                onSubmit={(initialMessage) =>
                                    openConversation({
                                        intent: "general",
                                        initialMessage,
                                    })
                                }
                            />
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );

    return (
        <ShopperPresentationController
            standardExperience={standardExperience}
            conversationExperience={(
                onMinimize,
                start,
                messages,
                onSubmitMessage,
            ) => (
                <AriSignatureConversation
                    branding={branding}
                    product={product}
                    onMinimize={onMinimize}
                    start={start}
                    messages={messages}
                    onSubmitMessage={onSubmitMessage}
                />
            )}
            comparisonExperience={(onBack) => (
                <AriSignatureComparison
                    mode={mode}
                    branding={branding}
                    product={product}
                    sessionId={sessionId}
                    onBack={onBack}
                />
            )}
            suitabilityExperience={(onBack) => (
                <AriSignatureSuitability
                    branding={branding}
                    product={product}
                    sessionId={sessionId}
                    onBack={onBack}
                />
            )}
            exploreExperience={(onBack) => (
                <AriSignatureExploreProduct
                    branding={branding}
                    product={product}
                    sessionId={sessionId}
                    onBack={onBack}
                />
            )}
            menuExperience={({
                onAskAri,
                onExplore,
                onSuitability,
                onCompare,
                onDiscover,
                onBack,
            }) => (
                <AriSignatureMenu
                    branding={branding}
                    onAskAri={onAskAri}
                    onExplore={onExplore}
                    onSuitability={onSuitability}
                    onCompare={onCompare}
                    onDiscover={onDiscover}
                    onBack={onBack}
                />
            )}
            discoverExperience={({
                onAskAri,
                onExplore,
                onSuitability,
                onCompare,
                onBack,
            }) => (
                <AriSignatureDiscover
                    branding={branding}
                    product={product}
                    sessionId={sessionId}
                    onAskAri={onAskAri}
                    onExplore={onExplore}
                    onSuitability={onSuitability}
                    onCompare={onCompare}
                    onBack={onBack}
                />
            )}
            initialMediaMode={initialMediaMode}
        />
    );
}
