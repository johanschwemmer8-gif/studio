
import { Button } from "@/components/ui/button";

export default function CallToAction() {
    return (
      <section id="contact" className="py-20 lg:py-32">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to Transform Your In-Store Experience?
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <div className="rounded-lg border bg-card p-8 text-left">
              <h3 className="text-2xl font-bold text-primary">For Retailers</h3>
              <p className="mt-2 text-foreground/80">
                See how iNteract can drive measurable growth in your stores.
              </p>
              <Button className="mt-6 w-full">Request a Demo</Button>
            </div>
            <div className="rounded-lg border bg-card p-8 text-left">
              <h3 className="text-2xl font-bold text-primary">For Investors</h3>
              <p className="mt-2 text-foreground/80">
                Learn about our growth strategy and pre-seed investment
                opportunity.
              </p>
              <Button className="mt-6 w-full" variant="outline">
                Investor Inquiry
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }
  