
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, BrainCircuit, CheckCircle, Clock, Cog, MessageSquare, Percent, PieChart, 
  Send, Smile, Sparkles, Star, TrendingUp, XCircle, Users, BarChart2, AlertCircle, TrendingDown, Save
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const responseTimeData = [
  { time: '10:00', avg: 1.1, p95: 1.8 },
  { time: '11:00', avg: 1.3, p95: 2.1 },
  { time: '12:00', avg: 1.2, p95: 1.9 },
  { time: '13:00', avg: 1.5, p95: 2.5 },
  { time: '14:00', avg: 1.4, p95: 2.2 },
];

const queryCategoriesData = [
  { name: 'Stock Availability', value: 400 },
  { name: 'Product Details', value: 300 },
  { name: 'Price & Promotions', value: 300 },
  { name: 'Store Information', value: 200 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];


function MetricCard({ title, value, trend, icon: Icon, trendDirection = 'up' }: { title: string, value: string, trend?: string, icon: React.ElementType, trendDirection?: 'up' | 'down' }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {trend && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {trendDirection === 'up' ? <TrendingUp className="h-3 w-3 text-green-500"/> : <TrendingDown className="h-3 w-3 text-red-500"/>}
                        {trend}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function ConversationItem({ customerId }: { customerId: number }) {
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    // Generate a more realistic, client-side timestamp
    setTimestamp(new Date().toLocaleTimeString());
  }, []);

  return (
    <div>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground"/>
                <p className="text-sm font-medium">Customer #{customerId || '...'}</p>
            </div>
            <div className="flex items-center gap-1.5 text-yellow-500">
                {[...Array(5)].map((_, j) => <Star key={j} className={`h-4 w-4 ${j < 4 ? 'fill-current' : ''}`} />)}
            </div>
        </div>
        <p className="text-xs text-muted-foreground ml-6">"How do I clean this product?" &rarr; AI: "It's top-rack dishwasher safe!" ({timestamp})</p>
    </div>
  );
}


export default function AIPerformanceMonitor() {
  const [testPrompt, setTestPrompt] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [customerIds, setCustomerIds] = useState<number[]>([]);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Generate customer IDs on the client-side to avoid hydration mismatch
    setCustomerIds(Array.from({ length: 5 }, () => Math.floor(1000 + Math.random() * 9000)));
  }, []);

  const handleTestPrompt = () => {
    if (!testPrompt) return;
    setIsTesting(true);
    setTimeout(() => {
        setTestResponse(`This is a simulated AI response to your prompt: "${testPrompt}". It demonstrates the model's ability to understand context and provide relevant information.`);
        setIsTesting(false);
    }, 1200);
  };
    
  const handleSavePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
        title: "Prompt Saved",
        description: "The improved prompt has been saved and will be used for future interactions."
    });
    setIsPromptModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Performance Monitor</h1>
        <p className="text-muted-foreground mt-2">Monitor AI interactions, model performance, and optimization insights.</p>
      </div>
      
      {/* Header Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Total Conversations" value="45,672" trend="+15% this week" icon={MessageSquare} />
        <MetricCard title="Avg. Response Time" value="1.2s" trend="-0.1s this week" icon={Clock} trendDirection="down" />
        <MetricCard title="Success Rate" value="89.4%" trend="+1.2% this week" icon={CheckCircle} />
        <MetricCard title="Customer Satisfaction" value="4.3/5" trend="+0.1 this week" icon={Smile} />
        <MetricCard title="Upsell Success" value="23.1%" trend="-0.5% this week" icon={TrendingUp} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Conversation Analytics</CardTitle>
                    <CardDescription>Real-time feed of AI interactions with customers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-96">
                        <div className="space-y-4 pr-4">
                            {customerIds.map((id, i) => (
                                <ConversationItem key={i} customerId={id} />
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Optimization Insights</CardTitle>
                    <CardDescription>Automated recommendations to improve AI performance and reduce costs.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Insight</TableHead>
                                <TableHead>Recommendation</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell><Badge variant="outline" className="text-yellow-600 border-yellow-500/30">Underperforming</Badge></TableCell>
                                <TableCell>Prompt for "return policy" has a 30% failure rate.</TableCell>
                                <TableCell>
                                     <Dialog open={isPromptModalOpen} onOpenChange={setIsPromptModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline">Improve Prompt</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <form onSubmit={handleSavePrompt}>
                                                <DialogHeader>
                                                    <DialogTitle>Improve Prompt: Return Policy</DialogTitle>
                                                    <DialogDescription>
                                                        Refine the prompt to improve its success rate and provide better answers.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="py-6 space-y-4">
                                                    <div>
                                                        <Label htmlFor="original-prompt" className="font-semibold">Original Prompt</Label>
                                                        <Textarea id="original-prompt" readOnly disabled className="mt-1 bg-muted" value="You are a helpful store assistant. Answer questions about the return policy."/>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="new-prompt" className="font-semibold">Improved Prompt</Label>
                                                        <Textarea id="new-prompt" rows={5} placeholder="Add more context, examples, or constraints to improve the AI's response." className="mt-1"/>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button type="button" variant="ghost" onClick={() => setIsPromptModalOpen(false)}>Cancel</Button>
                                                    <Button type="submit"><Save className="mr-2 h-4 w-4" /> Save Prompt</Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell><Badge variant="outline" className="text-blue-600 border-blue-500/30">Cost Saving</Badge></TableCell>
                                <TableCell>Switching to a faster model could save R1.2k/mo with minimal impact.</TableCell>
                                <TableCell>
                                    <Button asChild size="sm" variant="outline">
                                        <Link href="/retailer-mvp/ab-testing">A/B Test Models</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Model Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[150px] w-full">
                        <LineChart data={responseTimeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} unit="s"/>
                            <Tooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Line type="monotone" dataKey="avg" stroke="#8884d8" name="Avg Time"/>
                            <Line type="monotone" dataKey="p95" stroke="#82ca9d" name="95th Percentile"/>
                        </LineChart>
                    </ChartContainer>
                    <div className="grid grid-cols-2 gap-4 text-center text-sm mt-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <p className="font-semibold text-green-800">API Uptime</p>
                            <p className="text-lg font-bold text-green-900">99.98%</p>
                        </div>
                         <div className="p-2 bg-red-100 rounded-lg">
                            <p className="font-semibold text-red-800">Error Rate</p>
                            <p className="text-lg font-bold text-red-900">0.02%</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Common Query Categories</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[200px] w-full">
                        <RechartsPieChart>
                            <Pie data={queryCategoriesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8">
                                {queryCategoriesData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<ChartTooltipContent />} />
                            <Legend iconSize={10} />
                        </RechartsPieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
      </div>

       <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Cog className="text-primary"/> AI Configuration Testing</CardTitle>
                <CardDescription>Test prompts and settings in a live environment before deploying.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Textarea 
                            placeholder="Enter a test prompt... e.g., 'What is this made of?'" 
                            value={testPrompt} 
                            onChange={e => setTestPrompt(e.target.value)}
                            rows={4}
                        />
                        <Button onClick={handleTestPrompt} disabled={isTesting}>
                            {isTesting ? 'Simulating...' : <><Send className="mr-2 h-4 w-4"/> Test Prompt</>}
                        </Button>
                    </div>
                    <div className="p-4 bg-muted rounded-md min-h-[120px]">
                        <h4 className="font-semibold text-sm mb-2">Simulated AI Response:</h4>
                        <p className="text-sm text-muted-foreground italic">
                            {testResponse || 'Response will appear here...'}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>

    </div>
  );
}
