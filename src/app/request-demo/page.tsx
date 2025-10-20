
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useState } from "react";

export default function RequestDemoPage() {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [stores, setStores] = useState('');
  const [message, setMessage] = useState('');

  const mailtoHref = `mailto:johan@interactaoe.co.za?subject=Request%20a%20Demo&body=${encodeURIComponent(
    `Company Name: ${companyName}\nContact Name: ${contactName}\nEmail: ${email}\nPhone: ${phone}\nNumber of Stores: ${stores}\n\nMessage:\n${message}`
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
            <CardTitle className="text-3xl">Request a Demo</CardTitle>
            <CardDescription>
              See how iNteract AOE can revolutionize your in-store experience.
              Fill out the form below and we'll be in touch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g., Example Retail Group"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">Your Name</Label>
                  <Input
                    id="contactName"
                    placeholder="e.g., Jane Doe"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g., jane.doe@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+27 12 345 6789" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stores">Number of Stores</Label>
                <Select onValueChange={setStores} value={stores}>
                  <SelectTrigger id="stores">
                    <SelectValue placeholder="Select a range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 stores</SelectItem>
                    <SelectItem value="11-50">11-50 stores</SelectItem>
                    <SelectItem value="51-200">51-200 stores</SelectItem>
                    <SelectItem value="200+">200+ stores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Your Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us a bit about your needs or any specific questions you have."
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
                Submit Request
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
