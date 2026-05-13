'use client';

import { useState, useTransition, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { storesByRegion } from '@/lib/data';
import StoreSelector from '@/components/dashboard/store-selector';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  User, TrendingUp, Sparkles, AlertTriangle, Tag, Percent, 
  ArrowUp, Clock, UserCheck, ShieldCheck, Fingerprint, 
  Phone, Mail, Chrome, Smartphone, Download, Search, 
  MessageSquare, BrainCircuit, Activity, MousePointerClick, 
  BarChart3, LayoutDashboard, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeEngagementMetrics, AnalyzeEngagementMetricsOutput } from '@/ai/flows/analyze-engagement-metrics';
import { analyzeDecisionIntelligence, DecisionIntelligenceOutput } from '@/ai/flows/analyze-decision-intelligence';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import theme from '@/config/theme.json';
import HourlyPerformanceChart from '@/components/dashboard/hourly-performance-chart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function DashboardPage() {
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [analysis, setAnalysis] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [analyticsData, setAnalyticsData] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  const [intelligenceData, setIntelligenceData] = useState<DecisionIntelligenceOutput | null>(null);

  const { optionalModules } = theme;
  const { toast } = useToast();

  const handleStoreChange = (store: string | null) => {
    setSelectedStore(store);
  };
  
  const handleRegionChange = (region: string | null) => {
    setSelectedRegion(region);
    setSelectedStore(null); 
  };

  useEffect(() => {
    // Fetch base engagement metrics
    analyzeEngagementMetrics({}).then(data => {
      setAnalyticsData(data);
    });

    // Fetch decision intelligence
    analyzeDecisionIntelligence().then(data => {
      setIntelligenceData(data);
    });
  }, []);

  const handleAnalyzeMetrics = () => {
    setError(null);
    startAnalyzing(async () => {
        try {
            const result = await analyzeEngagementMetrics({});
            setAnalysis(result);
        } catch (e) {
            console.error(e);
            setError("We couldn't generate the analysis at this time. Please try again later.");
        }
    });
  };

  const handleExport = (format: string) => {
      toast({
          title: `Exporting ${format}...`,
          description: `Your intelligence report for ${selectedStore || 'All Stores'} is being generated.`,
      });
  };
  
  if(!analyticsData || !intelligenceData) {
    return (
      <div className="space-y-8 animate-pulse">
         <div className="h-12 w-full bg-muted rounded-lg" />
         <Separator />
         <div className="grid gap-4 md:grid-cols-3">
             <div className="h-32 bg-muted rounded-lg" />
             <div className="h-32 bg-muted rounded-lg" />
             <div className="h-32 bg-muted rounded-lg" />
         </div>
      </div>
    );
  }

  const { engagement, conversion } = analyticsData;

  return (
    <div className="space-y-8">
      {/* Global Intelligence Controller */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card/50 p-4 rounded-xl border border-primary/10">
          <div className="flex-1 w-full lg:w-auto">
             <StoreSelector
                regions={storesByRegion}
                selectedRegion={selectedRegion}
                onRegionChange={handleRegionChange}
                selectedStore={selectedStore}
                onStoreChange={handleStoreChange}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search Products..." 
                    className="pl-10 h-10" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <Button variant="outline" className="h-10 gap-2 font-semibold">
                <Calendar className="h-4 w-4" /> Last 30 Days
             </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="h-10 gap-2">
                        <Download className="h-4 w-4" /> Export
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('PDF')}>Download PDF Report</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('CSV')}>Download CSV Data</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('PPT')}>Download Executive Deck</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
      </div>

      {/* Intelligence Hero */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <LayoutDashboard className="text-primary h-6 w-6" />
              </div>
              <div>
                <CardTitle>Retail Intelligence Summary</CardTitle>
                <CardDescription>
                  Segment: <span className="font-semibold text-primary">{selectedStore || selectedRegion || 'Global iNteract-AOE'}</span>
                </CardDescription>
              </div>
            </div>
            {optionalModules.performanceAnalysis && (
              <Button onClick={handleAnalyzeMetrics} disabled={isAnalyzing} variant="secondary" className="gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Analyze Intelligence
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">

            {isAnalyzing && (
                <div className="p-8 border rounded-xl border-accent/20 bg-accent/5 flex flex-col items-center gap-4 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-accent" />
                    <p className="text-lg font-bold">Generative Intelligence active...</p>
                    <p className="text-sm text-muted-foreground">Analysing behavioural patterns for {selectedStore || 'your portfolio'}.</p>
                </div>
            )}

            {analysis && (
                <Card className="bg-accent/10 border-accent shadow-lg animate-in fade-in zoom-in-95">
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent"/> AI-Powered Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Behavioural Conclusions</h3>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{analysis.conclusions}</p>
                        </div>
                         <div>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Actionable ROI Strategy</h3>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{analysis.recommendations}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Top KPIs Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
               <Card className="border-primary/10 hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Identified Shoppers</CardTitle>
                  <UserCheck className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{engagement.identifiedShoppers.toLocaleString()}</div>
                  <Badge variant="outline" className="mt-2 bg-primary/5 border-primary/20 text-[10px]">
                    {engagement.profileConversionRate.toFixed(1)}% Conversion
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-primary/10 hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-bold uppercase text-muted-foreground">AI Basket Uplift</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-green-600">+{conversion.basketUpliftPercentage.toFixed(1)}%</div>
                  <p className="text-[10px] text-muted-foreground mt-2">Spend increase via AI guidance</p>
                </CardContent>
              </Card>

              <Card className="border-primary/10 hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Hesitation Index</CardTitle>
                  <Activity className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{intelligenceData.hesitationMetrics.hesitationIndex}%</div>
                  <p className="text-[10px] text-muted-foreground mt-2">Repeat scans without conversion</p>
                </CardContent>
              </Card>

               <Card className="border-primary/10 hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Offer Redemption</CardTitle>
                  <Tag className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{conversion.offerRedemptionRate.toFixed(1)}%</div>
                  <p className="text-[10px] text-muted-foreground mt-2">Personalized coupon adoption</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Product & AI Intelligence Sections */}
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
          {/* Section: Product Intent Intelligence */}
          <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" /> Product Intent Gaps</CardTitle>
                    <CardDescription>High engagement products with conversion friction.</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                      <Link href="/retailer-mvp/decision-intelligence">Full Analysis →</Link>
                  </Button>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {intelligenceData.intentGaps.map(gap => (
                          <div key={gap.productId} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                              <div className="min-w-0 flex-1">
                                  <p className="font-bold text-sm truncate">{gap.productName}</p>
                                  <p className="text-xs text-muted-foreground">Barrier: <span className="text-yellow-600 font-semibold">{gap.gapIndicator}</span></p>
                              </div>
                              <div className="text-right ml-4">
                                  <Badge variant="outline" className="border-primary/20 text-primary font-bold">
                                      {gap.engagementScore}% Engagement
                                  </Badge>
                                  <p className="text-[10px] text-destructive font-black mt-1">{gap.conversionRate}% CONV</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </CardContent>
          </Card>

          {/* Section: Top AI Questions */}
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Customer Questions</CardTitle>
                  <CardDescription>What shoppers are asking the AI Assistant.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  {intelligenceData.aiInteractionInsights.topShopperQuestions.slice(0, 4).map((q, i) => (
                      <div key={i} className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                                <p className="text-sm font-medium leading-tight">{q.topic}</p>
                                <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                                    <div className="bg-primary h-full" style={{ width: `${(q.frequency / 200) * 100}%` }} />
                                </div>
                          </div>
                          <span className="text-xs font-bold text-muted-foreground shrink-0">{q.frequency}</span>
                      </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between text-xs p-2 bg-primary/5 rounded border border-primary/10">
                      <span className="font-semibold text-primary">AI Resolution Rate:</span>
                      <span className="font-black text-primary">{intelligenceData.aiInteractionInsights.aiResolutionRate}%</span>
                  </div>
              </CardContent>
          </Card>
      </div>

      <Separator />

      {/* Retail Media Summary */}
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-4">
          <Card className="lg:col-span-1 bg-primary text-primary-foreground border-none">
              <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-widest opacity-70">Media Network Yield</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div>
                    <div className="text-4xl font-black">R4,020</div>
                    <p className="text-xs opacity-80 mt-1">Total revenue from supplier ads</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-lg border border-white/10">
                      <p className="text-[10px] uppercase font-bold opacity-60">Avg. Revenue Per Scan</p>
                      <p className="text-xl font-bold">R0.16</p>
                  </div>
                  <Button variant="secondary" className="w-full h-10 font-bold" asChild>
                      <Link href="/retailer-mvp/retail-media-network">Monetisation Hub</Link>
                  </Button>
              </CardContent>
          </Card>

          <Card className="lg:col-span-3">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Hourly Engagement Trends</CardTitle>
                  <CardDescription>Visualizing identity capture and scan volume throughout the day.</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                  <HourlyPerformanceChart 
                    metric="uniqueScans" 
                    title="" 
                    description=""
                  />
              </CardContent>
          </Card>
      </div>

      <Separator />

      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <HourlyPerformanceChart
          metric="engagementRate"
          title="Identity Conversion Rate"
          description="Percentage of guest scanners creating Smart Profiles hourly."
        />
        <HourlyPerformanceChart
          metric="offerRedemption"
          title="Coupon Velocity"
          description="Personalized offer redemptions by hour."
        />
        <HourlyPerformanceChart
          metric="basketUplift"
          title="ROI: Basket Uplift"
          description="The direct spend increase attributed to AI guidance."
        />
      </div>
    </div>
  );
}
