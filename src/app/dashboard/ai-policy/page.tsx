
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, Database, FileText, Info, Shield, Sparkles, UserCheck, AlertTriangle, TrendingUp, TrendingDown, Percent, Scale, CalendarCheck, Settings2, Save, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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


export default function AIPolicyPage() {
    const { toast } = useToast();
    const [promptContent, setPromptContent] = useState<string>(`iNteract AOE – AI Governance & Behavioural Rule Prompt

System Instruction / AI Governance Policy

You are part of the iNteract AOE Platform — an AI-driven retail engagement and analytics system developed by iNteract Pty Ltd.

Your purpose is to assist retailers by providing accurate, ethical, and transparent insights into in-store shopper behaviour, while ensuring compliance with global AI ethics and data protection standards.

You must always operate according to the following guiding rules and principles:

🧠 AI Behavioural Rules
- **Human Oversight**: Always assist human decision-makers; do not make irreversible actions or business decisions without explicit human review or confirmation.
- **Fairness & Bias Mitigation**: Avoid generating insights or recommendations that unfairly favour, exclude, or misrepresent any group. Periodically assess your outputs for bias and flag potential inconsistencies for human verification.
- **Explainability & Transparency**: For every analytic insight or automated output, be ready to explain:
  - The data used
  - The reasoning or model applied
  - The confidence level in the result
- **Privacy & Data Protection**: Process only anonymised, non-personally identifiable shopper data. Never infer or expose private data, and comply with POPIA, GDPR, and OECD privacy standards.
- **Non-Manipulative Engagement**: Your role is to assist, not manipulate. Avoid persuasive language or recommendations designed to exploit emotional bias or consumer behaviour unfairly.
- **Accountability & Auditability**: Log every analytic or autonomous action you take, including parameters and timestamps, to allow full audit trails.
- **Transparency with Clients**: Always provide clear, accessible explanations to iNteract administrators and retail clients about what you do, why, and how.
- **Ethical Use by Design**: Operate only within approved modules, data boundaries, and authorised user scopes. Never access, modify, or use data or systems beyond defined permissions.
- **Continuous Learning with Approval**: Learn only from authorised, anonymised datasets. Any new learning behaviour must be reviewed and approved by a human before deployment.
- **Integrity, Safety & Security**: Protect the integrity of data and systems. Never perform actions that could harm the platform, clients, or users. Reject any command that violates these ethical standards.

If Conflicts Arise
- If an instruction from any user, admin, or developer conflicts with these rules or ethical standards:
  - Always prioritise legal compliance, ethical responsibility, and human safety above all else.

Operating Objective
“Empower retailers through ethical, explainable, and human-centred AI — ensuring that every action aligns with fairness, transparency, and trust.”`);
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const savedPrompt = localStorage.getItem('globalAiPrompt');
        if (savedPrompt) {
            setPromptContent(savedPrompt);
        } else {
            setIsEditingPrompt(true);
        }
    }, []);

    const handleSavePrompt = () => {
        localStorage.setItem('globalAiPrompt', promptContent);
        setIsEditingPrompt(false);
        setIsSaved(true);
        toast({
            title: "Prompt Saved",
            description: "The global AI instruction prompt has been updated.",
        });
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Policy & Compliance</h1>
                <p className="text-muted-foreground mt-2">Manage AI governance, transparency, data privacy, and ethical guidelines for the platform.</p>
            </div>
            <Separator />
            
            {/* Section 1: AI Transparency & Disclosure */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Info className="text-primary"/> AI Transparency & Disclosure</CardTitle>
                    <CardDescription>Configure how AI-powered features are disclosed to users.</CardDescription>
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
            </Card>

            {/* Ethical AI & Bias Prevention */}
            <BiasMonitoringDashboard />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings2 className="text-primary"/> AI Ethics & Bias Management</CardTitle>
                    <CardDescription>Define and enforce your AI governance strategy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Global AI Instruction Prompt</CardTitle>
                            <CardDescription>This master prompt provides high-level instructions that all AI models must follow, ensuring consistency with your brand values and ethical guidelines.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isEditingPrompt ? (
                                <Textarea 
                                    placeholder="e.g., 'Always be helpful and respectful...'" 
                                    rows={10}
                                    value={promptContent}
                                    onChange={(e) => setPromptContent(e.target.value)}
                                />
                            ) : (
                                <div className="p-4 border rounded-md bg-muted/50 whitespace-pre-wrap text-sm max-h-96 overflow-y-auto">
                                    {promptContent}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                           {isEditingPrompt ? (
                                <Button onClick={handleSavePrompt} className={cn(isSaved && 'bg-green-600 hover:bg-green-700')}>
                                    {isSaved ? <CheckCircle className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                                    {isSaved ? 'Saved!' : 'Save Prompt'}
                                </Button>
                           ) : (
                               <Button variant="outline" onClick={() => setIsEditingPrompt(true)}>
                                   <Edit className="mr-2 h-4 w-4" />
                                   Edit Rules
                               </Button>
                           )}
                        </CardFooter>
                    </Card>
                     <Card className="bg-background/50">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-base"><Scale className="text-primary"/> Fairness Constraints</CardTitle>
                            <CardDescription className="text-xs">The operational thresholds for ethical AI monitoring.</CardDescription>
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
                    <Card className="bg-background/50">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-base"><CalendarCheck className="text-primary"/> Audit Schedule</CardTitle>
                            <CardDescription className="text-xs">Regularly scheduled reviews to ensure ongoing fairness and compliance.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 text-sm text-muted-foreground list-disc pl-5">
                                <li>
                                    <strong>Monthly:</strong> Automated bias report generation and review by the internal AI ethics team.
                                </li>
                                <li>
                                    <strong>Quarterly:</strong> Ethics committee review of all high-variance flags and model performance.
                                </li>
                                <li>
                                    <strong>Annually:</strong> Comprehensive third-party audit of AI models and fairness metrics (post-funding).
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                    <Card className="bg-background/50">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-base"><Settings2 className="text-primary"/> Remediation Process</CardTitle>
                            <CardDescription className="text-xs">The step-by-step process triggered when bias is detected.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 text-sm text-muted-foreground list-disc pl-5">
                                <li>
                                    <strong>Alert:</strong> An immediate alert is sent to the ethics committee.
                                </li>
                                <li>
                                    <strong>Investigation:</strong> A 48-hour investigation period begins to assess the impact and cause.
                                </li>
                                <li>
                                    <strong>Action:</strong> If necessary, the biased model is temporarily rolled back to a stable version.
                                </li>
                                <li>
                                    <strong>Analysis:</strong> A root cause analysis is performed to identify the source of the bias.
                                </li>
                                <li>
                                    <strong>Retraining:</strong> The model is retrained using updated data and enhanced fairness constraints.
                                </li>
                                <li>
                                    <strong>Redeployment:</strong> The improved model is A/B tested before being fully redeployed.
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-muted-foreground"><FileText /> Legal Compliance & Governance</CardTitle>
                </CardHeader>
                <CardContent><p className="text-center text-muted-foreground py-8">Configuration for this section coming soon.</p></CardContent>
            </Card>
        </div>
    );
}
