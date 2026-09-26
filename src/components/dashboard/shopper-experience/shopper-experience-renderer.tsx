"use client";

import { AriSignature } from "./templates/ari-signature";
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
 * Template 1 is the current production composition.
 * Templates 2-9 deliberately fall back to Ari Signature until their
 * presentation compositions are implemented on top of the shared
 * shopper capability architecture.
 */
export function ShopperExperienceRenderer({
    templateId,
    ...experienceProps
}: ShopperExperienceRendererProps) {
    switch (templateId) {
        case "template1":
            return <AriSignature {...experienceProps} />;

        case "template2":
        case "template3":
        case "template4":
        case "template5":
        case "template6":
        case "template7":
        case "template8":
        case "template9":
            return <AriSignature {...experienceProps} />;

        default: {
            const exhaustiveCheck: never = templateId;
            return exhaustiveCheck;
        }
    }
}
