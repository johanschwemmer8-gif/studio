"use client";

import { AriIdentity } from "../ari-identity";
import { ProductCard } from "../product-card";
import { ShopperActions } from "../shopper-actions";
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

export function AriSignature({
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
            <ShopperHeader
                branding={branding}
                onMenu={openMenu}
            />

            <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
                {/* ARI INTRODUCTION */}
                <section className="relative overflow-hidden rounded-[1.75rem] bg-white shadow-sm">
                    <div className="grid grid-cols-[0.9fr_1.1fr] items-end">
                        <AriIdentity
                            imageUrl={ariImageUrl}
                            className="min-h-[176px] rounded-none bg-gradient-to-br from-sky-50 to-blue-100"
                        />

                        <div className="px-3 pb-4 pt-5">
                            <div className="mb-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-blue-700">
                                Ari · Shopping Assistant
                            </div>

                            <h2 className="text-[22px] font-black leading-[1.05] tracking-tight text-slate-950">
                                Hi! I&apos;m Ari.
                            </h2>

                            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                                Ask me about this product, compare options or get help
                                choosing what&apos;s right for you.
                            </p>
                        </div>
                    </div>
                </section>

                {/* PRODUCT CONTEXT */}
                <div className="mt-2.5">
                    <ProductCard
                        product={product}
                        onExplore={openExplore}
                    />
                </div>

                {/* DECISION TOOLS */}
                <div className="mt-2.5">
                    <ShopperActions
                        onAskAri={() =>
                            openConversation({ intent: "general" })
                        }
                        onCompare={openComparison}
                        onSuitability={openSuitability}
                    />
                </div>

                {/* ARI CONVERSATION */}
                <section className="mt-2.5">
                    <div className="flex items-start gap-2">
                        <img
                            src="/brand/ari/ari-chat-avatar.png"
                            alt="Ari"
                            className="mt-1 h-12 w-12 shrink-0 object-contain drop-shadow-sm"
                        />

                        <div className="min-w-0 flex-1">
                            <div className="mb-2 rounded-[18px] rounded-tl-[6px] bg-[#eaf3ff] px-3.5 py-2.5">
                                <div className="mb-0.5 flex items-center gap-1.5">
                                    <span className="text-[9px] font-black text-blue-700">
                                        Ari
                                    </span>
                                    <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                    <span className="text-[7px] font-bold text-slate-400">
                                        Ready to help
                                    </span>
                                </div>

                                <p className="text-[10px] font-semibold leading-[1.45] text-slate-700">
                                    What would you like to know about this product?
                                </p>
                            </div>

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

                {/* CONTEXTUAL EXPERIENCE PREVIEW */}
                <button
                    type="button"
                    onClick={openDiscover}
                    className="mt-2.5 w-full overflow-hidden rounded-[18px] border border-blue-100 bg-gradient-to-r from-white to-blue-50 px-3.5 py-3 text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                            <span className="text-sm text-blue-700">✦</span>
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-blue-600">
                                Discover
                            </p>

                            <p className="mt-0.5 text-[10px] font-black leading-tight text-slate-800">
                                More when it&apos;s useful to you.
                            </p>

                            <p className="mt-0.5 text-[8px] leading-tight text-slate-400">
                                Relevant content can appear here when eligible.
                            </p>
                        </div>

                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                            <span className="text-sm text-blue-700">→</span>
                        </div>
                    </div>
                </button>
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
