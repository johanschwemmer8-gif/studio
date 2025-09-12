
'use client';

import { useState, useEffect } from 'react';
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
import { ArrowLeft, PlusCircle, BarChart, DollarSign, Eye, Users, Calendar, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';


type Campaign = {
    id: string;
    campaignName: string;
    status: 'Running' | 'Paused' | 'Completed' | 'Draft';
    budget: number;
    impressions: number;
    clicks: number;
    startDate: Timestamp;
    endDate?: Timestamp;
};

export default function RetailMediaNetworkPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      querySnapshot.forEach((doc) => {
        campaignsData.push({ id: doc.id, ...doc.data() } as Campaign);
      });
      setCampaigns(campaignsData);
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
      sponsoredProducts: [], // Placeholder for now
    };

    try {
      await addDoc(collection(db, 'adCampaigns'), newCampaign);
      toast({
        title: 'Success!',
        description: 'New campaign has been created in Draft status.',
      });
      setIsModalOpen(false);
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
      {/* Main Dashboard View */}
      <div className={cn(showDetails && 'hidden')}>
        <div className="flex justify-between items-start mb-6">
          <div>
              <h1 className="text-3xl font-bold text-foreground">Retail Media Network</h1>
              <p className="text-muted-foreground mt-2">Manage and monitor your retail media network campaigns and performance.</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
                  <div>
                      <Label>Sponsored Products</Label>
                      <Card className="mt-2">
                        <CardContent className="p-4 text-center text-sm text-muted-foreground">
                            Product selection feature coming soon.
                        </CardContent>
                      </Card>
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
    </div>
  );

    