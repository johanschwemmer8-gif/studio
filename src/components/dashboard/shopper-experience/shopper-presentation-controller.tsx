"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { PaidMediaRegion } from "./paid-media-region";
import type {
    AriExperienceMode,
    PaidMediaMode,
} from "./presentation-state";

export type ShopperConversationIntent = "general";

export type ShopperConversationStart = {
    intent: ShopperConversationIntent;
    initialMessage?: string;
};

export interface ShopperPresentationControllerProps {
    standardExperience: (actions: {
        openConversation: (start?: ShopperConversationStart) => void;
        openComparison: () => void;
        openSuitability: () => void;
        openExplore: () => void;
        openMenu: () => void;
        openDiscover: () => void;
    }) => ReactNode;
    conversationExperience: (
        onMinimize: () => void,
        start: ShopperConversationStart,
        messages: string[],
        onSubmitMessage: (message: string) => void,
    ) => ReactNode;
    comparisonExperience: (onBack: () => void) => ReactNode;
    suitabilityExperience: (onBack: () => void) => ReactNode;
    exploreExperience: (onBack: () => void) => ReactNode;
    menuExperience: (actions: {
        onAskAri: () => void;
        onExplore: () => void;
        onSuitability: () => void;
        onCompare: () => void;
        onDiscover: () => void;
        onBack: () => void;
    }) => ReactNode;
    discoverExperience: (actions: {
        onAskAri: () => void;
        onExplore: () => void;
        onSuitability: () => void;
        onCompare: () => void;
        onBack: () => void;
    }) => ReactNode;

    /**
     * PREVIEW / INTEGRATION INPUT.
     *
     * In production this value must be derived from authoritative
     * QR / Activation / Retail Media eligibility.
     *
     * The controller does not determine media eligibility.
     */
    initialMediaMode?: PaidMediaMode;
}

export function ShopperPresentationController({
    standardExperience,
    conversationExperience,
    comparisonExperience,
    suitabilityExperience,
    exploreExperience,
    menuExperience,
    discoverExperience,
    initialMediaMode = "none",
}: ShopperPresentationControllerProps) {
    const [ariMode, setAriMode] =
        useState<AriExperienceMode>("standard");

    const [conversationStart, setConversationStart] =
        useState<ShopperConversationStart>({
            intent: "general",
        });

    const [conversationMessages, setConversationMessages] =
        useState<string[]>([]);

    const [mediaMode, setMediaMode] =
        useState<PaidMediaMode>(initialMediaMode);

    const openConversation = (
        start: ShopperConversationStart = { intent: "general" },
    ) => {
        setConversationStart(start);

        const initialMessage = start.initialMessage?.trim();

        if (initialMessage) {
            setConversationMessages((current) => [
                ...current,
                initialMessage,
            ]);
        }

        setAriMode("conversation");
    };

    const submitConversationMessage = (message: string) => {
        const trimmed = message.trim();

        if (!trimmed) {
            return;
        }

        setConversationMessages((current) => [
            ...current,
            trimmed,
        ]);
    };

    const minimizeConversation = () => {
        setAriMode("standard");
    };

    const openComparison = () => {
        setAriMode("comparison");
    };

    const openSuitability = () => {
        setAriMode("suitability");
    };

    const openExplore = () => {
        setAriMode("explore");
    };

    const openMenu = () => {
        setAriMode("menu");
    };

    const openDiscover = () => {
        setAriMode("discover");
    };

    const returnToStandard = () => {
        setAriMode("standard");
    };

    const exitPaidMedia = () => {
        setMediaMode("none");
    };

    const ariExperience =
        ariMode === "conversation"
            ? conversationExperience(
                  minimizeConversation,
                  conversationStart,
                  conversationMessages,
                  submitConversationMessage,
              )
            : ariMode === "comparison"
              ? comparisonExperience(returnToStandard)
              : ariMode === "suitability"
                ? suitabilityExperience(returnToStandard)
                : ariMode === "explore"
                  ? exploreExperience(returnToStandard)
                  : ariMode === "menu"
                    ? menuExperience({
                          onAskAri: () =>
                              openConversation({ intent: "general" }),
                          onExplore: openExplore,
                          onSuitability: openSuitability,
                          onCompare: openComparison,
                          onDiscover: openDiscover,
                          onBack: returnToStandard,
                      })
                    : ariMode === "discover"
                      ? discoverExperience({
                            onAskAri: () =>
                                openConversation({ intent: "general" }),
                            onExplore: openExplore,
                            onSuitability: openSuitability,
                            onCompare: openComparison,
                            onBack: returnToStandard,
                        })
                      : standardExperience({
                            openConversation,
                            openComparison,
                            openSuitability,
                            openExplore,
                            openMenu,
                            openDiscover,
                        });

    /*
     * The controller owns viewport allocation.
     *
     * Paid media and Ari interaction are independent:
     *
     * standard/conversation + none       = 100% Ari
     * standard/conversation + video      = 75% Ari / 25% media
     * standard/conversation + brandStrip = 87.5% Ari / 12.5% media
     */

    if (mediaMode === "video") {
        return (
            <div
                className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f5f7fb]"
                data-shopper-presentation="video"
            >
                <div
                    className="min-h-0 overflow-hidden"
                    style={{ height: "75%" }}
                >
                    <div className="h-full">
                        {ariExperience}
                    </div>
                </div>

                <div
                    className="min-h-0 shrink-0"
                    style={{ height: "25%" }}
                >
                    <PaidMediaRegion
                        kind="video"
                        onExit={exitPaidMedia}
                    />
                </div>
            </div>
        );
    }

    if (mediaMode === "brandStrip") {
        return (
            <div
                className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f5f7fb]"
                data-shopper-presentation="brandStrip"
            >
                <div
                    className="min-h-0 overflow-hidden"
                    style={{ height: "87.5%" }}
                >
                    <div className="h-full">
                        {ariExperience}
                    </div>
                </div>

                <div
                    className="min-h-0 shrink-0"
                    style={{ height: "12.5%" }}
                >
                    <PaidMediaRegion
                        kind="brandStrip"
                        onExit={exitPaidMedia}
                    />
                </div>
            </div>
        );
    }

    return (
        <div
            className="h-full"
            data-shopper-presentation="none"
        >
            {ariExperience}
        </div>
    );
}
