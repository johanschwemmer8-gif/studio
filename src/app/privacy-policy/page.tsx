
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

export default function PrivacyPolicyPage() {
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
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
              <CardDescription>
                Last updated: {new Date().toLocaleDateString('en-CA')}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              
              <p>
                iNteract AOE Pty Ltd. ("us", "we", or "our") operates the iNteract AOE platform (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
              </p>

              <h3>1. Information Collection and Use</h3>
              <p>
                We collect several different types of information for various purposes to provide and improve our Service to you.
              </p>
              <h4>Types of Data Collected</h4>
              <ul>
                <li><strong>Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). This may include, but is not limited to: Email address, First name and last name, Phone number, Cookies and Usage Data.</li>
                <li><strong>Usage Data:</strong> We may also collect information on how the Service is accessed and used ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data.</li>
                <li><strong>Tracking & Cookies Data:</strong> We use cookies and similar tracking technologies to track the activity on our Service and hold certain information.</li>
              </ul>
              
              <Separator className="my-6" />

              <h3>2. Use of Data</h3>
              <p>
                iNteract AOE uses the collected data for various purposes:
              </p>
              <ul>
                <li>To provide and maintain the Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
                <li>To provide customer care and support</li>
                <li>To provide analysis or valuable information so that we can improve the Service</li>
                <li>To monitor the usage of the Service</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>

              <Separator className="my-6" />

              <h3>3. Transfer Of Data</h3>
              <p>
                Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ from those from your jurisdiction.
              </p>
              <p>
                Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.
              </p>

              <Separator className="my-6" />

              <h3>4. Security Of Data</h3>
              <p>
                The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>

              <Separator className="my-6" />

              <h3>5. Your Data Protection Rights</h3>
              <p>
                You have certain data protection rights. iNteract AOE aims to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.
              </p>

              <Separator className="my-6" />

              <h3>6. Changes To This Privacy Policy</h3>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
              </p>

              <Separator className="my-6" />

              <h3>7. Contact Us</h3>
              <p>
                If you have any questions about this Privacy Policy, please contact us by email: johan@interactaoe.co.za
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
