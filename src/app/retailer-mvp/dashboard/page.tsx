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
  Search, Download, BarChart2, CheckCircle2, Circle, ShieldAlert, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeEngagementMetrics, AnalyzeEngagementMetricsOutput } from '@/ai/flows/analyze-engagement-metrics';
import { analyzeDecisionIntelligence, DecisionIntelligenceOutput } from '@/ai/flows/analyze-decision-intelligence';
import { Skeleton } from '@/components/ui/skeleton';
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
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SetupGuide({ retailerId }: { retailerId: string }) {
  const [status, setStatus] = useState({ network: false, brand: false, catalog: false, qr: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!db || !retailerId || retailerId === 'unknown') return;
      try {
        const [orgSnap, brandSnap, productsSnap, qrsSnap] = await Promise.all([
          getDoc(doc(db, 'configurations', `${retailerId}_org`)),
          getDoc(doc(db, 'configurations', `${retailerId}_brand`)),
          getDocs(query(collection(db, 'products'), where('retailerId', '==', retailerId), limit(1))),
          getDocs(query(collection(db, 'qrcodes'), where('retailerId', '==', retailerId), limit(1)))
        ]);
        
        setStatus({
          network: orgSnap.exists(),
          brand: brandSnap.exists(),
          catalog: !productsSnap.empty,
          qr: !qrsSnap.empty
        });
      } catch (e) {
        console.warn("Status check friction.");
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [retailerId]);

  if (loading) return <Skeleton className="h-48 w-full rounded-2xl" />;

  const steps = [
    { label: "My Retail Network", href: "/retailer-mvp/organization", done: status.network, desc: "Define your stores and brands." },
    { label: "Brand & Experience", href: "/retailer-mvp/ui-management", done: status.brand, desc: "Upload logos and pick a template." },
    { label: "Product Catalog", href: "/retailer-mvp/products", done: status.catalog, desc: "Add products you want to activate." },
    { label: "QR Activation", href: "/retailer-mvp/qr-management", done: status.qr, desc: "Create your first digital link." },
    { label: "Learn the Platform", href: "/retailer-mvp/documentation", done: true, desc: "Review metrics and training guides.", optional: true },
  ];

  const isComplete = status.network && status.brand && status.catalog && status.qr;
  if (isComplete) return null;

  return (
    <Card className="border-accent bg-accent/5 shadow-lg border-2 overflow-hidden mb-8">
      <CardHeader className="bg-accent/10 py-4">
        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-foreground" />
          Welcome! Let's get started
        </CardTitle>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 pt-6">
        {steps.map((step) => (
          <Link key={step.label} href={step.href} className="group block space-y-2">
            <div className="flex items-center gap-3">
              {step.done ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />}
              <span className={cn("font-bold text-sm group-hover:underline", step.done && !step.optional && "text-muted-foreground")}>{step.label}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight pl-8">{step.desc}</p>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [analysis, setAnalysis] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [analyticsData, setAnalyticsData] = useState<AnalyzeEngagementMetricsOutput | null>(null);
  const [intelligenceData, setIntelligenceData] = useState<DecisionIntelligenceOutput | null>(null);

  const { toast } = useToast();
  const retailerId = user?.retailerId || 'unknown';

  useEffect(() => {
    let isMounted = true;
    const fetchData = async (retryCount = 0) => {
        if (!user || !isMounted) return;
        
        try {
            const idToken = await user.getIdToken();
            const [engData, intelData] = await Promise.all([
                analyzeEngagementMetrics({ idToken, retailerId: user.retailerId || 'unknown' }),
                analyzeDecisionIntelligence()
            ]);
            
            if (isMounted) {
                setAnalyticsData(engData);
                setIntelligenceData(intelData);
                setError(null);
            }
        } catch (e: any) {
            const isTransient = e.message.includes('UNKNOWN') || e.message.includes('metadata') || e.message.includes('refresh');
            
            if (isTransient && retryCount < 3 && isMounted) {
                console.warn(`[Dashboard] Intelligence sync retry ${retryCount + 1}/3...`);
                setTimeout(() => fetchData(retryCount + 1), 1500 * (retryCount + 1));
                return;
            }

            if (isMounted) {
                console.warn('Intelligence sync deferred (infrastructure handshake):', e.message);
                setError("SYNC_ERROR");
            }
        }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [user]);

  if(!analyticsData || !intelligenceData) {
    return (
      <div className="space-y-8">
         <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-10 w-full max-w-xs" />
         </div>
         <Separator />
         <div className="grid gap-4 md:grid-cols-4">
             {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
         </div>
         <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const { engagement, conversion } = analyticsData;
  const isNoData = engagement.totalScans === 0;

  const handleAnalyzeMetrics = () => {
    setError(null);
    startAnalyzing(async () => {
        if (!user?.retailerId) return;
        try {
            const idToken = await user.getIdToken();
            const result = await analyzeEngagementMetrics({ idToken, retailerId: user.retailerId });
            setAnalysis(result);
        } catch (e: any) {
            setError(e.message || "We couldn't generate the analysis at this time.");
        }
    });
  };

  return (
    <div className="space-y-8">
      {retailerId !== 'unknown' && <SetupGuide retailerId={retailerId} />}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card/50 p-4 rounded-xl border border-primary/10 shadow-sm">
          <div className="flex-1 w-full lg:w-auto">
             <StoreSelector
                regions={storesByRegion}
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
                selectedStore={selectedStore}
                onStoreChange={setSelectedStore}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Find Patterns..." 
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
          </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           <Card className="border-primary/20 bg-primary shadow-sm text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase opacity-70 tracking-widest">Associated Revenue (SIM)</CardTitle>
              <DollarSign className="h-4 w-4 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">R{isNoData ? '0' : conversion.associatedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <p className="text-[10px] opacity-70 mt-1 uppercase font-bold tracking-tighter">Total in engaged sessions</p>
            </CardContent>
          </Card>
          
           <Card className="border-green-200 bg-green-50 shadow-sm border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-green-700 tracking-widest">Calculated Uplift (SIM)</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-green-800">R{isNoData ? '0' : conversion.calculatedUplift.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <p className="text-[10px] text-green-600 mt-1 uppercase font-bold tracking-tighter">Growth estimate</p>
            </CardContent>
          </Card>

           <Card className="border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Observed Trend</CardTitle>
              <ArrowUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-green-600">{isNoData ? '--' : `+${conversion.salesUpliftPercentage}%`}</div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">Engagement performance</p>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Assisted Journeys</CardTitle>
              <MessageSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{isNoData ? '0' : conversion.assistedSales.toLocaleString()}</div>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">Verified Ari interactions</p>
            </CardContent>
          </Card>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Lightbulb className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="font-black text-xl uppercase tracking-tighter">Activity Intelligence</CardTitle>
                <CardDescription className="text-xs">
                  Factual observations for your network
                </CardDescription>
              </div>
            </div>
            {!isNoData && (
              <Button onClick={handleAnalyzeMetrics} disabled={isAnalyzing} variant="secondary" className="gap-2 font-bold uppercase text-[10px] tracking-widest h-10 px-6">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Summarize Activity
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {isNoData ? (
                <div className="p-20 text-center border-2 border-dashed rounded-xl bg-muted/20">
                    <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">Awaiting your first scan...</p>
                    <p className="text-[10px] text-muted-foreground mt-1 italic">When customers start scanning, their behavioral data will appear here.</p>
                </div>
            ) : (
                <>
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
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Basket Delta</CardTitle>
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
                        <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-tighter">Repeat engagement</p>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/10 hover:border-primary/30 transition-colors shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Purchased Sessions</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-3xl font-black tracking-tighter">{conversion.scanToPurchaseConversion.toFixed(1)}%</div>
                        <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-tighter">Checkout association</p>
                        </CardContent>
                    </Card>
                    </div>
                </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
