
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ArrowLeft, PlusCircle, BarChart, DollarSign, Eye, Users, Calendar, Loader2, TrendingUp, Percent, CheckCircle, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, Timestamp, where, getDocs } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart as RechartsBarChart, Bar as RechartsBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';


type Campaign = {
    id: string;
    campaignName: string;
    status: 'Running' | 'Paused' | 'Completed' | 'Draft';
    budget: number;
    impressions: number;
    clicks: number;
    startDate: Timestamp;
    endDate?: Timestamp;
    conversions: number;
    totalRevenue: number;
    sponsoredProducts: string[];
};

type AggregateMetrics = {
    totalRoas: number;
    totalClicks: number;
    totalImpressions: number;
    totalConversions: number;
    overallCtr: number;
    overallConversionRate: number;
    topProducts: any[];
};

const analyticsChartData = [
  { name: 'Week 1', impressions: 4000, clicks: 240 },
  { name: 'Week 2', impressions: 3000, clicks: 139 },
  { name: 'Week 3', impressions: 2000, clicks: 980 },
  { name: 'Week 4', impressions: 2780, clicks: 390 },
];

function formatNumber(num: number, options?: Intl.NumberFormatOptions) {
    return new Intl.NumberFormat('en-US', options).format(num);
}

function AnalyticsDashboard({ metrics, campaigns, loading }: { metrics: AggregateMetrics; campaigns: Campaign[]; loading: boolean }) {

    if (loading) {
        return (
            <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Analytics Overview</h2>
                    <Skeleton className="h-10 w-64" />
                </div>
                <Skeleton className="h-36 w-full" />
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
                </div>
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-80 w-full" />
            </div>
        )
    }

    const topProductsData = campaigns.flatMap((c, i) => ([
        { id: `prod_${i}_1`, name: `Product A from ${c.campaignName}`, clicks: Math.floor(c.clicks / 2), conversions: Math.floor(c.conversions / 2), revenue: c.totalRevenue / 2 },
        { id: `prod_${i}_2`, name: `Product B from ${c.campaignName}`, clicks: Math.floor(c.clicks / 2), conversions: Math.floor(c.conversions / 2), revenue: c.totalRevenue / 2 },
    ])).sort((a,b) => b.revenue - a.revenue).slice(0, 3);


    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Analytics Overview</h2>
                <div className="w-64">
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a Campaign" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Campaigns</SelectItem>
                            {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.campaignName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                    <CardTitle>Total Return on Ad Spend (ROAS)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-5xl font-bold">{metrics.totalRoas.toFixed(2)}x</p>
                    <p className="text-sm opacity-80">For every R1 spent, you earned R{metrics.totalRoas.toFixed(2)} back.</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <MetricCard title="Total Clicks" value={formatNumber(metrics.totalClicks)} icon={Users} />
                <MetricCard title="Total Impressions" value={formatNumber(metrics.totalImpressions)} icon={Eye} />
                <MetricCard title="Click-Through Rate (CTR)" value={`${metrics.overallCtr.toFixed(2)}%`} icon={TrendingUp} />
                <MetricCard title="Total Conversions" value={formatNumber(metrics.totalConversions)} icon={CheckCircle} />
                <MetricCard title="Conversion Rate" value={`${metrics.overallConversionRate.toFixed(2)}%`} icon={Percent} />
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Clicks & Impressions</CardTitle>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={analyticsChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                            <Tooltip />
                            <Legend />
                            <RechartsBar yAxisId="left" dataKey="impressions" fill="#8884d8" name="Impressions" />
                            <RechartsBar yAxisId="right" dataKey="clicks" fill="#82ca9d" name="Clicks" />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Sponsored Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Clicks</TableHead>
                                <TableHead>Conversions</TableHead>
                                <TableHead className="text-right">Revenue Generated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topProductsData.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.clicks}</TableCell>
                                    <TableCell>{product.conversions}</TableCell>
                                    <TableCell className="text-right">R{product.revenue.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {title} <Icon className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{value}</p>
            </CardContent>
        </Card>
    );
}

type Product = {
  id: string;
  name: string;
  sku: string;
};


export default function RetailMediaNetworkPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AggregateMetrics>({
      totalRoas: 0,
      totalClicks: 0,
      totalImpressions: 0,
      totalConversions: 0,
      overallCtr: 0,
      overallConversionRate: 0,
      topProducts: []
  });
  const { toast } = useToast();

  // State for product selection
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  // Debounce search term
    useEffect(() => {
        if (!searchTerm.trim() || !db) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const debounceTimer = setTimeout(async () => {
            const productsRef = collection(db, 'products');
            // A simple "starts-with" search query
            const q = query(productsRef, 
                where('name', '>=', searchTerm), 
                where('name', '<=', searchTerm + '\uf8ff'),
                limit(10)
            );
            
            try {
                const querySnapshot = await getDocs(q);
                const productsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Product));

                // Exclude already selected products
                const availableProducts = productsData.filter(p => !selectedProducts.some(sp => sp.id === p.id));
                setSearchResults(availableProducts);
            } catch (error) {
                console.error("Error searching products:", error);
                toast({ title: "Search Error", description: "Could not fetch products.", variant: "destructive" });
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm, selectedProducts, toast]);


  const addProduct = (product: Product) => {
    setSelectedProducts(prev => [...prev, product]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };


  useEffect(() => {
    if (!db) {
        toast({
            title: 'Firebase Not Connected',
            description: 'Please configure your Firebase credentials to use this feature.',
            variant: 'destructive',
        });
        setLoading(false);
        return;
    }

    setLoading(true);
    const q = query(collection(db, 'adCampaigns'), orderBy('startDate', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const campaignsData: Campaign[] = [];
      let totalBudget = 0, totalRevenue = 0, totalClicks = 0, totalImpressions = 0, totalConversions = 0;

      querySnapshot.forEach((doc) => {
        const campaign = { id: doc.id, ...doc.data() } as Campaign;
        campaignsData.push(campaign);

        totalBudget += campaign.budget || 0;
        totalRevenue += campaign.totalRevenue || 0;
        totalClicks += campaign.clicks || 0;
        totalImpressions += campaign.impressions || 0;
        totalConversions += campaign.conversions || 0;
      });

      const totalRoas = totalBudget > 0 ? totalRevenue / totalBudget : 0;
      const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const overallConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      
      setCampaigns(campaignsData);
      setMetrics({
          totalRoas,
          totalClicks,
          totalImpressions,
          totalConversions,
          overallCtr,
          overallConversionRate,
          topProducts: [] // This would be calculated separately
      });

      setLoading(false);
    }, (error) => {
      console.error("Error fetching campaigns: ", error);
      toast({
        title: 'Error',
        description: 'Could not fetch campaigns. Please check your connection and Firestore setup.',
        variant: 'destructive',
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleCreateCampaign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!db) {
        toast({ title: 'Error', description: 'Firebase is not connected.', variant: 'destructive' });
        return;
    }
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const newCampaign = {
      campaignName: data['campaign-name'],
      budget: Number(data['budget']),
      status: 'Draft',
      startDate: serverTimestamp(),
      impressions: 0,
      clicks: 0,
      conversions: 0,
      totalRevenue: 0,
      sponsoredProducts: selectedProducts.map(p => p.sku),
    };

    try {
      await addDoc(collection(db, 'adCampaigns'), newCampaign);
      toast({
        title: 'Success!',
        description: 'New campaign has been created in Draft status.',
      });
      setIsModalOpen(false);
      setSelectedProducts([]); // Reset for next time
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        title: 'Error',
        description: 'Failed to create campaign.',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDetails(true);
  };

  const handleBackToDashboard = () => {
    setSelectedCampaign(null);
    setShowDetails(false);
  };

  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
        case 'Running': return <Badge className="bg-green-500/20 text-green-700 hover:bg-green-500/20">{status}</Badge>;
        case 'Paused': return <Badge className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/20">{status}</Badge>;
        case 'Completed': return <Badge variant="secondary">{status}</Badge>;
        case 'Draft': return <Badge variant="outline">{status}</Badge>;
    }
  }

  const calculateCTR = (clicks: number, impressions: number) => {
      if (impressions === 0) return '0.00%';
      return `${((clicks / impressions) * 100).toFixed(2)}%`;
  }

  return (
    <div className="space-y-8">
      <div>
          <h1 className="text-3xl font-bold text-foreground">Retail Media Network</h1>
          <p className="text-muted-foreground mt-2">Manage your ad campaigns and analyze their performance.</p>
      </div>
      
      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="campaigns">
             {/* Main Dashboard View */}
              <div className={cn(showDetails && 'hidden')}>
                <div className="flex justify-end items-start mb-6">
                  <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
                      setIsModalOpen(isOpen);
                      if (!isOpen) {
                          setSelectedProducts([]);
                          setSearchTerm('');
                          setSearchResults([]);
                      }
                  }}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Campaign
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                          <DialogTitle>Create New Ad Campaign</DialogTitle>
                          <DialogDescription>Define a new campaign to run on your retail media network.</DialogDescription>
                      </DialogHeader>
                      <form id="create-campaign-form" onSubmit={handleCreateCampaign} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                          <div>
                              <Label htmlFor="campaign-name">Campaign Name</Label>
                              <Input id="campaign-name" name="campaign-name" required />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                  <Label htmlFor="budget">Budget (R)</Label>
                                  <Input id="budget" name="budget" type="number" required />
                              </div>
                              <div>
                                <Label htmlFor="campaign-duration">Campaign Duration</Label>
                                <Input id="campaign-duration" name="campaign-duration" type="text" placeholder="e.g., Start Date - End Date"/>
                              </div>
                          </div>
                          <div>
                              <Label htmlFor="target-audience">Target Audience</Label>
                              <Textarea id="target-audience" name="target-audience" rows={3} placeholder="Describe the target audience (e.g., location, demographics, interests)." />
                          </div>
                          <div id="product-selection-container">
                                <Label>Sponsored Products</Label>
                                <div className="mt-2 border rounded-md p-4 space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="product-search-input" 
                                            placeholder="Search by product name..." 
                                            className="pl-10"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    
                                    {(isSearching || searchResults.length > 0) && (
                                        <Card id="product-search-results" className="shadow-none">
                                            <ScrollArea className="h-48">
                                                <CardContent className="p-2">
                                                    {isSearching ? <div className="text-center p-4"><Loader2 className="animate-spin mx-auto"/></div>
                                                    : searchResults.length > 0 ? searchResults.map(product => (
                                                        <div key={product.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                                                            <div>
                                                                <p className="text-sm font-medium">{product.name}</p>
                                                                <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                                                            </div>
                                                            <Button type="button" size="sm" onClick={() => addProduct(product)}>Add</Button>
                                                        </div>
                                                    )) : null }
                                                    {!isSearching && searchResults.length === 0 && searchTerm && <p className="text-center text-sm text-muted-foreground py-4">No products found.</p>}
                                                </CardContent>
                                            </ScrollArea>
                                        </Card>
                                    )}

                                    {selectedProducts.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Selected Products</h4>
                                            <div className="space-y-2">
                                                {selectedProducts.map(product => (
                                                    <div key={product.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                                         <div>
                                                            <p className="text-sm font-medium">{product.name}</p>
                                                            <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                                                        </div>
                                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeProduct(product.id)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                          </div>
                      </form>
                      <DialogFooter>
                          <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                          <Button type="submit" form="create-campaign-form">
                              Create Campaign
                          </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Ad Campaigns</CardTitle>
                        <CardDescription>An overview of all your ongoing and past campaigns.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Campaign Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Budget</TableHead>
                                    <TableHead>Impressions</TableHead>
                                    <TableHead>Clicks</TableHead>
                                    <TableHead>CTR</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                     <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : !db ? (
                                    <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Please configure Firebase to view campaigns.</TableCell></TableRow>
                                ) : campaigns.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="h-24 text-center">No campaigns found.</TableCell></TableRow>
                                ) : (
                                    campaigns.map(campaign => (
                                        <TableRow key={campaign.id}>
                                            <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                                            <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                                            <TableCell>R{campaign.budget.toLocaleString()}</TableCell>
                                            <TableCell>{campaign.impressions.toLocaleString()}</TableCell>
                                            <TableCell>{campaign.clicks.toLocaleString()}</TableCell>
                                            <TableCell>{calculateCTR(campaign.clicks, campaign.impressions)}</TableCell>
                                            <TableCell>
                                                <Button variant="link" className="p-0 h-auto" onClick={() => handleViewDetails(campaign)}>View Details</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
              </div>

              {/* Experiment Details View */}
              <div className={cn(!showDetails && 'hidden', 'space-y-6')}>
                <Button variant="ghost" onClick={handleBackToDashboard} className="mb-4 -ml-4">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">{selectedCampaign?.campaignName}</CardTitle>
                        <CardDescription>
                            Live performance metrics for this campaign.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedCampaign?.sponsoredProducts && selectedCampaign.sponsoredProducts.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2">Sponsored Products</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCampaign.sponsoredProducts.map(sku => <Badge key={sku} variant="secondary">{sku}</Badge>)}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Budget</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">R{selectedCampaign?.budget.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Total allocated budget</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{selectedCampaign?.impressions.toLocaleString()}</p>
                             <p className="text-xs text-muted-foreground">Total times the ad was shown</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{selectedCampaign?.clicks.toLocaleString()}</p>
                             <p className="text-xs text-muted-foreground">Total clicks on the ad</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
                            <BarChart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{calculateCTR(selectedCampaign?.clicks || 0, selectedCampaign?.impressions || 0)}</p>
                             <p className="text-xs text-muted-foreground">Ratio of clicks to impressions</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance Over Time</CardTitle>
                        <CardDescription>Feature coming soon: A chart visualizing live data on impressions, clicks, conversions, and ROI.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 flex items-center justify-center bg-muted/50 rounded-md">
                        <p className="text-muted-foreground">Chart will be displayed here.</p>
                    </CardContent>
                </Card>
              </div>
        </TabsContent>
        <TabsContent value="analytics">
            <AnalyticsDashboard metrics={metrics} campaigns={campaigns} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
