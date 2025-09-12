
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { ArrowLeft } from 'lucide-react';

export default function ABTestingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-8">
      {/* Main Dashboard View */}
      <div className={cn(showDetails && 'hidden')}>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-foreground">A/B Testing & Experimentation</h1>
            <Button onClick={() => setIsModalOpen(true)}>
                Create New Experiment
            </Button>
        </div>
        
        <Card>
            <CardContent className="p-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Experiment Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Start/End Date</TableHead>
                            <TableHead>Key Metric</TableHead>
                            <TableHead>Overall Result</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium">Homepage UI Test</TableCell>
                            <TableCell className="text-green-500 font-semibold">Running</TableCell>
                            <TableCell>2025-09-01 to 2025-10-01</TableCell>
                            <TableCell>Click-Through Rate</TableCell>
                            <TableCell className="text-yellow-600 font-semibold">Inconclusive</TableCell>
                            <TableCell>
                                <Button variant="link" className="p-0 h-auto" onClick={() => setShowDetails(true)}>View Details</Button>
                                <Button variant="link" className="p-0 h-auto text-destructive ml-4">Stop</Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

      {/* Create Experiment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Experiment</DialogTitle>
          </DialogHeader>
          <form className="space-y-6 py-4">
            <div>
              <Label htmlFor="experiment-name">Experiment Name</Label>
              <Input id="experiment-name" required />
            </div>
            <div>
              <Label htmlFor="experiment-description">Description / Hypothesis</Label>
              <Textarea id="experiment-description" rows={3} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Define Variables (A/B)</h3>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="variable-a">Variable A (Control)</Label>
                  <Input id="variable-a" />
                </div>
                <div className="flex-1">
                  <Label htmlFor="variable-b">Variable B (Variant)</Label>
                  <Input id="variable-b" />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="primary-metric">Primary Metric</Label>
              <Select>
                <SelectTrigger id="primary-metric">
                  <SelectValue placeholder="Select a metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                  <SelectItem value="click_through_rate">Click-Through Rate</SelectItem>
                  <SelectItem value="add_to_cart">Add to Cart</SelectItem>
                  <SelectItem value="in_store_visit">In-Store Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
           <DialogFooter>
              <Button type="submit" form="create-experiment-form" onClick={() => setIsModalOpen(false)}>
                Create Experiment
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Experiment Details View */}
      <div className={cn(!showDetails && 'hidden')}>
        <Button variant="ghost" onClick={() => setShowDetails(false)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">Homepage UI Test</h1>
        <p className="text-muted-foreground mb-6">Testing if a different homepage layout increases customer engagement.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Total Participants</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold text-primary">0</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Control (A) Conversion</CardTitle>
                </CardHeader>
                 <CardContent>
                    <p className="text-4xl font-bold text-green-500">0%</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Variant (B) Conversion</CardTitle>
                </CardHeader>
                 <CardContent>
                    <p className="text-4xl font-bold text-purple-500">0%</p>
                </CardContent>
            </Card>
        </div>
        
        <Card className="bg-muted">
            <CardHeader>
                <CardTitle>Results & Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-lg text-foreground mb-4">Insufficient data. Continue running the experiment to get a statistically significant result.</p>
                <div className="flex gap-4">
                    <Button>Apply Winner</Button>
                    <Button variant="destructive">End Experiment</Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
