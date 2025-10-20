import Image from "next/image";

export default function Founder() {
    return (
        <section className="py-20 bg-card">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 gap-12 items-center">
                    <div className="space-y-4 text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
                            Built by Retail Experts, For Retail Experts
                        </h2>
                        <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
                            Johan Schwemmer, Founder & CEO, brings 20 years of hands-on retail experience across South Africa's leading chains including Woolworths, TFG, and Truworths. From security guard to area manager, Johan understands the operational realities and customer behavior that drive retail success.
                        </p>
                        <blockquote className="border-l-4 border-accent pl-4 italic text-xl font-medium max-w-2xl mx-auto text-left">
                            "iNteract AOE was born from a simple question: Why does online shopping feel personal, but in-store shopping doesn't?"
                        </blockquote>
                    </div>
                </div>
            </div>
        </section>
    );
}
