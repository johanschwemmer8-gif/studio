
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-primary md:text-5xl lg:text-6xl">
              Transform In-Store Retail Into a Personalized Digital Experience
            </h1>
            <p className="max-w-2xl text-lg text-foreground/80 md:text-xl mx-auto lg:mx-0">
              iNteract AOE bridges the gap between your digital data and
              physical stores—delivering AI-powered personalization, real-time
              analytics, and measurable revenue growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg">Request a Demo</Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
          <div className="relative h-64 lg:h-auto lg:aspect-square">
             <Image
                src="/images/Web Personalization.jpg"
                alt="Web Personalization"
                fill
                className="object-cover rounded-lg shadow-xl"
                data-ai-hint="modern retail digital overlay"
              />
          </div>
        </div>
      </div>
    </section>
  );
}
