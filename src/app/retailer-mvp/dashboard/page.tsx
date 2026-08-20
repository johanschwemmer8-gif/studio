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
  UserCheck, TrendingUp, Sparkles, AlertTriangle, 
  ArrowUp, MessageSquare, ShoppingCart, Loader2, Lightbulb, DollarSign,
  Search, Calendar, Download, Activity, BarChart2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeEngagementMetrics, AnalyzeEngagementMetricsOutput } from '@/ai/flows/analyze-engagement-metrics';
import { analyzeDecisionIntelligence, DecisionIntelligenceOutput } from '@/ai/flows/analyze-decision-intelligence';
import { Skeleton } from '@/components/ui/skeleton';
import theme from '@/config/theme.json';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { auth } from '@/lib/firebase';

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
    const fetchData = async () => {
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const [engData, intelData] = await Promise.all([
                analyzeEngagementMetrics({ idToken, retailerId: 'simulated-retailer-id' }),
                analyzeDecisionIntelligence()
            ]);
            setAnalyticsData(engData);
            setIntelligenceData(intelData);
        } catch (e) {
            setError("Friction in intelligence stream. Simulation fallback active.");
        }
    };
    fetchData();
  }, []);

  const handleAnalyzeMetrics = () => {
    setError(null);
    startAnalyzing(async () => {
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const result = await analyzeEngagementMetrics({ idToken, retailerId: 'simulated-retailer-id' });
            setAnalysis(result);
        } catch (e) {
            setError("Decision Intelligence Engine is temporarily busy. Please try again.");
        }
    });
  };

  const handleExport = (format: string) => {
      toast({
          title: `Exporting ${format}...`,
          description: `Your Performance Report is being generated.`,
      });
  };
  
  if(!analyticsData || !intelligenceData) {
    return (
      <div className="space-y-8 p-4">
         <Skeleton className="h-12 w-full" />
         <Separator />
         <div className="grid gap-4 md:grid-cols-4">
             {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
         </div>
         <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { engagement, conversion } = analyticsData;

  return (
    <div className="space-y-8">
      {/* Performance Intelligence Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card/50 p-4 rounded-xl border border-primary/10 shadow-sm">
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
                    placeholder="Search Patterns..." 
                    className="pl-10 h-10" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <Button asChild variant="outline" className="h-10 gap-2 font-bold text-[10px] uppercase tracking-widest">
                <Link href="/retailer-mvp/qr-analytics">
                  <BarChart2 className="h-4 w-4 text-primary" /> Scan Stats
                </Link>
             </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="h-10 gap-2 font-bold text-[10px] uppercase tracking-widest">
                        <Download className="h-4 w-4" /> Export
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('PDF')}>Summary (PDF)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('CSV')}>Raw Events (CSV)</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
      </div>

      {/* ECONOMIC IMPACT HERO SUMMARY */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           <Card className="border-primary/20 bg-primary shadow-sm text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase opacity-70 tracking-widest">Associated Revenue (SIM)</CardTitle>
              <DollarSign className="h-4 w-4 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">R{conversion.associatedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <p className="text-[10px] opacity-70 mt-1 uppercase font-bold tracking-tighter">Factual session-based volume</p>
            </CardContent>
          </Card>
          
           <Card className="border-green-200 bg-green-50 shadow-sm border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-green-700 tracking-widest">Calculated Uplift (SIM)</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-green-800">R{conversion.calculatedUplift.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <p className="text-[10px] text-green-600 mt-1 uppercase font-bold tracking-tighter">Observed Growth projection</p>
            </CardContent>
          </Card>

           <Card className="border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Growth Velocity</CardTitle>
              <ArrowUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-green-600">+{conversion.salesUpliftPercentage}%</div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">Engagement performance trend</p>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Assisted Journeys</CardTitle>
              <MessageSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{conversion.assistedSales.toLocaleString()}</div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">Verified Ari interaction count</p>
            </CardContent>
          </Card>
      </div>

      {/* Behavioral Patterns Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Lightbulb className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="font-black text-xl uppercase tracking-tighter">Shopper Activity Intelligence</CardTitle>
                <CardDescription className="text-xs">
                  Factual behavioral observations for <span className="font-semibold text-primary">{selectedStore || selectedRegion || 'Portfolio'}</span>
                </CardDescription>
              </div>
            </div>
            {optionalModules.performanceAnalysis && (
              <Button onClick={handleAnalyzeMetrics} disabled={isAnalyzing} variant="secondary" className="gap-2 font-bold uppercase text-[10px] tracking-widest h-10 px-6">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Summarize Activity
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">

            {isAnalyzing && (
                <div className="p-8 border rounded-xl border-accent/20 bg-accent/5 flex flex-col items-center gap-4 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-accent" />
                    <p className="font-bold text-sm uppercase tracking-widest">Generating grounded summary...</p>
                </div>
            )}

            {analysis && (
                <Card className="bg-accent/10 border-accent shadow-lg animate-in fade-in zoom-in-95 overflow-hidden">
                    <CardHeader className="bg-accent/5 py-3">
                         <CardTitle className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-accent-foreground"><Sparkles className="h-4 w-4"/> iNteract Pattern Analytics</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8 pt-6">
                        <div>
                            <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">Factual Observations</h3>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{analysis.conclusions}</p>
                        </div>
                         <div>
                            <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">Identified Indicators</h3>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{analysis.recommendations}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Core Pattern KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
               <Card className="border-primary/10 hover:border-primary/30 transition-colors shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Identified Profiles</CardTitle>
                  <UserCheck className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black tracking-tighter">{engagement.identifiedShoppers.toLocaleString()}</div>
                  <Badge variant="outline" className="mt-2 bg-primary/5 border-primary/20 text-[9px] py-0 font-black uppercase">
                    {engagement.profileConversionRate.toFixed(1)}% Conversion
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-primary/10 hover:border-primary/30 transition-colors shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Basket Size Delta</CardTitle>
                  <ArrowUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black text-green-600 tracking-tighter">+{conversion.basketSizeIncreasePercent.toFixed(1)}%</div>
                  <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-tighter">R{conversion.basketSizeIncreaseRand.toFixed(2)} Avg Increase (SIM)</p>
                </CardContent>
              </Card>

              <Card className="border-primary/10 hover:border-primary/30 transition-colors shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Hesitation Index</CardTitle>
                  <Activity className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black tracking-tighter">{intelligenceData.hesitationMetrics.hesitationIndex}%</div>
                  <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-tighter">Observed repeat engagement</p>
                </CardContent>
              </Card>

               <Card className="border-primary/10 hover:border-primary/30 transition-colors shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Purchased Sessions</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black tracking-tighter">{conversion.scanToPurchaseConversion.toFixed(1)}%</div>
                  <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-tighter">Verified checkout association</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
