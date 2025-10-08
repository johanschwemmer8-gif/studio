
import { Percent, EyeOff, XCircle } from "lucide-react";
import Image from "next/image";

const problems = [
    {
      icon: <Percent className="h-8 w-8 text-accent" />,
      text: "90% of retail transactions happen in physical stores",
    },
    {
      icon: <EyeOff className="h-8 w-8 text-accent" />,
      text: "Yet retailers lack real-time visibility into shopper behavior",
    },
    {
      icon: <XCircle className="h-8 w-8 text-accent" />,
      text: "Online personalization stops at the door",
    },
  ];
  
  export default function Problem() {
    return (
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 md:px-6 relative text-center">
           <div className="absolute inset-0">
                <Image 
                    src="https://picsum.photos/seed/busy-retail/1600/800"
                    alt="Busy retail floor"
                    layout="fill"
                    objectFit="cover"
                    className="opacity-10"
                    data-ai-hint="busy retail floor elevated"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card to-transparent" />
            </div>
            <div className="relative z-10">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                    Retailers Are Flying Blind In-Store
                </h2>
                <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                    {problems.map((problem, index) => (
                    <div key={index} className="flex flex-col items-center gap-4">
                        {problem.icon}
                        <p className="max-w-xs text-lg text-foreground/80">
                        {problem.text}
                        </p>
                    </div>
                    ))}
                </div>
                <p className="mt-12 text-2xl font-semibold text-primary">
                    iNteract changes that.
                </p>
            </div>
        </div>
      </section>
    );
  }
  