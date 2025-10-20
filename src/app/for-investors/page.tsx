
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BarChart2, DollarSign, Puzzle, Users, Target, Scaling } from "lucide-react";
import Link from "next/link";

export default function ForInvestorsPage() {
  const highlights = [
    {
      icon: <Target className="h-10 w-10 text-accent" />,
      title: "Massive Addressable Market",
      description: "Tapping into South Africa's R1.53T retail market, where 90% of transactions still occur in physical stores—a sector ripe for digital transformation.",
    },
    {
      icon: <Puzzle className="h-10 w-10 text-accent" />,
      title: "Proven MVP & SaaS Model",
      description: "Our technology is validated and ready to deploy. The SaaS model ensures recurring revenue, high margins (70%+), and capital-efficient scaling.",
    },
    {
      icon: <Users className="h-10 w-10 text-accent" />,
      title: "Experienced Founder",
      description: "Led by a founder with 20+ years of deep, hands-on experience in South Africa's top retail chains, providing an unparalleled market understanding.",
    },
    {
      icon: <Scaling className="h-10 w-10 text-accent" />,
      title- "Scalable White-Label Solution",
      description: "Our platform is built to be branded and integrated by major retailers, enabling rapid, low-friction market penetration and wide-scale adoption.",
    }
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
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">Investing in the Future of African Retail</h1>
                <p className="mt-4 max-w-3xl mx-auto text-lg text-foreground/80">
                    iNteract AOE is positioned to become the leading in-store personalization and analytics platform for retailers across Africa, starting with a strong foothold in South Africa.
                </p>
            </div>
        </section>

        {/* Highlights Section */}
        <section className="py-12 md:py-24 bg-card">
            <div className="container mx-auto px-4 md:px-6">
                 <h2 className="text-3xl font-bold tracking-tight text-center text-primary mb-12">
                    A Compelling Pre-Seed Opportunity
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {highlights.map(item => (
                        <div key={item.title} className="flex flex-col items-center text-center">
                            {item.icon}
                            <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                            <p className="mt-2 text-foreground/70">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
        
        {/* The Ask Section */}
        <section className="py-20 lg:py-32">
            <div className="container mx-auto px-4 md:px-6 text-center">
                 <Card className="max-w-2xl mx-auto bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-2xl text-primary">The Ask</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-4xl font-bold text-accent">R750,000 Pre-Seed</p>
                        <p className="text-lg text-foreground/80">
                           To finalize our core platform, onboard our first enterprise client, and establish a dominant market position. Funds will be allocated to technical team expansion, infrastructure, and sales.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </section>


        {/* Call to Action */}
        <section className="pb-20 lg:pb-32">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Join Us in Redefining Retail
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/80">
            We are seeking partners who share our vision for a data-driven, personalized future for physical retail. Let's start a conversation.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/investor-inquiry">Submit an Investor Inquiry</Link>
            </Button>
          </div>
        </div>
      </section>

       </main>
    </div>
  );
}
