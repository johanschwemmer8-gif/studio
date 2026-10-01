import type { PaidMediaMode } from "./presentation-state";

export type ShopperExperienceMode = 'preview' | 'live';

export type ShopperConversationMessage = {
    role: 'user' | 'model';
    content: string;
};

export type ShopperExperienceProduct = {
    name: string;
    descriptor?: string;
    imageUrl?: string;
    brandName?: string;

    /**
     * Authoritative product identity when available.
     * Presentation code must never invent this value.
     */
    gtin?: string;
};

export type ShopperExperienceAriPresentation = {
    /**
     * Shopper-facing retailer-configurable assistant display name.
     *
     * This does not replace Ari's canonical platform identity and must not
     * be used as governance, capability, provider or model authority.
     */
    assistantName: string;

    /**
     * Shopper-facing retailer-configurable welcome message.
     *
     * This is presentation content only and is not authoritative product
     * evidence or an executable model instruction.
     */
    welcomeMessage: string;
};

export type ShopperExperienceBranding = {
    logoUrl?: string;
    logoWidth?: number;
    logoMaxHeight?: number;
    logoAlign?: 'flex-start' | 'center' | 'flex-end';
    logoPadding?: number;
    headerBackgroundColor?: string;
};

export type ShopperExperienceProps = {
    mode: ShopperExperienceMode;
    branding: ShopperExperienceBranding;
    ariPresentation?: ShopperExperienceAriPresentation;
    product?: ShopperExperienceProduct;
    ariImageUrl?: string;

    /**
     * Authoritative context of the shopper's current primary experience.
     *
     * These values are identity/context inputs, not presentation branding.
     * Preview may omit them. Live runtime must derive them from the
     * authoritative QR / Activation shopper-entry chain.
     */
    retailerId?: string;
    activationId?: string;

    /**
     * Existing anonymous shopper session established by a qualifying
     * interaction. This is authoritative session identity for live shopper
     * tools such as Compare. Preview mode must not fabricate this value.
     */
    sessionId?: string;

    /**
     * Presentation input only.
     *
     * Preview may simulate this value.
     * Live runtime must derive it from authoritative
     * QR / Activation / Retail Media eligibility.
     */
    initialMediaMode?: PaidMediaMode;

    /**
     * Live Ari conversation adapter.
     *
     * Preview may omit this callback and remain presentation-only.
     * Live runtime supplies it from the authoritative QR shopper boundary.
     */
    onSubmitConversationMessage?: (
        message: string,
        history: ShopperConversationMessage[],
    ) => Promise<string>;
};

export type ShopperTemplateId =
    | 'template1'
    | 'template2'
    | 'template3'
    | 'template4'
    | 'template5'
    | 'template6'
    | 'template7'
    | 'template8'
    | 'template9';
