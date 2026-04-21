
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

const AI_CONTENT_HEADLINE_KEY = 'ai-content-headline';
const AI_CONTENT_SUBHEADING_KEY = 'ai-content-subheading';

export default function AiContentManagerPage() {
  const [headline, setHeadline] = useState('');
  const [subheading, setSubheading] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Load saved content from localStorage on component mount
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
        <h2 className="text-2xl font-bold tracking-tight mb-2">AI Assistant Content Manager</h2>
        <p className="text-muted-foreground max-w-3xl">
          Customize the default welcome messages and information your AI assistant provides to customers.
        </p>
      </div>

      <Separator />

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Content Editor</CardTitle>
            <CardDescription>
              This content will be shown above the AI chat when a customer scans a QR code if no campaign-specific content is set.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="headline">Default Headline</Label>
              <Input
                id="headline"
                placeholder="e.g., Welcome to Our Store!"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subheading">Default Subheading / Welcome Text</Label>
              <Textarea
                id="subheading"
                placeholder="Add a brief welcome message or some useful information for your customers."
                value={subheading}
                onChange={(e) => setSubheading(e.target.value)}
                rows={5}
              />
            </div>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Default Content
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              How the default content will appear on the interaction screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full max-w-sm mx-auto p-4 border rounded-lg bg-muted/50 text-center">
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
