/**
 * Ari interaction state is independent of paid-media allocation.
 * Conversation may therefore expand within whatever viewport remains
 * after authoritative paid-media allocation.
 */
export type AriExperienceMode =
    | "standard"
    | "conversation"
    | "comparison"
    | "suitability"
    | "explore"
    | "menu"
    | "discover";

/**
 * Paid media controls viewport allocation only.
 * Eligibility must come from authoritative QR / Activation /
 * Retail Media configuration in production.
 */
export type PaidMediaMode = "none" | "video" | "brandStrip";

/**
 * Canonical viewport allocation for all shopper-experience templates.
 *
 * Ari interaction state is independent of these allocations:
 * either STANDARD or CONVERSATION may occupy the shopper UI region.
 */
export const PAID_MEDIA_VIEWPORT_ALLOCATION = {
    none: {
        shopperUiPercent: 100,
        paidMediaPercent: 0,
    },
    video: {
        shopperUiPercent: 75,
        paidMediaPercent: 25,
    },
    brandStrip: {
        shopperUiPercent: 87.5,
        paidMediaPercent: 12.5,
    },
} as const;
