
'use client';

import { useState, useTransition } from 'react';
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, Clock, MessageSquare, Send, Smile, Star, TrendingUp, Users, AlertTriangle, TrendingDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { HubNav } from '@/components/dashboard/hub-nav';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const responseTimeData = [
  { time: '10:00', avg: 1.2, p95: 2.5 },
  { time: '10:05', avg: 1.4, p95: 2.8 },
  { time: '10:10', avg: 1.1, p95: 2.2 },
  { time: '10:15', avg: 1.5, p95: 3.1 },
  { time: '10:20', avg: 1.3, p95: 2.6 },
];

const queryCategoriesData = [
    { name: 'Pricing', value: 400 },
    { name: 'Availability', value: 300 },
    { name: 'Features', value: 300 },
    { name: 'Shipping', value: 200 },
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

export default function AIPerformanceMonitor() {
  const [testPrompt, setTestPrompt] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const aiHubItems = [
    { label: "Settings", href: "/retailer-mvp/ai-configuration" },
    { label: "Welcome & Content", href: "/retailer-mvp/ai-content" },
    { label: "Performance Audit", href: "/retailer-mvp/ai-performance" },
    { label: "Ethics & Policy", href: "/retailer-mvp/ai-policy" },
  ];

  const mockConversations = [
      { id: 1, customerId: 4381, rating: 5, query: "Is this waterproof?", response: "Yes, it's fully waterproof!" },
      { id: 2, customerId: 8219, rating: 4, query: "What colors does it come in?", response: "It comes in blue, black, and red." },
      { id: 3, customerId: 1023, rating: 5, query: "What's the warranty?", response: "It has a 2-year manufacturer warranty." },
      { id: 4, customerId: 9845, rating: 3, query: "When will it be back in stock?", response: "We expect a new shipment next week." },
      { id: 5, customerId: 2398, rating: 5, query: "Can I get a discount?", response: "There's a 10% off coupon available today!" },
  ];

  const handleTestPrompt = () => {
    if (!testPrompt) return;
    setIsTesting(true);
    setTimeout(() => {
        setTestResponse(`This is a simulated AI response to your prompt: "${testPrompt}". It demonstrates the model's ability to understand context and provide relevant information.`);
        setIsTesting(false);
    }, 1200);
  };
    
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight uppercase">Ari Experience</h1>
        <p className="text-muted-foreground mt-2">Monitor AI interactions, model performance, and optimization insights.</p>
      </div>

      <HubNav items={aiHubItems} />

      <Alert className="bg-primary/5 border-primary/10">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <AlertTitle className="text-xs font-black uppercase tracking-widest">Performance Simulation Active</AlertTitle>
        <AlertDescription className="text-xs">
          The metrics displayed below are based on <strong>Infrastructure Benchmarks</strong> for the pilot phase. Real-time conversation aggregation is pending high-volume production traffic.
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Conversations" value="1,823" trend="+20.1% (SIM)" icon={MessageSquare} />
        <MetricCard title="Response Time" value="1.3s" trendDirection="down" icon={Clock} />
        <MetricCard title="Success Rate" value="92.4%" icon={CheckCircle} />
        <MetricCard title="Satisfaction" value="4.6/5" icon={Smile} />
        <MetricCard title="Upsell Yield" value="12.8%" icon={TrendingUp} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Recent Interactive Feed</CardTitle>
                    <CardDescription>Grounded audit of recent Ari interactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-96">
                        <div className="space-y-4 pr-4">
                           {mockConversations.map((convo) => (
                                <div key={convo.id}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground"/>
                                            <p className="text-sm font-medium">Shopper #{convo.customerId}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-yellow-500">
                                            {[...Array(5)].map((_, j) => <Star key={j} className={`h-4 w-4 ${j < convo.rating ? 'fill-current' : ''}`} />)}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground ml-6">"{convo.query}" &rarr; Ari: "{convo.response}"</p>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Optimization Hub</CardTitle>
                    <CardDescription>Actionable indicators based on behavioural patterns.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pattern</TableHead>
                                <TableHead>Indicator</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell><Badge variant="outline" className="text-yellow-600 border-yellow-500/50 uppercase text-[9px] font-black">Latency</Badge></TableCell>
                                <TableCell className="text-xs">Response time for 'shipping' queries is above benchmark.</TableCell>
                                <TableCell className="text-right"><Button size="sm" variant="ghost" className="text-[10px] font-bold uppercase">Update FAQ</Button></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><Badge variant="outline" className="text-blue-600 border-blue-500/50 uppercase text-[9px] font-black">Context</Badge></TableCell>
                                <TableCell className="text-xs">Frequent questions detected for 'pricing' outside of verified facts.</TableCell>
                                <TableCell className="text-right"><Button size="sm" variant="ghost" className="text-[10px] font-bold uppercase">View Logs</Button></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Model Latency (SIM)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[150px] w-full">
                        <LineChart data={responseTimeData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} unit="s"/>
                            <Tooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Avg Time"/>
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Topic Density</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[200px] w-full flex items-center justify-center">
                        <RechartsPieChart>
                            <Pie data={queryCategoriesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8">
                                {queryCategoriesData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<ChartTooltipContent />} />
                        </RechartsPieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
