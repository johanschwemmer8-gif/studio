
import { BrainCircuit, BarChart3, QrCode, DollarSign, Puzzle, Cloud } from 'lucide-react';
import Image from 'next/image';

const features = [
    {
      icon: <BrainCircuit className="h-10 w-10 text-accent" />,
      title: "AI-Powered Personalization",
      description: "Deliver targeted offers and product recommendations in real-time based on shopper behavior and location.",
      image: "/images/AI-Powered Personalization.jpg",
      aiHint: "smartphone product recommendation retail"
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-accent" />,
      title: "Real-Time Analytics Dashboard",
      description: "Track footfall, engagement, campaign ROI, and conversion by zone and product.",
      image: "/images/RealTimeAnalyticsDashboard.jpg",
      aiHint: "analytics dashboard data visualization"
    },
    {
      icon: <QrCode className="h-10 w-10 text-accent" />,
      title: "QR-Enabled Engagement",
      description: "Seamless customer interaction through simple scan technology—no app downloads required.",
      image: "https://picsum.photos/seed/qr-scan/600/400",
      aiHint: "customer scanning qr code"
    },
    {
      icon: <DollarSign className="h-10 w-10 text-accent" />,
      title: "Retail Media Network Ready",
      description: "Create new revenue streams through branded in-store campaigns and supplier partnerships.",
      image: "https://picsum.photos/seed/digital-display/600/400",
      aiHint: "digital display retail"
    },
    {
      icon: <Puzzle className="h-10 w-10 text-accent" />,
      title: "White-Label Integration",
      description: "Modular SDK/API connects with your existing loyalty, POS, and CRM systems.",
      image: "https://picsum.photos/seed/api-code/600/400",
      aiHint: "api integration diagram"
    },
    {
      icon: <Cloud className="h-10 w-10 text-accent" />,
      title: "Scalable SaaS Architecture",
      description: "Deploy across 10 or 1,000 stores with the same seamless platform.",
      image: "https://picsum.photos/seed/store-network/600/400",
      aiHint: "retail store network map"
    },
  ];
  
  export default function Solution() {
    return (
      <section id="solution" className="py-20 lg:py-32">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
            One Platform. Complete In-Store Intelligence.
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-foreground/80">
            iNteract AOE is a white-label SaaS platform that uses AI and in-store
            engagement technology to deliver personalized customer experiences,
            actionable insights, and new revenue streams—all while shoppers
            browse your aisles.
          </p>
          <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center text-center">
                {feature.icon}
                <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-foreground/70 flex-grow">{feature.description}</p>
                <div className="mt-6 w-full aspect-[3/2] relative rounded-lg overflow-hidden shadow-md">
                    <Image 
                        src={feature.image}
                        alt={feature.title}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint={feature.aiHint}
                    />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
