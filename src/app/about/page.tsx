
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft, Target, Eye, Rocket } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-background text-foreground py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <Button asChild variant="ghost" className="mb-4 -ml-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-4xl font-bold text-primary">About iNteract AOE</CardTitle>
              <CardDescription className="text-lg">
                Redefining the in-store retail experience across Africa.
              </CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-6">
              
              <p className="text-center">
                iNteract AOE (Attention, Opportunity, Engagement) was founded on the belief that physical retail is not just alive, but poised for a digital revolution. We saw a disconnect: while e-commerce offered rich data and deep personalization, brick-and-mortar stores—where the vast majority of transactions occur—were operating with limited insight into customer behavior.
              </p>

              <div className="grid md:grid-cols-2 gap-8 pt-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Target className="h-8 w-8 text-accent" />
                        <h3 className="text-2xl font-semibold">Our Mission</h3>
                    </div>
                    <p>
                        To empower brick-and-mortar retailers with the digital tools they need to understand their customers, personalize the in-store journey, and drive measurable growth. We bridge the gap between the physical and digital worlds, turning every product into an interactive experience.
                    </p>
                </div>
                <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <Eye className="h-8 w-8 text-accent" />
                        <h3 className="text-2xl font-semibold">Our Vision</h3>
                    </div>
                    <p>
                        To become the leading in-store personalization and analytics platform in Africa, transforming how retailers and customers connect. We envision a future where every physical shopping experience is as intelligent, data-driven, and engaging as the best e-commerce platforms.
                    </p>
                </div>
              </div>

              <Separator className="my-8" />

              <div className="text-center">
                <Rocket className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-semibold">Our Approach</h3>
                <p>
                  We believe in practical innovation. Our platform is built by retail experts, for retail experts. It's a white-label, scalable SaaS solution designed for seamless integration with existing systems, ensuring a rapid deployment and immediate impact on your bottom line. We are not just a technology provider; we are your partner in navigating the future of retail.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
