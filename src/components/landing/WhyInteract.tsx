
import Image from "next/image";

const differentiators = [
    {
      title: "Measurable Revenue Impact",
      text: "Our AI-driven personalization engine is designed to increase average basket size by 5-7% and activate dormant loyalty members through timely, relevant in-store offers.",
      image: "/images/Measurable Revenue Impact.jpg",
      aiHint: "revenue dashboard growth"
    },
    {
      title: "Deploy Fast, Scale Faster",
      text: "Purpose-built for the South African retail environment. Our white-label SaaS model means rapid deployment across your entire store network with minimal IT overhead.",
      image: "/images/Deploy Fast, Scale Faster.jpg",
      aiHint: "map south africa"
    },
    {
      title: "Data You Can Act On",
      text: "Stop guessing. Our real-time analytics show exactly how shoppers move through your stores, which campaigns drive sales, and where to optimize your layout and merchandising.",
      image: "/images/Data You Can Act On.jpg",
      aiHint: "heatmap analytics dashboard"
    },
  ];
  
  export default function WhyInteract() {
    return (
      <section id="why-interact" className="py-20 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-center text-primary md:text-4xl">
            Why Retailers Choose iNteract AOE
          </h2>
          <div className="mt-16 space-y-20">
            {differentiators.map((item, index) => (
              <div
                key={item.title}
                className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2"
              >
                <div className={`space-y-4 ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                  <h3 className="text-2xl font-bold">{item.title}</h3>
                  <p className="text-lg text-foreground/80">{item.text}</p>
                </div>
                <div className={`relative aspect-video ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                    <Image 
                        src={item.image}
                        alt={item.title}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg shadow-lg"
                        data-ai-hint={item.aiHint}
                    />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
