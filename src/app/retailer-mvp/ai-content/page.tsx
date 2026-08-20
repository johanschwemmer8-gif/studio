
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { HubNav } from '@/components/dashboard/hub-nav';

const AI_CONTENT_HEADLINE_KEY = 'ai-content-headline';
const AI_CONTENT_SUBHEADING_KEY = 'ai-content-subheading';

export default function AiContentManagerPage() {
  const [headline, setHeadline] = useState('');
  const [subheading, setSubheading] = useState('');
  const { toast } = useToast();

  const aiHubItems = [
    { label: "Settings", href: "/retailer-mvp/ai-configuration" },
    { label: "Welcome & Content", href: "/retailer-mvp/ai-content" },
    { label: "Performance Audit", href: "/retailer-mvp/ai-performance" },
    { label: "Ethics & Policy", href: "/retailer-mvp/ai-policy" },
  ];

  useEffect(() => {
    const savedHeadline = localStorage.getItem(AI_CONTENT_HEADLINE_KEY);
    const savedSubheading = localStorage.getItem(AI_CONTENT_SUBHEADING_KEY);
    if (savedHeadline) setHeadline(savedHeadline);
    if (savedSubheading) setSubheading(savedSubheading);
  }, []);

  const handleSave = () => {
    localStorage.setItem(AI_CONTENT_HEADLINE_KEY, headline);
    localStorage.setItem(AI_CONTENT_SUBHEADING_KEY, subheading);
    toast({
      title: 'Content Saved',
      description: 'Your AI assistant content has been updated.',
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight uppercase">Ari Experience</h2>
        <p className="text-muted-foreground mt-2">
          Customize the welcome messages and product-level information provided by Ari.
        </p>
      </div>

      <HubNav items={aiHubItems} />
      <Separator />

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome Content Editor</CardTitle>
            <CardDescription>
              This content appears when a shopper first engages with Ari.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                placeholder="e.g., Welcome to Our Store!"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subheading">Welcome Message</Label>
              <Textarea
                id="subheading"
                placeholder="Add a brief welcome message or instructions for your customers."
                value={subheading}
                onChange={(e) => setSubheading(e.target.value)}
                rows={5}
              />
            </div>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Content
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              A snapshot of the current message content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full max-w-sm mx-auto p-4 border rounded-lg bg-muted/50 text-center min-h-[150px] flex flex-col justify-center">
              {headline ? (
                <h1 className="text-xl font-bold">{headline}</h1>
              ) : (
                <div className="h-7 bg-muted rounded w-3/4 mx-auto"></div>
              )}
              {subheading ? (
                <p className="text-muted-foreground mt-2 text-sm">{subheading}</p>
              ) : (
                <div className="space-y-2 mt-2">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6 mx-auto"></div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
