"use client";

import { useCallback, useState } from "react";
import {
    ArrowLeft,
    Camera,
    Loader2,
    RotateCcw,
    ScanLine,
    Scale,
    X,
} from "lucide-react";

import QrScannerCamera from "@/components/qr-scanner-camera";
import {
    buildProductComparisonEvidence,
} from "@/ai/flows/build-product-comparison-evidence";
import {
    projectProductComparison,
    type ProductComparisonProjection,
} from "@/lib/product-comparison-projection";

import type {
    ShopperExperienceBranding,
    ShopperExperienceProduct,
} from "../types";
import { ShopperHeader } from "../shopper-header";

type AriSignatureComparisonProps = {
    mode: "preview" | "live";
    branding: ShopperExperienceBranding;
    product?: ShopperExperienceProduct;
    sessionId?: string;
    onBack: () => void;
};

type CompareView = "ready" | "scanner" | "resolving" | "result";

export function AriSignatureComparison({
    mode,
    branding,
    product,
    sessionId,
    onBack,
}: AriSignatureComparisonProps) {
    const [view, setView] = useState<CompareView>("ready");
    const [comparison, setComparison] =
        useState<ProductComparisonProjection | null>(null);
    const [error, setError] = useState<string | null>(null);

    const openScanner = () => {
        setError(null);
        setView("scanner");
    };

    const closeScanner = () => {
        setError(null);
        setView(comparison ? "result" : "ready");
    };

    const scanAgain = () => {
        setComparison(null);
        setError(null);
        setView("scanner");
    };

    const handleScan = useCallback(
        async (scannedValue: string) => {
            /*
             * QrScannerCamera stops its decode loop after this callback.
             * Moving away from the scanner view unmounts it, which stops the
             * MediaStream tracks through the scanner's existing cleanup.
             */
            setView("resolving");
            setError(null);

            /*
             * Preview mode may exercise the real camera lifecycle, but it must
             * never fabricate Product B or masquerade as authoritative shopper
             * evidence. Production comparison requires the existing anonymous
             * shopper session established by a qualifying interaction.
             */
            if (mode === "preview") {
                setError(
                    "Camera preview complete. Product comparison becomes available in a live shopper session."
                );
                setView("ready");
                return;
            }

            if (!sessionId) {
                setError(
                    "Comparison is unavailable because the current shopper session could not be verified."
                );
                setView("ready");
                return;
            }

            try {
                const result = await buildProductComparisonEvidence({
                    scannedValue,
                    sessionId,
                });

                if (!result.success) {
                    setError(result.message);
                    setView("ready");
                    return;
                }

                setComparison(
                    projectProductComparison(result.evidence)
                );
                setView("result");
            } catch {
                setError(
                    "The product could not be resolved for comparison. Please try again."
                );
                setView("ready");
            }
        },
        [mode, sessionId]
    );

    return (
        <div className="flex h-full min-h-0 flex-col bg-[#f5f7fb]">
            <ShopperHeader
                branding={branding}
                onBack={onBack}
            />

            <section className="shrink-0 bg-[#07162f] px-4 pb-4 pt-3 text-white">
                <p className="text-[7px] font-black uppercase tracking-[0.18em] text-sky-300">
                    Compare Options
                </p>

                <h2 className="mt-1 text-[18px] font-black leading-tight">
                    Compare another product
                </h2>
            </section>

            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <section className="rounded-[20px] bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                            <Scale className="h-5 w-5 text-blue-600" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-[7px] font-black uppercase tracking-[0.15em] text-blue-600">
                                Current product
                            </p>
                            <p className="truncate text-[12px] font-black text-slate-900">
                                {product?.name ?? "Selected product"}
                            </p>

                            {product?.brandName ? (
                                <p className="mt-0.5 text-[8px] text-slate-400">
                                    {product.brandName}
                                </p>
                            ) : null}

                            {product?.gtin ? (
                                <p className="mt-0.5 text-[7px] text-slate-400">
                                    GTIN {product.gtin}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </section>

                {view === "scanner" ? (
                    <section className="mt-3 rounded-[20px] bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <p className="text-[7px] font-black uppercase tracking-[0.15em] text-blue-600">
                                    Second product
                                </p>
                                <h3 className="mt-0.5 text-[13px] font-black text-slate-900">
                                    Scan its iNteract QR
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={closeScanner}
                                aria-label="Cancel scanning"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <QrScannerCamera onScan={handleScan} />

                        <p className="mt-3 text-center text-[8px] leading-[1.45] text-slate-500">
                            Camera access is used only to scan the product QR.
                            Cancel returns you to Compare Options.
                        </p>
                    </section>
                ) : view === "resolving" ? (
                    <section className="mt-3 rounded-[20px] bg-white p-6 text-center shadow-sm">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />
                        <h3 className="mt-3 text-[12px] font-black text-slate-900">
                            Preparing comparison
                        </h3>
                        <p className="mt-1 text-[8px] text-slate-500">
                            Identifying the product and checking available product information.
                        </p>
                    </section>
                ) : view === "result" && comparison ? (
                    <section className="mt-3 rounded-[20px] bg-white p-4 shadow-sm">
                        <p className="text-[7px] font-black uppercase tracking-[0.15em] text-emerald-600">
                            Evidence-backed comparison
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-[7px] font-black uppercase text-slate-400">
                                    Product A
                                </p>
                                <p className="mt-1 text-[10px] font-black text-slate-900">
                                    {comparison.productA.productName ??
                                        product?.name ??
                                        "Current product"}
                                </p>
                                <p className="mt-1 break-all text-[7px] text-slate-400">
                                    {comparison.productA.gtin}
                                </p>
                            </div>

                            <div className="rounded-xl bg-blue-50 p-3">
                                <p className="text-[7px] font-black uppercase text-blue-500">
                                    Product B
                                </p>
                                <p className="mt-1 text-[10px] font-black text-slate-900">
                                    {comparison.productB.productName ??
                                        "Compared product"}
                                </p>
                                <p className="mt-1 break-all text-[7px] text-slate-400">
                                    {comparison.productB.gtin}
                                </p>
                            </div>
                        </div>

                        {comparison.rows.length > 0 ? (
                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                                {comparison.rows.map((row) => (
                                    <div
                                        key={row.key}
                                        className="border-b border-slate-100 p-3 last:border-b-0"
                                    >
                                        <p className="text-[8px] font-black text-slate-700">
                                            {row.label}
                                        </p>

                                        {row.state === "UNRESOLVED" ? (
                                            <p className="mt-1 text-[8px] leading-[1.45] text-amber-700">
                                                Available evidence is not sufficient to present a reliable comparison for this detail.
                                            </p>
                                        ) : (
                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                                                    <p className="text-[7px] font-bold uppercase text-slate-400">
                                                        Product A
                                                    </p>
                                                    <p className="mt-0.5 text-[9px] font-bold text-slate-800">
                                                        {row.productA
                                                            ? `${row.productA.value}${row.productA.unit ? ` ${row.productA.unit}` : ""}`
                                                            : "No supported evidence"}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg bg-blue-50 px-2.5 py-2">
                                                    <p className="text-[7px] font-bold uppercase text-blue-400">
                                                        Product B
                                                    </p>
                                                    <p className="mt-0.5 text-[9px] font-bold text-slate-800">
                                                        {row.productB
                                                            ? `${row.productB.value}${row.productB.unit ? ` ${row.productB.unit}` : ""}`
                                                            : "No supported evidence"}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                <p className="text-[8px] font-semibold leading-[1.45] text-slate-600">
                                    I can identify both products, but I do not currently have enough supported product information to compare them reliably.
                                </p>
                            </div>
                        )}

                        {comparison.limitations.length > 0 ? (
                            <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                                <p className="text-[7px] font-black uppercase tracking-[0.12em] text-amber-700">
                                    Evidence note
                                </p>
                                <p className="mt-1 text-[8px] leading-[1.45] text-amber-800">
                                    Some product information could not be verified or is currently unavailable.
                                </p>
                            </div>
                        ) : null}

                        <button
                            type="button"
                            onClick={scanAgain}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px] font-black text-slate-700"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Scan a different product
                        </button>
                    </section>
                ) : (
                    <section className="mt-3 rounded-[20px] border border-dashed border-blue-200 bg-blue-50/60 p-5 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                            <ScanLine className="h-5 w-5 text-blue-600" />
                        </div>

                        <h3 className="mt-3 text-[13px] font-black text-slate-900">
                            Add a second product
                        </h3>

                        <p className="mx-auto mt-1.5 max-w-[230px] text-[9px] leading-[1.5] text-slate-500">
                            Scan another iNteract QR to identify the product you
                            want to compare.
                        </p>

                        <button
                            type="button"
                            onClick={openScanner}
                            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#07162f] px-4 py-2.5 text-[9px] font-black text-white"
                        >
                            <Camera className="h-3.5 w-3.5" />
                            Scan another product
                        </button>

                        <div className="mt-4 rounded-xl bg-white px-3 py-2.5 text-[8px] font-semibold leading-[1.45] text-slate-500">
                            A comparison is only started after an authoritative
                            second product has been identified.
                        </div>
                    </section>
                )}

                {error ? (
                    <section
                        role="alert"
                        className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5"
                    >
                        <p className="text-[8px] font-semibold leading-[1.45] text-red-700">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={openScanner}
                            className="mt-2 inline-flex items-center gap-1.5 text-[8px] font-black text-red-700"
                        >
                            <ScanLine className="h-3 w-3" />
                            Try another QR
                        </button>
                    </section>
                ) : null}
            </main>
        </div>
    );
}
