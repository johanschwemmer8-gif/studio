"use client";

import { useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    MessageCircle,
    ShieldAlert,
} from "lucide-react";

import { assessProductSuitability } from "@/ai/flows/assess-product-suitability";

import type {
    ShopperExperienceBranding,
    ShopperExperienceProduct,
} from "../types";
import { ShopperHeader } from "../shopper-header";

type SuitabilityResult = Awaited<
    ReturnType<typeof assessProductSuitability>
>;

type AriSignatureSuitabilityProps = {
    branding: ShopperExperienceBranding;
    product?: ShopperExperienceProduct;
    sessionId?: string;
    onBack: () => void;
};

export function AriSignatureSuitability({
    branding,
    product,
    sessionId,
    onBack,
}: AriSignatureSuitabilityProps) {
    const [requirement, setRequirement] = useState("");
    const [result, setResult] = useState<SuitabilityResult | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    const canAssess = Boolean(sessionId);

    async function handleAssessment() {
        const trimmedRequirement = requirement.trim();

        if (!trimmedRequirement || !sessionId || isChecking) {
            return;
        }

        setIsChecking(true);
        setResult(null);

        try {
            const assessment = await assessProductSuitability({
                sessionId,
                requirement: trimmedRequirement,
            });

            setResult(assessment);
        } catch {
            setResult({
                success: false,
                code: "EVIDENCE_UNAVAILABLE",
                message:
                    "Ari could not check the available product information right now.",
            });
        } finally {
            setIsChecking(false);
        }
    }

    const successfulResult =
        result?.success === true ? result : null;

    const outcome = successfulResult?.result.outcome;

    const outcomeHeading =
        outcome === "SUPPORTED"
            ? "This looks like a match"
            : outcome === "NOT_SUPPORTED"
              ? "This may not meet what you need"
              : outcome === "INSUFFICIENT_EVIDENCE"
                ? "I can’t confirm that yet"
                : null;

    return (
        <div className="flex h-full min-h-0 flex-col bg-[#f5f7fb]">
            <ShopperHeader
                branding={branding}
                onBack={onBack}
            />

            <section className="shrink-0 bg-[#07162f] px-4 pb-4 pt-3 text-white">
                <p className="text-[7px] font-black uppercase tracking-[0.18em] text-sky-300">
                    Guided Suitability
                </p>

                <h2 className="mt-1 text-[18px] font-black leading-tight">
                    Is this right for me?
                </h2>
            </section>

            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <section className="rounded-[20px] bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-[7px] font-black uppercase tracking-[0.15em] text-emerald-600">
                                Evaluating
                            </p>

                            <p className="truncate text-[12px] font-black text-slate-900">
                                {product?.name ?? "Selected product"}
                            </p>

                            {product?.brandName ? (
                                <p className="mt-0.5 text-[8px] text-slate-400">
                                    {product.brandName}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="mt-3 rounded-[20px] bg-[#eaf3ff] p-5">
                    <div className="flex items-start gap-3">
                        <img
                            src="/brand/ari/ari-chat-avatar.png"
                            alt="Ari"
                            className="h-11 w-11 shrink-0 object-contain"
                        />

                        <div>
                            <p className="text-[11px] font-black text-slate-900">
                                What matters most to you when choosing this product?
                            </p>

                            <p className="mt-1.5 text-[9px] leading-[1.5] text-slate-600">
                                Tell me what you need, and I’ll check it against the product information available to me.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-3 rounded-[20px] border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-blue-600" />

                        <p className="text-[10px] font-black text-slate-900">
                            What do you need?
                        </p>
                    </div>

                    <textarea
                        value={requirement}
                        onChange={(event) => {
                            setRequirement(event.target.value);
                            setResult(null);
                        }}
                        disabled={!canAssess || isChecking}
                        rows={3}
                        placeholder="For example: I need something waterproof for hiking."
                        className="mt-3 w-full resize-none rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-3 text-[10px] leading-[1.5] text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                        type="button"
                        onClick={handleAssessment}
                        disabled={
                            !canAssess ||
                            !requirement.trim() ||
                            isChecking
                        }
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#07162f] px-4 py-3 text-[10px] font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isChecking ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Checking product information…
                            </>
                        ) : (
                            "Check suitability"
                        )}
                    </button>

                    {!canAssess ? (
                        <div className="mt-3 flex items-start gap-2 rounded-[14px] bg-amber-50 p-3">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                            <p className="text-[9px] leading-[1.5] text-amber-800">
                                Live suitability checking is available from an active shopper session.
                            </p>
                        </div>
                    ) : null}
                </section>

                {result?.success === false ? (
                    <section className="mt-3 rounded-[20px] border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                            <div>
                                <p className="text-[10px] font-black text-slate-900">
                                    I couldn’t complete that check
                                </p>

                                <p className="mt-1.5 text-[9px] leading-[1.5] text-slate-600">
                                    {result.message}
                                </p>
                            </div>
                        </div>
                    </section>
                ) : null}

                {successfulResult ? (
                    <section className="mt-3 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            {outcome === "SUPPORTED" ? (
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                            ) : (
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                            )}

                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-slate-900">
                                    {outcomeHeading}
                                </p>

                                <p className="mt-1.5 text-[9px] leading-[1.6] text-slate-600">
                                    {successfulResult.result.explanation}
                                </p>
                            </div>
                        </div>

                        {successfulResult.result.requiresProfessionalAdvice ? (
                            <div className="mt-3 flex items-start gap-2 rounded-[14px] bg-slate-50 p-3">
                                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />

                                <p className="text-[9px] leading-[1.5] text-slate-600">
                                    {successfulResult.sensitivity === "MEDICAL"
                                        ? "I can provide supported product information, but I can’t determine whether a product is medically suitable for you. Please consult a qualified healthcare professional for medical advice or diagnosis."
                                        : "For safety-sensitive use, check the applicable manufacturer instructions and seek advice from an appropriately qualified professional where individual safety judgment is required."}
                                </p>
                            </div>
                        ) : null}
                    </section>
                ) : null}

                <p className="mt-3 px-1 text-[8px] leading-[1.5] text-slate-400">
                    Ari bases this check on available product information. Missing information is not treated as evidence that a product does or does not meet your needs.
                </p>
            </main>
        </div>
    );
}
