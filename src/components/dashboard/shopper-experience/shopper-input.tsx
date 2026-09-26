"use client";

import { useState } from "react";
import { Send } from "lucide-react";

type ShopperInputProps = {
    onSubmit: (message: string) => void;
};

export function ShopperInput({ onSubmit }: ShopperInputProps) {
    const [message, setMessage] = useState("");

    const submitMessage = () => {
        const trimmed = message.trim();

        if (!trimmed) {
            return;
        }

        onSubmit(trimmed);
        setMessage("");
    };

    return (
        <form
            className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"
            onSubmit={(event) => {
                event.preventDefault();
                submitMessage();
            }}
        >
            <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Type your question here..."
                aria-label="Ask Ari a question"
                className="min-w-0 flex-1 bg-transparent pl-2 text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
            />

            <button
                type="submit"
                aria-label="Send question"
                disabled={!message.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
                <Send className="h-4 w-4" />
            </button>
        </form>
    );
}
