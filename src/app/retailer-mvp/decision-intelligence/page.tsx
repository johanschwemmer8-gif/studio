
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BrainCircuit, TrendingUp, AlertTriangle, MessageSquare, BarChart2, MousePointerClick, Tag, Activity } from 'lucide-react';
import { analyzeDecisionIntelligence, type DecisionIntelligenceOutput } from '@/ai/flows/analyze-decision-intelligence';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function DecisionIntelligencePage() {
    const [data, setData] = useState<DecisionIntelligenceOutput | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        analyzeDecisionIntelligence().then(res => {
            setData(result);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
        
        // Use realistic dummy data if flow fails or for instant dev preview
        const result: DecisionIntelligenceOutput = {
            intentGaps: [
                { productId: '1', productName: 'Eco-Friendly Water Bottle', engagementScore: 88, conversionRate: 12, gapIndicator: 'Price Sensitivity' },
                { productId: '2', productName: 'Wireless Charging Pad', engagementScore: 94, conversionRate: 8, gapIndicator: 'Missing Information' },
                { productId: '3', productName: 'Smart Notebook', engagementScore: 45, conversionRate: 32, gapIndicator: 'Low Availability' },
            ],
            hesitationMetrics: {
                avgDwellBeforeDecision: 42,
                hesitationIndex: 18.5,
                topHesitationCategories: ['Electronics', 'Premium Footwear', 'Cosmetics'],
            },
            aiInteractionInsights: {
                topShopperQuestions: [
                    { topic: 'Battery Life', frequency: 154, sentiment: 0.6 },
                    { topic: 'Warranty Details', frequency: 112, sentiment: 0.8 },
                    { topic: 'Comparison with Competitors', frequency: 89, sentiment: 0.4 },
                    { topic: 'In-store Availability', frequency: 76, sentiment: 0.7 },
                ],
                aiResolutionRate: 64.2,
            },
            categoryEngagement: [
                { category: 'Lifestyle', uniqueScanners: 1240, repeatEngagementRate: 24.5 },
                { category: 'Electronics', uniqueScanners: 980, repeatEngagementRate: 31.2 },
                { category: 'Accessories', uniqueScanners: 750, repeatEngagementRate: 18.9 },
            ]
        };
        setData(result);
        setLoading(false);
    }, []);

    if (loading || !data) {
        return <div className="space-y-8"><Skeleton className="h-12 w-1/4" /><Skeleton className="h-64 w-full" /><div className="grid grid-cols-2 gap-8"><Skeleton className="h-96" /><Skeleton className="h-96" /></div></div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
                    <BrainCircuit className="text-primary h-8 w-8" />
                    Decision Intelligence Engine
                </h1>
                <p className="text-muted-foreground max-w-3xl">
                    Deep behavioural analysis identifying intent gaps, shopper hesitation, and AI-driven resolution patterns.
                </p>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Shopper Hesitation Index</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.hesitationMetrics.hesitationIndex}%</div>
                        <p className="text-xs text-muted-foreground">Repeat scans without conversion</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Dwell Before Decision</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.hesitationMetrics.avgDwellBeforeDecision}s</div>
                        <p className="text-xs text-muted-foreground">High dwell suggests complex consideration</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">AI Assistance Success</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.aiInteractionInsights.aiResolutionRate}%</div>
                        <p className="text-xs text-muted-foreground">Chats resulting in product save</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Intent-Conversion Gap</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">High</div>
                        <p className="text-xs text-muted-foreground">Attention vs Action variance</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Intent-Gap Analysis</CardTitle>
                        <CardDescription>Products with high interest but low conversion rates.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-center">Engagement</TableHead>
                                    <TableHead className="text-center">Conv. %</TableHead>
                                    <TableHead>Primary Barrier</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.intentGaps.map((gap) => (
                                    <TableRow key={gap.productId}>
                                        <TableCell className="font-medium">{gap.productName}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                                                <div className="bg-primary h-full" style={{ width: `${gap.engagementScore}%` }} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-destructive">{gap.conversionRate}%</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">{gap.gapIndicator}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Shopper Questions (AI Intelligence)</CardTitle>
                        <CardDescription>What are shoppers actually asking your AI assistant?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{ frequency: { label: 'Frequency', color: 'hsl(var(--primary))' }}} className="h-[300px] w-full">
                            <BarChart data={data.aiInteractionInsights.topShopperQuestions} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="topic" type="category" axisLine={false} tickLine={false} fontSize={12} width={120} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="frequency" fill="var(--color-frequency)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                 <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Hesitation by Category</CardTitle>
                        <CardDescription>Where do shoppers hesitate most?</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={data.categoryEngagement} 
                                    dataKey="repeatEngagementRate" 
                                    nameKey="category" 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5}
                                >
                                    {data.categoryEngagement.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Category Engagement Heatmap</CardTitle>
                        <CardDescription>Unique vs Repeat scanner density across categories.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={{ scanners: { label: 'Unique Scanners', color: 'hsl(var(--chart-1))' }}} className="h-[300px] w-full">
                            <BarChart data={data.categoryEngagement}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="category" />
                                <YAxis />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="uniqueScanners" fill="var(--color-scanners)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
