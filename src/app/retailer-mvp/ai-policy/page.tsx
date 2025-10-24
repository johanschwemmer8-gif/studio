
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, Database, FileText, Info, Shield, Sparkles, UserCheck, AlertTriangle, TrendingUp, TrendingDown, Percent, Scale, CalendarCheck, Settings2, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    // This logic now runs only on the client, after hydration
    const metrics = {
      affluent: {
        avg_offer_acceptance: 0.65, // 65%
        avg_discount: 0.18, // 18%
        engagement_rate: 0.75, // 75%
      },
      township: {
        avg_offer_acceptance: 0.53, // 53%
        avg_discount: 0.22, // 22%
        engagement_rate: 0.68, // 68%
      },
    };

    setReport({
      timestamp: new Date(),
      metrics,
    });
  }, []);

  if (!report) {
    // Render a skeleton or placeholder on the server and initial client render
    return (
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Ethical AI & Bias Prevention</CardTitle>
              <CardDescription>
                  Monitor key AI performance indicators across different customer segments to identify and mitigate potential bias.
              </CardDescription>
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

  const alerts = [];
  if (variance.acceptance_parity > 0.10) {
    alerts.push('High variance in acceptance rates detected between store segments.');
  }
   if (variance.discount_parity > 0.05) {
    alerts.push('Significant difference in average discount values.');
  }

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> Ethical AI & Bias Prevention</CardTitle>
              <CardDescription>
                  Monitor key AI performance indicators across different customer segments to identify and mitigate potential bias.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              {alerts.length > 0 && (
                  <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Bias Alert</AlertTitle>
                      <AlertDescription>
                          <ul className="list-disc pl-5">
                              {alerts.map((alert, i) => <li key={i}>{alert}</li>)}
                          </ul>
                      </AlertDescription>
                  </Alert>
              )}
              
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Metric</TableHead>
                          <TableHead className="text-center">Affluent Stores</TableHead>
                          <TableHead className="text-center">Township Stores</TableHead>
                          <TableHead className="text-center">Variance</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      <TableRow>
                          <TableCell className="font-medium">Avg. Offer Acceptance</TableCell>
                          <TableCell className="text-center text-lg font-semibold">{formatPercent(affluent.avg_offer_acceptance)}</TableCell>
                          <TableCell className="text-center text-lg font-semibold">{formatPercent(township.avg_offer_acceptance)}</TableCell>
                           <TableCell className="text-center text-lg font-bold text-destructive">
                             <div className="flex items-center justify-center gap-1">
                                <TrendingUp className="h-4 w-4"/>
                                {formatPercent(variance.acceptance_parity)}
                             </div>
                           </TableCell>
                      </TableRow>
                      <TableRow>
                          <TableCell className="font-medium">Avg. Discount Offered</TableCell>
                          <TableCell className="text-center text-lg font-semibold">{formatPercent(affluent.avg_discount)}</TableCell>
                          <TableCell className="text-center text-lg font-semibold">{formatPercent(township.avg_discount)}</TableCell>
                           <TableCell className="text-center text-lg font-bold text-yellow-600">
                             <div className="flex items-center justify-center gap-1">
                                <TrendingDown className="h-4 w-4"/>
                                {formatPercent(variance.discount_parity)}
                             </div>
                           </TableCell>
                      </TableRow>
                      <TableRow>
                          <TableCell className="font-medium">Engagement Rate</TableCell>
                          <TableCell className="text-center text-lg font-semibold">{formatPercent(affluent.engagement_rate)}</TableCell>
                          <TableCell className="text-center text-lg font-semibold">{formatPercent(township.engagement_rate)}</TableCell>
                           <TableCell className="text-center text-muted-foreground">--</TableCell>
                      </TableRow>
                  </TableBody>
              </Table>
              
              <CardFooter className="text-xs text-muted-foreground pt-4">
                Last updated: {report.timestamp.toLocaleString()}
              </CardFooter>
          </CardContent>
      </Card>
  );
}


export default function RetailerAIPolicyPage() {
    const { toast } = useToast();

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
                <h1 className="text-3xl font-bold tracking-tight">AI Policy & Compliance</h1>
                <p className="text-muted-foreground mt-2">Manage your AI governance, transparency, and data privacy settings.</p>
            </div>
            <Separator />
            
            {/* Section 1: AI Transparency & Disclosure */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Info className="text-primary"/> AI Transparency & Disclosure</CardTitle>
                    <CardDescription>Configure how AI-powered features are disclosed to your customers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="ai-badge" className="font-semibold">Display "AI-Powered" Badges</Label>
                            <p className="text-sm text-muted-foreground">Show a small badge on all UI components that use AI.</p>
                        </div>
                        <Switch id="ai-badge" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="how-it-works" className="font-semibold">Enable "How AI Works" Modals</Label>
                            <p className="text-sm text-muted-foreground">Allow users to click an info icon to learn about the AI feature.</p>
                        </div>
                        <Switch id="how-it-works" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="show-confidence" className="font-semibold">Show AI Confidence Scores</Label>
                            <p className="text-sm text-muted-foreground">Display a score indicating the AI's confidence in its recommendation.</p>
                        </div>
                        <Switch id="show-confidence" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveSettings}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Transparency Settings
                    </Button>
                </CardFooter>
            </Card>

            {/* Section 2: Data Privacy & Protection */}
            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2"><Shield className="text-primary"/> Data Privacy & Protection</CardTitle>
                    <CardDescription>Manage customer consent and data processing rules for AI.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><UserCheck /> Customer Consent Management</h4>
                        <div className="space-y-3 p-4 border rounded-lg">
                            <p className="text-sm text-muted-foreground pb-2 border-b">Allow users to opt-in or opt-out of specific AI features.</p>
                            {consentOptions.map(option => (
                                <div key={option.id} className="flex items-center space-x-2">
                                    <Checkbox id={option.id} defaultChecked />
                                    <Label htmlFor={option.id} className="font-normal">{option.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Database /> Data Processing Controls</h4>
                        <div className="space-y-4 p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="data-anonymization" className="font-semibold">Enable Data Anonymization for Training</Label>
                                    <p className="text-sm text-muted-foreground">Remove personally identifiable information from data used for AI model training.</p>
                                </div>
                                <Switch id="data-anonymization" defaultChecked />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="retention-period">Data Retention Period (Days)</Label>
                                <Input id="retention-period" type="number" defaultValue="90" className="max-w-xs" />
                                <p className="text-xs text-muted-foreground">Automatically delete user interaction data after this period.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleSaveSettings}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Privacy Settings
                    </Button>
                </CardFooter>
            </Card>

            {/* Ethical AI & Bias Prevention */}
            <BiasMonitoringDashboard />

            {/* Read-only Platform Governance section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings2 className="text-primary"/> Platform AI Governance</CardTitle>
                    <CardDescription>
                        These are the global AI ethics and governance rules set by the iNteract AOE platform. They are read-only.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle className="text-base">Global AI Instruction Prompt</CardTitle>
                            <CardDescription>This master prompt provides high-level instructions that all AI models must follow.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-48 w-full rounded-md border bg-background p-4">
                                <div className="text-sm italic whitespace-pre-wrap">
iNteract AOE – AI Governance & Behavioural Rule Prompt
<br/><br/>
<strong>System Instruction / AI Governance Policy</strong>
<br/><br/>
You are part of the iNteract AOE Platform — an AI-driven retail engagement and analytics system developed by iNteract Pty Ltd.
<br/><br/>
Your purpose is to assist retailers by providing accurate, ethical, and transparent insights into in-store shopper behaviour, while ensuring compliance with global AI ethics and data protection standards.
<br/><br/>
You must always operate according to the following guiding rules and principles:
<br/><br/>
<strong>🧠 AI Behavioural Rules</strong>
<ul className="list-disc pl-5 space-y-2 mt-2">
  <li><strong>Human Oversight</strong>: Always assist human decision-makers; do not make irreversible actions or business decisions without explicit human review or confirmation.</li>
  <li><strong>Fairness & Bias Mitigation</strong>: Avoid generating insights or recommendations that unfairly favour, exclude, or misrepresent any group. Periodically assess your outputs for bias and flag potential inconsistencies for human verification.</li>
  <li><strong>Explainability & Transparency</strong>: For every analytic insight or automated output, be ready to explain:
    <ul className="list-circle pl-5 mt-1">
      <li>The data used</li>
      <li>The reasoning or model applied</li>
      <li>The confidence level in the result</li>
    </ul>
  </li>
  <li><strong>Privacy & Data Protection</strong>: Process only anonymised, non-personally identifiable shopper data. Never infer or expose private data, and comply with POPIA, GDPR, and OECD privacy standards.</li>
  <li><strong>Non-Manipulative Engagement</strong>: Your role is to assist, not manipulate. Avoid persuasive language or recommendations designed to exploit emotional bias or consumer behaviour unfairly.</li>
  <li><strong>Accountability & Auditability</strong>: Log every analytic or autonomous action you take, including parameters and timestamps, to allow full audit trails.</li>
  <li><strong>Transparency with Clients</strong>: Always provide clear, accessible explanations to iNteract administrators and retail clients about what you do, why, and how.</li>
  <li><strong>Ethical Use by Design</strong>: Operate only within approved modules, data boundaries, and authorised user scopes. Never access, modify, or use data or systems beyond defined permissions.</li>
  <li><strong>Continuous Learning with Approval</strong>: Learn only from authorised, anonymised datasets. Any new learning behaviour must be reviewed and approved by a human before deployment.</li>
  <li><strong>Integrity, Safety & Security</strong>: Protect the integrity of data and systems. Never perform actions that could harm the platform, clients, or users. Reject any command that violates these ethical standards.</li>
</ul>
<br/>
<strong>If Conflicts Arise</strong>
<ul className="list-disc pl-5 space-y-2 mt-2">
  <li>If an instruction from any user, admin, or developer conflicts with these rules or ethical standards:
    <ul className="list-circle pl-5 mt-1">
      <li>Always prioritise legal compliance, ethical responsibility, and human safety above all else.</li>
    </ul>
  </li>
</ul>
<br/>
<strong>Operating Objective</strong>
<br/>
“Empower retailers through ethical, explainable, and human-centred AI — ensuring that every action aligns with fairness, transparency, and trust.”
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                     <Card className="bg-muted/50">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-base"><Scale className="text-primary"/> Fairness Constraints</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 text-sm text-muted-foreground list-disc pl-5">
                                <li>
                                    <strong>Maximum acceptable variance in offer acceptance rates:</strong> <Badge variant="outline">10%</Badge>
                                </li>
                                <li>
                                <strong>Minimum parity in recommendation quality across segments:</strong> No significant statistical difference should be detected.
                                </li>
                                <li>
                                <strong>Alert threshold:</strong> If any key fairness metric deviates by more than <Badge variant="outline">15%</Badge>, it will be flagged for review.
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
}
