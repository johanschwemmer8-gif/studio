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

export function ExpertAdvisor({
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
        <div className="flex h-full min-h-0 flex-col bg-[#f5f7fb]">
            <ShopperHeader branding={branding} onMenu={openMenu} />

            <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
                {/* EXPERT ADVISOR INTRODUCTION */}
                <section>
                    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-blue-600">
                        Expert Advisor
                    </p>

                    <h2 className="mt-1 text-[21px] font-black leading-tight tracking-tight text-slate-950">
                        Get the detail you need.
                    </h2>

                    <p className="mt-1.5 text-[9px] leading-relaxed text-slate-500">
                        Explore available product information, compare options, or ask Ari a specific question.
                    </p>
                </section>

                {/* PRODUCT INFORMATION */}
                <button
                    type="button"
                    onClick={openExplore}
                    className="mt-4 flex w-full items-center gap-3 rounded-[20px] bg-white p-3 text-left shadow-sm"
                >
                    <div className="flex h-[86px] w-[86px] shrink-0 items-center justify-center overflow-hidden rounded-[15px] bg-gradient-to-br from-slate-50 to-blue-50">
                        {product?.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt=""
                                className="h-full w-full object-contain p-2"
                            />
                        ) : (
                            <ImageIcon className="h-7 w-7 text-slate-300" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        {product?.brandName && (
                            <p className="text-[7px] font-black uppercase tracking-[0.15em] text-blue-600">
                                {product.brandName}
                            </p>
                        )}

                        <p className="mt-1 line-clamp-2 text-[12px] font-black leading-tight text-slate-900">
                            {product?.name ?? "Product information"}
                        </p>

                        {product?.descriptor && (
                            <p className="mt-1.5 line-clamp-2 text-[8px] leading-relaxed text-slate-500">
                                {product.descriptor}
                            </p>
                        )}

                        <p className="mt-2 text-[8px] font-black text-blue-700">
                            View available details
                        </p>
                    </div>
                </button>

                {/* DECISION TOOLS */}
                <section className="mt-3 grid grid-cols-2 gap-2.5">
                    <button
                        type="button"
                        onClick={openComparison}
                        className="rounded-[18px] bg-[#07162f] p-3.5 text-left text-white shadow-sm"
                    >
                        <Scale className="h-5 w-5 text-sky-300" />
                        <p className="mt-3 text-[10px] font-black">
                            Compare options
                        </p>
                        <p className="mt-1 text-[8px] leading-relaxed text-white/55">
                            Review supported differences.
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={openSuitability}
                        className="rounded-[18px] bg-white p-3.5 text-left shadow-sm"
                    >
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        <p className="mt-3 text-[10px] font-black text-slate-900">
                            Right for me?
                        </p>
                        <p className="mt-1 text-[8px] leading-relaxed text-slate-500">
                            Explore suitability using available evidence.
                        </p>
                    </button>
                </section>

                {/* EXPERT CONVERSATION */}
                <section className="mt-3 rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <img
                            src="/brand/ari/ari-chat-avatar.png"
                            alt="Ari"
                            className="h-12 w-12 shrink-0 object-contain"
                        />

                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-slate-900">
                                Ask Ari
                            </p>
                            <p className="mt-1 text-[8px] leading-relaxed text-slate-500">
                                Ask a specific question about this product.
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
