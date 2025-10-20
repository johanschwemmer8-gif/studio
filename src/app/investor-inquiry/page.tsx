
'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useState } from "react";

export default function InvestorInquiryPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');

  const mailtoHref = `mailto:johan@interactaoe.co.za?subject=Investor%20Inquiry&body=${encodeURIComponent(
    `Full Name: ${fullName}\nEmail: ${email}\nCompany / Firm: ${company}\n\nMessage:\n${message}`
  )}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4 lg:p-8">
      <div className="w-full max-w-2xl">
        <Button asChild variant="ghost" className="mb-4 -ml-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Investor Inquiry</CardTitle>
            <CardDescription>
              We appreciate your interest in iNteract AOE. Please fill out the
              form below, and we will be in touch shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="e.g., Jane Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g., jane.doe@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company / Firm (Optional)</Label>
                <Input
                  id="company"
                  placeholder="e.g., Example Ventures"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Please share any specific questions or areas of interest."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild size="lg" className="w-full">
              <a href={mailtoHref}>
                <Send className="mr-2 h-4 w-4" />
                Submit Inquiry
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
