
import { Rocket, Scan, BarChart } from 'lucide-react';

const steps = [
    {
      icon: <Rocket className="h-10 w-10 text-accent" />,
      title: "Deploy",
      description: "We integrate with your existing systems and deploy QR engagement points across your stores.",
    },
    {
      icon: <Scan className="h-10 w-10 text-accent" />,
      title: "Engage",
      description: "Shoppers scan and receive personalized recommendations, offers, and product information in real-time.",
    },
    {
      icon: <BarChart className="h-10 w-10 text-accent" />,
      title: "Optimize",
      description: "Track performance, refine campaigns, and watch revenue grow through your analytics dashboard.",
    },
  ];
  
  export default function HowItWorks() {
    return (
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
              Seamless Integration. Immediate Impact.
            </h2>
          </div>
          <div className="relative mt-16">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2" />
            <div className="relative grid grid-cols-1 gap-12 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="flex flex-col items-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background border-2 border-accent shadow-md">
                    {step.icon}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{`Step ${index + 1}: ${step.title}`}</h3>
                  <p className="mt-2 text-foreground/70">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }
  