
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BarChart2, DollarSign, Heart, Puzzle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ForRetailChainsPage() {
  const benefits = [
    {
      icon: <BarChart2 className="h-10 w-10 text-accent" />,
      title: "Unlock In-Store Data",
      description: "Gain unprecedented visibility into shopper behavior, product interaction, and campaign effectiveness right where the majority of your sales happen.",
    },
    {
      icon: <Heart className="h-10 w-10 text-accent" />,
      title: "Enhance Customer Loyalty",
      description: "Bridge the gap between digital and physical. Deliver personalized offers and content that reward your customers and keep them coming back.",
    },
    {
      icon: <DollarSign className="h-10 w-10 text-accent" />,
      title: "Drive Revenue Growth",
      description: "Increase average basket size, improve conversion rates, and create new revenue streams through our integrated retail media network capabilities.",
    },
    {
      icon: <Puzzle className="h-10 w-10 text-accent" />,
      title: "Seamless Integration",
      description: "Our white-label platform is designed to integrate with your existing POS, CRM, and loyalty systems, enhancing your current technology stack, not replacing it.",
    },
  ];

  return (
    <div className="bg-background text-foreground">
       <header className="py-4">
            <div className="container mx-auto px-4 md:px-6">
                 <Button asChild variant="ghost" className="-ml-4">
                    <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                    </Link>
                </Button>
            </div>
       </header>
       <main>
        {/* Hero Section */}
        <section className="py-12 md:py-24">
            <div className="container mx-auto px-4 md:px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">A Smarter Strategy for Every Store</h1>
                <p className="mt-4 max-w-3xl mx-auto text-lg text-foreground/80">
                    iNteract AOE provides enterprise-grade tools to help you understand, engage, and convert customers across your entire retail footprint.
                </p>
            </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 md:py-24 bg-card">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {benefits.map(benefit => (
                        <div key={benefit.title} className="flex flex-col items-center text-center">
                            {benefit.icon}
                            <h3 className="mt-4 text-xl font-semibold">{benefit.title}</h3>
                            <p className="mt-2 text-foreground/70">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to Unlock Your In-Store Potential?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/80">
            Let's discuss how iNteract AOE can be tailored to meet the unique challenges and goals of your retail chain.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/request-demo">Request a Personalized Demo</Link>
            </Button>
          </div>
        </div>
      </section>

       </main>
    </div>
  );
}
