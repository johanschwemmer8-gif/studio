
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Info, Shield, Sparkles, UserCheck, AlertTriangle, TrendingUp, TrendingDown, Scale, CalendarCheck, Settings2, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HubNav } from '@/components/dashboard/hub-nav';

const consentOptions = [
    { id: 'recommendations', label: 'Product Recommendation AI' },
    { id: 'chatbot', label: 'Customer Service Chatbot' },
    { id: 'personalization', label: 'Personalization & Profiling' },
    { id: 'cross-sell', label: 'Cross-selling & Upselling AI' },
    { id: 'behavioral-analysis', label: 'Behavioral Analysis & Insights' },
];


function BiasMonitoringDashboard() {
  const [report, setReport] = useState<any | null>(null);

  useEffect(() => {
    const metrics = {
      affluent: {
        avg_offer_acceptance: 0.65,
        avg_discount: 0.18,
        engagement_rate: 0.75,
      },
      township: {
        avg_offer_acceptance: 0.53,
        avg_discount: 0.22,
        engagement_rate: 0.68,
      },
    };

    setReport({
      timestamp: new Date(),
      metrics,
    });
  }, []);

  if (!report) {
    return (
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Ethical AI & Bias Prevention</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64 animate-pulse bg-muted rounded-md" />
            </CardContent>
        </Card>
    );
  }

  const { affluent, township } = report.metrics;
  const variance = {
    acceptance_parity: Math.abs(affluent.avg_offer_acceptance - township.avg_offer_acceptance),
    discount_parity: Math.abs(affluent.avg_discount - township.avg_discount),
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Ethical AI Monitoring</CardTitle>
              <CardDescription>
                  Grounded comparison of AI performance indicators across store segments.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <Table>
                  <TableHeader>
                      <TableRow className="text-[10px] uppercase font-black">
                          <TableHead>Metric</TableHead>
                          <TableHead className="text-center">Affluent</TableHead>
                          <TableHead className="text-center">Township</TableHead>
                          <TableHead className="text-center">Variance</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      <TableRow>
                          <TableCell className="font-medium text-xs">Offer Acceptance</TableCell>
                          <TableCell className="text-center text-sm font-semibold">{formatPercent(affluent.avg_offer_acceptance)}</TableCell>
                          <TableCell className="text-center text-sm font-semibold">{formatPercent(township.avg_offer_acceptance)}</TableCell>
                           <TableCell className="text-center text-sm font-bold text-destructive">
                             {formatPercent(variance.acceptance_parity)}
                           </TableCell>
                      </TableRow>
                      <TableRow>
                          <TableCell className="font-medium text-xs">Avg. Discount</TableCell>
                          <TableCell className="text-center text-sm font-semibold">{formatPercent(affluent.avg_discount)}</TableCell>
                          <TableCell className="text-center text-sm font-semibold">{formatPercent(township.avg_discount)}</TableCell>
                           <TableCell className="text-center text-sm font-bold text-yellow-600">
                             {formatPercent(variance.discount_parity)}
                           </TableCell>
                      </TableRow>
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
  );
}


export default function RetailerAIPolicyPage() {
    const { toast } = useToast();

    const aiHubItems = [
      { label: "Settings", href: "/retailer-mvp/ai-configuration" },
      { label: "Welcome & Content", href: "/retailer-mvp/ai-content" },
      { label: "Performance Audit", href: "/retailer-mvp/ai-performance" },
      { label: "Ethics & Policy", href: "/retailer-mvp/ai-policy" },
    ];

    const handleSaveSettings = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        toast({
            title: "Settings Saved",
            description: "Your AI policy and compliance settings have been updated.",
        });
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">Ari Experience</h1>
                <p className="text-muted-foreground mt-2">Manage your AI governance, transparency, and data privacy settings.</p>
            </div>

            <HubNav items={aiHubItems} />
            <Separator />
            
            <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Info className="text-primary"/> Transparency & Disclosure</CardTitle>
                        <CardDescription>Configure how AI-powered features are disclosed to customers.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <Label htmlFor="ai-badge" className="font-semibold text-xs">Display "AI-Powered" Badges</Label>
                                <p className="text-[10px] text-muted-foreground">Show markers on all UI components using Ari.</p>
                            </div>
                            <Switch id="ai-badge" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <Label htmlFor="show-confidence" className="font-semibold text-xs">Show Confidence Scores</Label>
                                <p className="text-[10px] text-muted-foreground">Display Ari's confidence in its recommendations.</p>
                            </div>
                            <Switch id="show-confidence" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveSettings} size="sm">Save Disclosure Rules</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Shield className="text-primary"/> Data Privacy</CardTitle>
                        <CardDescription>Manage customer consent and processing boundaries.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 p-4 border rounded-lg">
                            <p className="text-[10px] font-black uppercase text-muted-foreground pb-2 border-b">Allow shoppers to opt-out of:</p>
                            {consentOptions.slice(0, 3).map(option => (
                                <div key={option.id} className="flex items-center space-x-2">
                                    <Checkbox id={option.id} defaultChecked />
                                    <Label htmlFor={option.id} className="font-normal text-xs">{option.label}</Label>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveSettings} size="sm">Save Privacy Rules</Button>
                    </CardFooter>
                </Card>
            </div>

            <BiasMonitoringDashboard />
        </div>
    );
}
