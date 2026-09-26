import {
    ArrowRight,
    CheckCircle2,
    MessageCircle,
    Scale,
} from "lucide-react";

type ShopperActionsProps = {
    onAskAri: () => void;
    onCompare: () => void;
    onSuitability: () => void;
};

export function ShopperActions({
    onAskAri,
    onCompare,
    onSuitability,
}: ShopperActionsProps) {
    return (
        <section>
            <div className="mb-2 flex items-end justify-between px-0.5">
                <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.17em] text-blue-600">
                        Decide with Ari
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold text-slate-700">
                        What would help you choose?
                    </p>
                </div>

                <span className="text-[8px] font-semibold text-slate-400">
                    Point of Decision
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={onAskAri}
                    className="group col-span-2 flex min-h-[58px] items-center gap-3 rounded-[18px] bg-[#07162f] px-3.5 py-3 text-left text-white shadow-sm transition hover:bg-[#0b2144] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                        <MessageCircle className="h-4 w-4 text-sky-300" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black">Ask Ari about this product</p>
                        <p className="mt-0.5 text-[8px] leading-tight text-white/60">
                            Get help with the question on your mind.
                        </p>
                    </div>

                    <ArrowRight className="h-4 w-4 shrink-0 text-white/60" />
                </button>

                <button
                    type="button"
                    onClick={onCompare}
                    className="flex min-h-[68px] flex-col justify-between rounded-[18px] bg-white p-3 text-left shadow-sm"
                >
                    <Scale className="h-4 w-4 text-blue-600" />

                    <div>
                        <p className="text-[10px] font-black leading-tight text-slate-900">
                            Compare options
                        </p>
                        <p className="mt-1 text-[8px] leading-tight text-slate-400">
                            Understand the differences.
                        </p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={onSuitability}
                    className="flex min-h-[68px] flex-col justify-between rounded-[18px] bg-white p-3 text-left shadow-sm"
                >
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />

                    <div>
                        <p className="text-[10px] font-black leading-tight text-slate-900">
                            Is this right for me?
                        </p>
                        <p className="mt-1 text-[8px] leading-tight text-slate-400">
                            Get guidance for your needs.
                        </p>
                    </div>
                </button>
            </div>
        </section>
    );
}
