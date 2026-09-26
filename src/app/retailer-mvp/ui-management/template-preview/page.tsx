"use client";

import { useState } from "react";
import { AriSignature } from "@/components/dashboard/shopper-experience/templates/ari-signature";
import { ShopperPhoneFrame } from "@/components/dashboard/shopper-experience/shopper-phone-frame";
import type { PaidMediaMode } from "@/components/dashboard/shopper-experience/presentation-state";

export default function ShopperTemplatePreviewPage() {
    const [previewMediaMode, setPreviewMediaMode] =
        useState<PaidMediaMode>("video");

    return (
        <main className="min-h-screen bg-slate-100 px-6 py-10">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                        Shopper Experience · Visual Development
                    </p>

                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                        Ari Signature
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                        Full-size cellphone preview of the new canonical shopper experience.
                        Content shown on this development surface is representative preview
                        content only.
                    </p>
                </div>

                <div className="grid gap-10 lg:grid-cols-[390px_1fr] lg:items-start">
                    <ShopperPhoneFrame>
                        <AriSignature
                            key={previewMediaMode}
                            mode="preview"
                            initialMediaMode={previewMediaMode}
                            ariImageUrl="/brand/ari/ari-master.png"
                            branding={{}}
                            product={{
                                brandName: "PRODUCT CONTEXT",
                                name: "Your selected product",
                                descriptor:
                                    "Authoritative retailer product information will appear here in the live shopper experience.",
                            }}
                        />
                    </ShopperPhoneFrame>

                    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                            Template 01
                        </p>

                        <h2 className="mt-2 text-2xl font-black text-slate-950">
                            Ari Signature
                        </h2>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                            The flagship iNteract shopper experience: retailer identity,
                            Ari, authoritative product context, decision tools and
                            conversational assistance in one balanced mobile journey.
                        </p>

                        <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                            This preview deliberately does not create shopper evidence,
                            transactions, activations, deployments or Retail Media
                            eligibility. It is a presentation surface for visual
                            acceptance only.
                        </div>

                        <div className="mt-6 border-t border-slate-200 pt-6">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                                Paid Media Simulation
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Development controls only. These simulate presentation
                                after eligibility has already been determined elsewhere.
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {([
                                    ["none", "No Media"],
                                    ["video", "Video ¼"],
                                    ["brandStrip", "Brand Strip ⅛"],
                                ] as const).map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setPreviewMediaMode(value)}
                                        className={
                                            previewMediaMode === value
                                                ? "rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white"
                                                : "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                                        }
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs font-bold text-slate-500">
                                    Current simulated state
                                </p>
                                <p className="mt-1 text-sm font-black text-slate-950">
                                    {previewMediaMode === "none"
                                        ? "No paid media · Ari 100%"
                                        : previewMediaMode === "video"
                                          ? "Video · Ari 75% / Media 25%"
                                          : "Brand Strip · Ari 87.5% / Media 12.5%"}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
