
'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArrowLeft, PlusCircle, BarChart, DollarSign, Eye, Users, Calendar } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

type Campaign = {
    id: string;
    name: string;
    status: 'Running' | 'Paused' | 'Completed' | 'Draft';
    budget: number;
    impressions: number;
    clicks: number;
    ctr: number;
};

const placeholderCampaigns: Campaign[] = [
    { id: '1', name: 'Summer Sizzler Sale', status: 'Running', budget: 5000, impressions: 150000, clicks: 7500, ctr: 5.0 },
    { id: '2', name: 'Back to School Deals', status: 'Completed', budget: 3000, impressions: 120000, clicks: 4800, ctr: 4.0 },
    { id: '3', name: 'Winter Warmers', status: 'Paused', budget: 2500, impressions: 50000, clicks: 2000, ctr: 4.0 },
    { id: '4', name: 'Black Friday Preview', status: 'Draft', budget: 10000, impressions: 0, clicks: 0, ctr: 0.0 },
];

export default function RetailMediaNetworkPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

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
              <form id="create-campaign-form" className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                  <div>
                      <Label htmlFor="campaign-name">Campaign Name</Label>
                      <Input id="campaign-name" required />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                      <div>
                          <Label htmlFor="budget">Budget (R)</Label>
                          <Input id="budget" type="number" required />
                      </div>
                      <div>
                        <Label htmlFor="campaign-duration">Campaign Duration</Label>
                        <Input id="campaign-duration" type="text" placeholder="e.g., Start Date - End Date"/>
                      </div>
                  </div>
                  <div>
                      <Label htmlFor="target-audience">Target Audience</Label>
                      <Textarea id="target-audience" rows={3} placeholder="Describe the target audience (e.g., location, demographics, interests)." />
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
                        {placeholderCampaigns.map(campaign => (
                            <TableRow key={campaign.id}>
                                <TableCell className="font-medium">{campaign.name}</TableCell>
                                <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                                <TableCell>R{campaign.budget.toLocaleString()}</TableCell>
                                <TableCell>{campaign.impressions.toLocaleString()}</TableCell>
                                <TableCell>{campaign.clicks.toLocaleString()}</TableCell>
                                <TableCell>{campaign.ctr.toFixed(2)}%</TableCell>
                                <TableCell>
                                    <Button variant="link" className="p-0 h-auto" onClick={() => handleViewDetails(campaign)}>View Details</Button>
                                </TableCell>
                            </TableRow>
                        ))}
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
                <CardTitle className="text-3xl">{selectedCampaign?.name}</CardTitle>
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
                    <p className="text-2xl font-bold">{selectedCampaign?.ctr.toFixed(2)}%</p>
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
}

    