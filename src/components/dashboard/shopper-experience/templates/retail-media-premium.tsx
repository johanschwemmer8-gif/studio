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

export function RetailMediaPremium({
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
                {/* PREMIUM PRODUCT HERO */}
                <button
                    type="button"
                    onClick={openExplore}
                    className="relative block w-full overflow-hidden bg-[#07162f] text-left"
                >
                    <div className="relative flex min-h-[245px] items-center justify-center">
                        {product?.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt=""
                                className="h-[225px] w-full object-contain p-4"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-white/30">
                                <ImageIcon className="h-12 w-12" />
                                <span className="text-[8px] font-black uppercase tracking-[0.16em]">
                                    Product image
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#07162f] via-[#07162f]/90 to-transparent px-4 pb-4 pt-10">
                        {product?.brandName ? (
                            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-sky-300">
                                {product.brandName}
                            </p>
                        ) : null}

                        <h2 className="mt-1 text-[20px] font-black leading-tight text-white">
                            {product?.name || "Explore this product"}
                        </h2>

                        {product?.descriptor ? (
                            <p className="mt-1 text-[9px] leading-relaxed text-white/65">
                                {product.descriptor}
                            </p>
                        ) : null}
                    </div>
                </button>

                {/* PREMIUM ARI ASSISTANCE */}
                <section className="px-4 pt-4">
                    <div className="rounded-[24px] bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <img
                                src="/brand/ari/ari-chat-avatar.png"
                                alt="Ari"
                                className="h-16 w-16 shrink-0 object-contain"
                            />

                            <div className="min-w-0 flex-1">
                                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-blue-600">
                                    Ari · Shopping Assistant
                                </p>

                                <h3 className="mt-1 text-[17px] font-black leading-tight text-slate-950">
                                    Explore. Compare. Ask.
                                </h3>

                                <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
                                    Get help using the available product information.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SHOPPER ACTIONS */}
                <section className="grid grid-cols-3 gap-2 px-4 pt-3">
                    <button
                        type="button"
                        onClick={openExplore}
                        className="rounded-[18px] bg-white p-3 text-left shadow-sm"
                    >
                        <ImageIcon className="h-4 w-4 text-blue-600" />
                        <p className="mt-2 text-[9px] font-black text-slate-950">
                            Product
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={openComparison}
                        className="rounded-[18px] bg-white p-3 text-left shadow-sm"
                    >
                        <Scale className="h-4 w-4 text-blue-600" />
                        <p className="mt-2 text-[9px] font-black text-slate-950">
                            Compare
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={openSuitability}
                        className="rounded-[18px] bg-white p-3 text-left shadow-sm"
                    >
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        <p className="mt-2 text-[9px] font-black text-slate-950">
                            Right for me?
                        </p>
                    </button>
                </section>

                {/* CONVERSATION ENTRY */}
                <section className="px-4 pt-3">
                    <div className="rounded-[22px] bg-white p-3 shadow-sm">
                        <ShopperInput
                            onSubmit={(message) =>
                                openConversation({
                                    intent: "general",
                                    initialMessage: message,
                                })
                            }
                        />
                    </div>
                </section>

                {/* DISCOVERY ENTRY */}
                <section className="px-4 pt-3">
                    <button
                        type="button"
                        onClick={openDiscover}
                        className="flex w-full items-center justify-between rounded-[20px] bg-[#07162f] px-4 py-3 text-left text-white"
                    >
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sky-300">
                                Discover
                            </p>
                            <p className="mt-0.5 text-[11px] font-black">
                                Explore more
                            </p>
                        </div>

                        <MessageCircle className="h-4 w-4" />
                    </button>
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
