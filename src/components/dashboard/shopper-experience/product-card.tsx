import { ArrowRight, ImageIcon } from "lucide-react";
import type { ShopperExperienceProduct } from "./types";

type ProductCardProps = {
    product?: ShopperExperienceProduct;
    onExplore?: () => void;
};

export function ProductCard({
    product,
    onExplore,
}: ProductCardProps) {
    return (
        <section className="overflow-hidden rounded-[22px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.07)]">
            <div className="flex gap-3.5 p-3.5">
                <div className="flex h-[82px] w-[82px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br from-slate-50 to-blue-50">
                    {product?.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt=""
                            className="h-full w-full object-contain p-1.5"
                        />
                    ) : (
                        <div className="flex h-[54px] w-[42px] items-center justify-center rounded-lg bg-white shadow-sm">
                            <ImageIcon className="h-5 w-5 text-blue-300" />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1 py-0.5">
                    <p className="text-[8px] font-black uppercase tracking-[0.17em] text-blue-600">
                        {product?.brandName ?? "Product context"}
                    </p>

                    <h3 className="mt-1 text-[15px] font-black leading-tight tracking-tight text-slate-950">
                        {product?.name ?? "Selected product"}
                    </h3>

                    <p className="mt-1.5 line-clamp-2 text-[10px] leading-[1.5] text-slate-500">
                        {product?.descriptor ??
                            "Authoritative retailer product information appears here."}
                    </p>

                    <button
                        type="button"
                        onClick={onExplore}
                        disabled={!onExplore}
                        className="mt-2 inline-flex items-center gap-1 text-[9px] font-black text-blue-700 disabled:cursor-default disabled:opacity-50"
                    >
                        Explore product
                        <ArrowRight className="h-3 w-3" />
                    </button>
                </div>
            </div>
        </section>
    );
}
