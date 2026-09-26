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

export function ProductSpotlight({
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
        <div className="flex h-full min-h-0 flex-col bg-[#f7f8fb]">
            <ShopperHeader branding={branding} onMenu={openMenu} />

            <main className="min-h-0 flex-1 overflow-y-auto pb-4">
                {/* PRODUCT HERO */}
                <section className="bg-white px-4 pb-4 pt-3">
                    <div className="flex min-h-[230px] items-center justify-center overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-50 via-white to-blue-50">
                        {product?.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt=""
                                className="h-[210px] w-full object-contain p-3"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-300">
                                <ImageIcon className="h-12 w-12" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.16em]">
                                    Product image
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="px-1 pt-4">
                        {product?.brandName && (
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                                {product.brandName}
                            </p>
                        )}

                        <h2 className="mt-1 text-[22px] font-black leading-tight tracking-tight text-slate-950">
                            {product?.name ?? "Product information"}
                        </h2>

                        {product?.descriptor && (
                            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                                {product.descriptor}
                            </p>
                        )}
                    </div>
                </section>

                {/* PRODUCT DECISION ACTIONS */}
                <section className="px-4 pt-3">
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={openExplore}
                            className="flex min-h-[70px] flex-col items-center justify-center gap-2 rounded-[18px] bg-white px-2 text-center shadow-sm"
                        >
                            <ImageIcon className="h-4 w-4 text-blue-600" />
                            <span className="text-[9px] font-black text-slate-800">
                                Product info
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={openComparison}
                            className="flex min-h-[70px] flex-col items-center justify-center gap-2 rounded-[18px] bg-white px-2 text-center shadow-sm"
                        >
                            <Scale className="h-4 w-4 text-blue-600" />
                            <span className="text-[9px] font-black text-slate-800">
                                Compare
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={openSuitability}
                            className="flex min-h-[70px] flex-col items-center justify-center gap-2 rounded-[18px] bg-white px-2 text-center shadow-sm"
                        >
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            <span className="text-[9px] font-black text-slate-800">
                                Right for me?
                            </span>
                        </button>
                    </div>
                </section>

                {/* ARI PRODUCT ASSISTANCE */}
                <section className="px-4 pt-3">
                    <div className="rounded-[22px] bg-[#07162f] p-4 text-white shadow-sm">
                        <div className="flex items-center gap-3">
                            <img
                                src="/brand/ari/ari-chat-avatar.png"
                                alt="Ari"
                                className="h-12 w-12 shrink-0 object-contain"
                            />

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <MessageCircle className="h-3.5 w-3.5 text-sky-300" />
                                    <p className="text-[10px] font-black">
                                        Ask Ari about this product
                                    </p>
                                </div>

                                <p className="mt-1 text-[8px] leading-relaxed text-white/60">
                                    Ask a question or get help understanding your options.
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
                    </div>
                </section>
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
