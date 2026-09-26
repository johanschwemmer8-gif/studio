"use client";

import { useState } from "react";
import { MoreHorizontal, Send } from "lucide-react";

import type { ShopperConversationStart } from "../shopper-presentation-controller";
import { ShopperHeader } from "../shopper-header";

import type {
    ShopperExperienceBranding,
    ShopperExperienceProduct,
} from "../types";

type AriSignatureConversationProps = {
    branding: ShopperExperienceBranding;
    product?: ShopperExperienceProduct;
    onMinimize: () => void;
    start: ShopperConversationStart;
    messages: string[];
    onSubmitMessage: (message: string) => void;
};

export function AriSignatureConversation({
    branding,
    product,
    onMinimize,
    start,
    messages,
    onSubmitMessage,
}: AriSignatureConversationProps) {
    const [message, setMessage] = useState("");

    const submitMessage = () => {
        const trimmed = message.trim();

        if (!trimmed) {
            return;
        }

        onSubmitMessage(trimmed);
        setMessage("");
    };

    const starterPrompt =
        "What would you like to know about this product?";

    return (
        <div className="flex h-full min-h-0 flex-col bg-[#f5f7fb]">
            <ShopperHeader
                branding={branding}
                onMinimize={onMinimize}
            />

            {/* CONVERSATION WORKSPACE */}
            <section className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center gap-2.5 border-b border-slate-200 bg-white px-4 py-3">
                    <img
                        src="/brand/ari/ari-chat-avatar.png"
                        alt="Ari"
                        className="h-12 w-12 shrink-0 object-contain"
                    />

                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="text-[12px] font-black text-slate-950">
                                Ari
                            </p>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </div>

                        <p className="text-[8px] font-medium text-slate-400">
                            Shopping Assistant · Ready to help
                        </p>
                    </div>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                    <div className="flex items-start gap-2">
                        <img
                            src="/brand/ari/ari-chat-avatar.png"
                            alt=""
                            className="h-9 w-9 shrink-0 object-contain"
                        />

                        <div className="max-w-[78%] rounded-[18px] rounded-tl-[5px] bg-[#eaf3ff] px-3.5 py-3">
                            <p className="text-[10px] font-semibold leading-[1.5] text-slate-700">
                                {starterPrompt}
                            </p>
                        </div>
                    </div>

                    {messages.map((submittedMessage, index) => (
                        <div
                            key={`${submittedMessage}-${index}`}
                            className="flex justify-end"
                        >
                            <div className="max-w-[78%] rounded-[18px] rounded-tr-[5px] bg-[#07162f] px-3.5 py-3 text-white">
                                <p className="text-[10px] font-medium leading-[1.5]">
                                    {submittedMessage}
                                </p>
                            </div>
                        </div>
                    ))}

                    <div className="rounded-[18px] border border-blue-100 bg-white p-3">
                        <p className="text-[7px] font-black uppercase tracking-[0.16em] text-blue-600">
                            Product context stays available
                        </p>

                        <p className="mt-1 text-[10px] font-black text-slate-900">
                            {product?.name ?? "Selected product"}
                        </p>

                        <p className="mt-1 line-clamp-2 text-[8px] leading-[1.4] text-slate-400">
                            Ari keeps the relevant product context while the conversation
                            receives priority.
                        </p>
                    </div>
                </div>

                {/* CHAT COMPOSER */}
                <div className="shrink-0 border-t border-slate-200 bg-white p-3">
                    <form
                        className="flex min-h-[48px] items-center gap-2 rounded-[18px] border border-slate-200 bg-slate-50 px-3"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitMessage();
                        }}
                    >
                        <input
                            type="text"
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder="Ask Ari anything about this product..."
                            aria-label="Continue conversation with Ari"
                            className="min-w-0 flex-1 bg-transparent text-[10px] text-slate-700 outline-none placeholder:text-slate-400"
                        />

                        <button
                            type="submit"
                            aria-label="Send message"
                            disabled={!message.trim()}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>

                    <p className="mt-2 text-center text-[7px] leading-tight text-slate-400">
                        Ari uses available retailer and product context to assist your decision.
                    </p>
                </div>
            </section>
        </div>
    );
}
