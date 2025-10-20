
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

const audiences = [
    {
      title: "Enterprise Retail Chains",
      description: "Multi-store operations seeking to unify online and in-store data.",
      idealFor: "Woolworths, TFG, Pick n Pay, Shoprite, Clicks",
      image: "/images/Enterprise Retail Chains.jpg",
      aiHint: "flagship retail store interior"
    },
    {
      title: "Growth-Focused Mid-Tier Retailers",
      description: "Ambitious chains ready to compete with enterprise-level customer experience.",
      idealFor: "Mr Price, Dis-Chem, regional chains",
      image: "/images/Growth-Focused Mid-Tier Retailers.jpg",
      aiHint: "dynamic retail environment"
    },
    {
      title: "Retail Tech Platforms",
      description: "POS, loyalty, and CRM providers looking to enhance their offering.",
      idealFor: "Technology partners seeking white-label integration",
      image: "/images/Retail Tech Platforms.jpg",
      aiHint: "business professionals tablet"
    },
  ];
  
  export default function WhoItIsFor() {
    return (
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-center text-primary md:text-4xl">
            Built for South Africa's Leading Retailers
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {audiences.map((audience) => (
              <Card key={audience.title} className="overflow-hidden">
                <div className="relative h-56 w-full">
                    <Image 
                        src={audience.image}
                        alt={audience.title}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint={audience.aiHint}
                    />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold">{audience.title}</h3>
                  <p className="mt-2 text-foreground/80">{audience.description}</p>
                  <p className="mt-4 text-sm font-semibold text-accent">
                    Ideal for: {audience.idealFor}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
