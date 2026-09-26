"use client";

import { AriSignature } from "./templates/ari-signature";
import { ProductSpotlight } from "./templates/product-spotlight";
import { ConversationFirst } from "./templates/conversation-first";
import { CompareAndDecide } from "./templates/compare-and-decide";
import { VisualDiscovery } from "./templates/visual-discovery";
import { ExpertAdvisor } from "./templates/expert-advisor";
import { QuickAssist } from "./templates/quick-assist";
import { BrandImmersive } from "./templates/brand-immersive";
import { RetailMediaPremium } from "./templates/retail-media-premium";
import type {
    ShopperExperienceProps,
    ShopperTemplateId,
} from "./types";

export type ShopperExperienceRendererProps = ShopperExperienceProps & {
    templateId: ShopperTemplateId;
};

/**
 * Canonical shopper-experience composition boundary.
 *
 * ARCHITECTURE:
 * - templateId selects presentation/composition only.
 * - Product identity, shopper-session identity, evidence authority,
 *   Ari capabilities, tenant isolation and Retail Media eligibility
 *   are not determined here.
 * - Preview must not fabricate authoritative runtime identity.
 *
 * Templates 1-9 have dedicated presentation compositions.
 * All compositions operate on top of the shared shopper capability
 * architecture and do not redefine authoritative runtime domains.
 */
export function ShopperExperienceRenderer({
    templateId,
    ...experienceProps
}: ShopperExperienceRendererProps) {
    switch (templateId) {
        case "template1":
            return <AriSignature {...experienceProps} />;

        case "template2":
            return <ProductSpotlight {...experienceProps} />;

        case "template3":
            return <ConversationFirst {...experienceProps} />;

        case "template4":
            return <CompareAndDecide {...experienceProps} />;

        case "template5":
            return <VisualDiscovery {...experienceProps} />;

        case "template6":
            return <ExpertAdvisor {...experienceProps} />;

        case "template7":
            return <QuickAssist {...experienceProps} />;

        case "template8":
            return <BrandImmersive {...experienceProps} />;

        case "template9":
            return <RetailMediaPremium {...experienceProps} />;

        default: {
            const exhaustiveCheck: never = templateId;
            return exhaustiveCheck;
        }
    }
}
