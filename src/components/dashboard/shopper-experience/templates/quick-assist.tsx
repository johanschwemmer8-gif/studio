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

export function QuickAssist({
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
        <div className="flex h-full min-h-0 flex-col bg-white">
            <ShopperHeader branding={branding} onMenu={openMenu} />

            <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
                {/* QUICK PRODUCT CONTEXT */}
                <button
                    type="button"
                    onClick={openExplore}
                    className="flex w-full items-center gap-3 rounded-[18px] bg-slate-50 p-3 text-left"
                >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white">
                        {product?.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt=""
                                className="h-full w-full object-contain p-1.5"
                            />
                        ) : (
                            <ImageIcon className="h-6 w-6 text-slate-300" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        {product?.brandName && (
                            <p className="text-[7px] font-black uppercase tracking-[0.14em] text-blue-600">
                                {product.brandName}
                            </p>
                        )}

                        <p className="mt-0.5 line-clamp-2 text-[11px] font-black leading-tight text-slate-900">
                            {product?.name ?? "Product information"}
                        </p>

                        <p className="mt-1.5 text-[8px] font-bold text-blue-700">
                            View details
                        </p>
                    </div>
                </button>

                {/* QUICK ASSIST INTRO */}
                <section className="mt-4 flex items-center gap-3">
                    <img
                        src="/brand/ari/ari-chat-avatar.png"
                        alt="Ari"
                        className="h-14 w-14 shrink-0 object-contain"
                    />

                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.16em] text-blue-600">
                            Quick Assist
                        </p>
                        <h2 className="mt-0.5 text-[18px] font-black leading-tight text-slate-950">
                            How can I help?
                        </h2>
                    </div>
                </section>

                {/* FAST ACTIONS */}
                <section className="mt-4 grid grid-cols-2 gap-2.5">
                    <button
                        type="button"
                        onClick={() => openConversation({ intent: "general" })}
                        className="rounded-[17px] bg-[#07162f] p-3.5 text-left text-white"
                    >
                        <MessageCircle className="h-5 w-5 text-sky-300" />
                        <p className="mt-2.5 text-[9px] font-black">
                            Ask Ari
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={openExplore}
                        className="rounded-[17px] bg-slate-50 p-3.5 text-left"
                    >
                        <ImageIcon className="h-5 w-5 text-blue-600" />
                        <p className="mt-2.5 text-[9px] font-black text-slate-900">
                            Product info
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={openComparison}
                        className="rounded-[17px] bg-slate-50 p-3.5 text-left"
                    >
                        <Scale className="h-5 w-5 text-blue-600" />
                        <p className="mt-2.5 text-[9px] font-black text-slate-900">
                            Compare
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={openSuitability}
                        className="rounded-[17px] bg-slate-50 p-3.5 text-left"
                    >
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        <p className="mt-2.5 text-[9px] font-black text-slate-900">
                            Right for me?
                        </p>
                    </button>
                </section>

                {/* DIRECT QUESTION */}
                <section className="mt-3 rounded-[18px] border border-slate-200 p-3">
                    <ShopperInput
                        onSubmit={(initialMessage) =>
                            openConversation({
                                intent: "general",
                                initialMessage,
                            })
                        }
                    />
                </section>

                {/* DISCOVERY */}
                <button
                    type="button"
                    onClick={openDiscover}
                    className="mt-3 w-full rounded-[16px] bg-blue-50 px-4 py-3 text-[9px] font-black text-blue-700"
                >
                    Discover more
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
