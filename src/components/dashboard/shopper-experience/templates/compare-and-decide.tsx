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

export function CompareAndDecide({
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
                {/* COMPARISON INTRODUCTION */}
                <section>
                    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-blue-600">
                        Compare & Decide
                    </p>

                    <h2 className="mt-1 text-[22px] font-black leading-tight tracking-tight text-slate-950">
                        Compare your options.
                    </h2>

                    <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                        Start with the product in front of you and explore relevant differences.
                    </p>
                </section>

                {/* COMPARISON STARTING POINT */}
                <section className="mt-4 grid grid-cols-2 gap-2.5">
                    <button
                        type="button"
                        onClick={openExplore}
                        className="overflow-hidden rounded-[20px] bg-white p-3 text-left shadow-sm"
                    >
                        <div className="flex h-[110px] items-center justify-center overflow-hidden rounded-[15px] bg-gradient-to-br from-slate-50 to-blue-50">
                            {product?.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt=""
                                    className="h-full w-full object-contain p-2"
                                />
                            ) : (
                                <ImageIcon className="h-8 w-8 text-slate-300" />
                            )}
                        </div>

                        {product?.brandName && (
                            <p className="mt-3 text-[7px] font-black uppercase tracking-[0.15em] text-blue-600">
                                {product.brandName}
                            </p>
                        )}

                        <p className="mt-1 line-clamp-2 text-[11px] font-black leading-tight text-slate-900">
                            {product?.name ?? "Current product"}
                        </p>

                        <p className="mt-2 text-[8px] font-bold text-blue-700">
                            View product
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={openComparison}
                        className="flex min-h-[180px] flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-blue-200 bg-blue-50/60 p-3 text-center"
                    >
                        <Scale className="h-7 w-7 text-blue-600" />

                        <p className="mt-3 text-[10px] font-black text-slate-900">
                            Compare another option
                        </p>

                        <p className="mt-1.5 text-[8px] leading-relaxed text-slate-500">
                            Open Ari&apos;s comparison experience.
                        </p>
                    </button>
                </section>

                {/* DECISION SUPPORT */}
                <button
                    type="button"
                    onClick={openComparison}
                    className="mt-3 flex w-full items-center gap-3 rounded-[18px] bg-[#07162f] px-4 py-3.5 text-left text-white shadow-sm"
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                        <Scale className="h-4 w-4 text-sky-300" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black">
                            Start comparison
                        </p>
                        <p className="mt-0.5 text-[8px] text-white/55">
                            Understand supported differences between options.
                        </p>
                    </div>
                </button>

                {/* ARI DECISION ASSISTANCE */}
                <section className="mt-3 rounded-[20px] bg-white p-3.5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <img
                            src="/brand/ari/ari-chat-avatar.png"
                            alt="Ari"
                            className="h-12 w-12 shrink-0 object-contain"
                        />

                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-slate-900">
                                Need help deciding?
                            </p>
                            <p className="mt-1 text-[8px] leading-relaxed text-slate-500">
                                Ask Ari a question about the product or your decision.
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
