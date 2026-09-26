"use client";

import { ImageIcon, MessageCircle, Scale, CheckCircle2 } from "lucide-react";
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

export function BrandImmersive({
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
        <div className="flex h-full min-h-0 flex-col bg-[#07162f]">
            <ShopperHeader branding={branding} onMenu={openMenu} />

            <main className="min-h-0 flex-1 overflow-y-auto">
                {/* IMMERSIVE HERO */}
                <button
                    type="button"
                    onClick={openExplore}
                    className="relative block min-h-[300px] w-full overflow-hidden bg-slate-100 text-left"
                >
                    {product?.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                            <ImageIcon className="h-14 w-14 text-slate-300" />
                        </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#07162f] via-[#07162f]/80 to-transparent px-5 pb-5 pt-20 text-white">
                        {product?.brandName && (
                            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-sky-300">
                                {product.brandName}
                            </p>
                        )}

                        <h2 className="mt-1 max-w-[280px] text-[22px] font-black leading-tight">
                            {product?.name ?? "Explore this product"}
                        </h2>

                        {product?.descriptor && (
                            <p className="mt-2 max-w-[300px] text-[9px] font-medium leading-relaxed text-slate-200">
                                {product.descriptor}
                            </p>
                        )}

                        <p className="mt-3 text-[8px] font-black text-sky-300">
                            View product information
                        </p>
                    </div>
                </button>

                {/* ARI STORY ASSISTANCE */}
                <section className="px-4 pt-4">
                    <div className="flex items-center gap-3 rounded-[20px] bg-white/10 p-4">
                        <img
                            src="/brand/ari/ari-chat-avatar.png"
                            alt="Ari"
                            className="h-16 w-16 shrink-0 object-contain"
                        />

                        <div className="min-w-0 flex-1">
                            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sky-300">
                                Ask Ari
                            </p>
                            <h3 className="mt-1 text-[15px] font-black leading-tight text-white">
                                Explore what matters to you.
                            </h3>
                            <p className="mt-1 text-[8px] leading-relaxed text-slate-300">
                                Ask a question or explore the available product information.
                            </p>
                        </div>
                    </div>
                </section>

                {/* IMMERSIVE ACTIONS */}
                <section className="grid grid-cols-3 gap-2 px-4 pt-3">
                    <button
                        type="button"
                        onClick={openExplore}
                        className="rounded-[16px] bg-white p-3 text-center"
                    >
                        <ImageIcon className="mx-auto h-5 w-5 text-blue-600" />
                        <p className="mt-2 text-[8px] font-black text-slate-900">
                            Product
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={openComparison}
                        className="rounded-[16px] bg-white p-3 text-center"
                    >
                        <Scale className="mx-auto h-5 w-5 text-blue-600" />
                        <p className="mt-2 text-[8px] font-black text-slate-900">
                            Compare
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={openSuitability}
                        className="rounded-[16px] bg-white p-3 text-center"
                    >
                        <CheckCircle2 className="mx-auto h-5 w-5 text-blue-600" />
                        <p className="mt-2 text-[8px] font-black text-slate-900">
                            Right for me?
                        </p>
                    </button>
                </section>

                {/* CONVERSATION ENTRY */}
                <section className="px-4 pb-3 pt-3">
                    <div className="rounded-[18px] bg-white p-3">
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

                {/* DISCOVERY ENTRY */}
                <div className="px-4 pb-4">
                    <button
                        type="button"
                        onClick={openDiscover}
                        className="w-full rounded-[16px] border border-white/20 px-4 py-3 text-[9px] font-black text-white"
                    >
                        Discover more
                    </button>
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
