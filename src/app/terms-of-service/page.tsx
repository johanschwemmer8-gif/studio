
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
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
            <CardHeader>
              <CardTitle className="text-3xl">Terms of Service</CardTitle>
              <CardDescription>
                Last updated: {new Date().toLocaleDateString('en-CA')}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              
              <h3>1. Acceptance of Terms</h3>
              <p>
                By accessing and using our Service, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
              </p>

              <Separator className="my-6" />

              <h3>2. Use License</h3>
              <p>
                Permission is granted to temporarily download one copy of the materials on iNteract AOE's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
              
              <Separator className="my-6" />

              <h3>3. Disclaimer</h3>
              <p>
                The materials on iNteract AOE's website are provided on an 'as is' basis. iNteract AOE makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>

              <Separator className="my-6" />

              <h3>4. Limitations</h3>
              <p>
                In no event shall iNteract AOE or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on iNteract AOE's website.
              </p>

              <Separator className="my-6" />

              <h3>5. Governing Law</h3>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of South Africa and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
              </p>

              <Separator className="my-6" />

              <h3>6. Contact Us</h3>
              <p>
                If you have any questions about these Terms of Service, please contact us by email: johan@interactaoe.co.za
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
