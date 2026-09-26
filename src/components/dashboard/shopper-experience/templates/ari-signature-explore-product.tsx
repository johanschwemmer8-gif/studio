"use client";

import { useEffect, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    PackageSearch,
} from "lucide-react";

import {
    getExploreProductEvidence,
    type ExploreProductResult,
} from "@/ai/flows/get-explore-product-evidence";

import type {
    ShopperExperienceBranding,
    ShopperExperienceProduct,
} from "../types";
import { ShopperHeader } from "../shopper-header";

type AriSignatureExploreProductProps = {
    branding: ShopperExperienceBranding;
    product?: ShopperExperienceProduct;
    sessionId?: string;
    onBack: () => void;
};

export function AriSignatureExploreProduct({
    branding,
    product,
    sessionId,
    onBack,
}: AriSignatureExploreProductProps) {
    const [result, setResult] =
        useState<ExploreProductResult | null>(null);
    const [isLoading, setIsLoading] = useState(Boolean(sessionId));

    useEffect(() => {
        let cancelled = false;

        if (!sessionId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setResult(null);

        getExploreProductEvidence({ sessionId })
            .then((nextResult) => {
                if (!cancelled) {
                    setResult(nextResult);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setResult({
                        success: false,
                        code: "EVIDENCE_UNAVAILABLE",
                        message:
                            "Ari could not retrieve the available product information right now.",
                    });
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    const authoritativeName =
        result?.success && result.product.productName
            ? result.product.productName
            : product?.name;

    const authoritativeBrand =
        result?.success && result.product.brandName
            ? result.product.brandName
            : product?.brandName;

    return (
        <div className="flex h-full min-h-0 flex-col bg-[#f5f7fb]">
            <ShopperHeader
                branding={branding}
                onBack={onBack}
            />

            <section className="shrink-0 border-b border-slate-100 bg-white px-4 py-3 text-center">
                <p className="text-[8px] font-black uppercase tracking-[0.17em] text-blue-600">
                    Explore Product
                </p>

                <p className="truncate text-[11px] font-bold text-slate-700">
                    Product information with Ari
                </p>
            </section>

            <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4">
                <section className="rounded-[22px] bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-blue-50">
                            <PackageSearch className="h-5 w-5 text-blue-700" />
                        </div>

                        <div className="min-w-0 flex-1">
                            {authoritativeBrand && (
                                <p className="text-[8px] font-black uppercase tracking-[0.17em] text-blue-600">
                                    {authoritativeBrand}
                                </p>
                            )}

                            <h2 className="mt-1 text-[18px] font-black leading-tight text-slate-950">
                                {authoritativeName ?? "Current product"}
                            </h2>

                            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                                Here&apos;s what Ari can reliably tell you from
                                the available product information.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-3">
                    <div className="flex items-start gap-2">
                        <img
                            src="/brand/ari/ari-chat-avatar.png"
                            alt="Ari"
                            className="mt-1 h-12 w-12 shrink-0 object-contain drop-shadow-sm"
                        />

                        <div className="min-w-0 flex-1">
                            <div className="rounded-[18px] rounded-tl-[6px] bg-[#eaf3ff] px-3.5 py-3">
                                <p className="text-[9px] font-black text-blue-700">
                                    Ari
                                </p>

                                <p className="mt-1 text-[10px] font-semibold leading-[1.5] text-slate-700">
                                    I&apos;ll show you the product facts I can
                                    support. If reliable information is missing,
                                    I&apos;ll tell you rather than guess.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {isLoading && (
                    <section className="mt-3 rounded-[20px] bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-center gap-2 text-slate-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-[10px] font-bold">
                                Checking available product information…
                            </span>
                        </div>
                    </section>
                )}

                {!sessionId && !isLoading && (
                    <section className="mt-3 rounded-[20px] border border-amber-100 bg-amber-50 p-4">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                            <p className="text-[10px] leading-relaxed text-amber-900">
                                Live product exploration is available from an
                                active shopper session.
                            </p>
                        </div>
                    </section>
                )}

                {result && !result.success && (
                    <section className="mt-3 rounded-[20px] border border-amber-100 bg-amber-50 p-4">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

                            <div>
                                <p className="text-[10px] font-black text-amber-950">
                                    Product information unavailable
                                </p>
                                <p className="mt-1 text-[9px] leading-relaxed text-amber-900">
                                    {result.message}
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {result?.success && result.facts.length > 0 && (
                    <section className="mt-3">
                        <div className="mb-2 px-0.5">
                            <p className="text-[8px] font-black uppercase tracking-[0.17em] text-blue-600">
                                Product Information
                            </p>
                            <p className="mt-0.5 text-[11px] font-bold text-slate-700">
                                What we can confirm
                            </p>
                        </div>

                        <div className="space-y-2">
                            {result.facts.map((fact) => (
                                <div
                                    key={`${fact.key}-${fact.value}`}
                                    className="rounded-[18px] bg-white p-3.5 shadow-sm"
                                >
                                    <div className="flex items-start gap-2.5">
                                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-[9px] font-black text-slate-900">
                                                {fact.label}
                                            </p>

                                            <p className="mt-1 break-words text-[10px] leading-relaxed text-slate-600">
                                                {fact.value}
                                                {fact.unit
                                                    ? ` ${fact.unit}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {result?.success && result.facts.length === 0 && (
                    <section className="mt-3 rounded-[20px] bg-white p-4 shadow-sm">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

                            <div>
                                <p className="text-[10px] font-black text-slate-900">
                                    I don&apos;t have enough reliable information yet
                                </p>

                                <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
                                    I won&apos;t fill in missing product details
                                    unless they can be supported by available
                                    product evidence.
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {result?.success && result.limitations.length > 0 && (
                    <section className="mt-3 rounded-[18px] border border-slate-100 bg-slate-50 px-3.5 py-3">
                        <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">
                            Information note
                        </p>
                        <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
                            Some product information could not be confirmed, so
                            Ari has left it out.
                        </p>
                    </section>
                )}

                <p className="mt-4 px-2 text-center text-[8px] leading-relaxed text-slate-400">
                    Ari shows available product information that has passed the
                    product-evidence checks. Missing or conflicting information
                    is not presented as a confirmed fact.
                </p>
            </main>
        </div>
    );
}
