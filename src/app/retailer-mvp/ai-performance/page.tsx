
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
  DialogTrigger,
} from '@/components/ui/dialog';
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
  const { toast } = useToast();

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
        <h1 className="text-3xl font-bold tracking-tight">AI Performance Monitor</h1>
        <p className="text-muted-foreground mt-2">Monitor AI interactions, model performance, and optimization insights.</p>
      </div>
      
      {/* Header Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Total Conversations" value="1,823" trend="+20.1% from last month" icon={MessageSquare} />
        <MetricCard title="Avg. Response Time" value="1.3s" trend="+5.2% from last month" trendDirection="down" icon={Clock} />
        <MetricCard title="Success Rate" value="92.4%" trend="+2.1% from last month" icon={CheckCircle} />
        <MetricCard title="Customer Satisfaction" value="4.6/5" trend="+0.2 from last month" icon={Smile} />
        <MetricCard title="Upsell Success" value="12.8%" trend="+1.5% from last month" icon={TrendingUp} />
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
                           {mockConversations.map((convo) => (
                                <div key={convo.id}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground"/>
                                            <p className="text-sm font-medium">Customer #{convo.customerId}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-yellow-500">
                                            {[...Array(5)].map((_, j) => <Star key={j} className={`h-4 w-4 ${j < convo.rating ? 'fill-current' : ''}`} />)}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground ml-6">"{convo.query}" &rarr; AI: "{convo.response}" ({new Date(Date.now() - Math.random() * 100000).toLocaleTimeString()})</p>
                                </div>
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
                                <TableCell><Badge variant="outline" className="text-yellow-600 border-yellow-500/50">High Response Time</Badge></TableCell>
                                <TableCell className="text-sm">Response time for 'shipping' queries is 25% above average. Consider adding a specific FAQ.</TableCell>
                                <TableCell><Button size="sm" variant="outline">Create FAQ</Button></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><Badge variant="outline" className="text-blue-600 border-blue-500/50">Cost Optimization</Badge></TableCell>
                                <TableCell className="text-sm">Switching 'pricing' queries to a faster model could save ~R200/month with no impact on quality.</TableCell>
                                <TableCell>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline">Adjust Model</Button>
                                    </DialogTrigger>
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
                            <p className="text-lg font-bold text-red-900">0.3%</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Common Query Categories</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-[200px] w-full flex items-center justify-center">
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
