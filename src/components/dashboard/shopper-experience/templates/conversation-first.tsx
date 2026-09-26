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

export function ConversationFirst({
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
        <div className="flex h-full min-h-0 flex-col bg-[#07162f]">
            <ShopperHeader branding={branding} onMenu={openMenu} />

            <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 text-white">
                {/* ARI CONVERSATION INTRODUCTION */}
                <section className="flex items-center gap-3">
                    <img
                        src="/brand/ari/ari-chat-avatar.png"
                        alt="Ari"
                        className="h-20 w-20 shrink-0 object-contain drop-shadow-md"
                    />

                    <div className="min-w-0 flex-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-sky-300">
                            Ari · Shopping Assistant
                        </p>

                        <h2 className="mt-1 text-[23px] font-black leading-tight tracking-tight">
                            Hi! What can I help you with?
                        </h2>

                        <p className="mt-2 text-[10px] leading-relaxed text-white/60">
                            Ask about the product in front of you or get help with your decision.
                        </p>
                    </div>
                </section>

                {/* SECONDARY PRODUCT CONTEXT */}
                <button
                    type="button"
                    onClick={openExplore}
                    className="mt-4 flex w-full items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.07] p-3 text-left"
                >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white">
                        {product?.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt=""
                                className="h-full w-full object-contain p-1"
                            />
                        ) : (
                            <ImageIcon className="h-5 w-5 text-slate-300" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        {product?.brandName && (
                            <p className="text-[7px] font-black uppercase tracking-[0.16em] text-sky-300">
                                {product.brandName}
                            </p>
                        )}

                        <p className="mt-0.5 truncate text-[11px] font-black text-white">
                            {product?.name ?? "Product context"}
                        </p>

                        <p className="mt-1 text-[8px] text-white/45">
                            View product information
                        </p>
                    </div>
                </button>

                {/* CONVERSATION STARTERS */}
                <section className="mt-4">
                    <p className="mb-2 text-[8px] font-black uppercase tracking-[0.18em] text-white/40">
                        How can Ari help?
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => openConversation({ intent: "general" })}
                            className="rounded-full bg-white px-3 py-2 text-[9px] font-black text-slate-900"
                        >
                            Ask a question
                        </button>

                        <button
                            type="button"
                            onClick={openComparison}
                            className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-2 text-[9px] font-black text-white"
                        >
                            Compare options
                        </button>

                        <button
                            type="button"
                            onClick={openSuitability}
                            className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-2 text-[9px] font-black text-white"
                        >
                            Is this right for me?
                        </button>
                    </div>
                </section>

                {/* PRIMARY CONVERSATION */}
                <section className="mt-4 rounded-[22px] bg-white p-3.5 text-slate-900 shadow-lg">
                    <div className="flex items-start gap-2.5">
                        <img
                            src="/brand/ari/ari-chat-avatar.png"
                            alt="Ari"
                            className="h-10 w-10 shrink-0 object-contain"
                        />

                        <div className="min-w-0 flex-1 rounded-[16px] rounded-tl-[5px] bg-[#eaf3ff] px-3 py-2.5">
                            <p className="text-[8px] font-black text-blue-700">
                                Ari
                            </p>
                            <p className="mt-1 text-[10px] font-semibold leading-relaxed text-slate-700">
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
