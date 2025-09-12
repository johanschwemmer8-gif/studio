
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
import { ArrowLeft, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type Experiment = {
  id: string;
  name: string;
  description: string;
  status: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  keyMetric: string;
  results: {
    control_conversions: number;
    variant_conversions: number;
    control_participants: number;
    variant_participants: number;
  };
  variables: {
    A: string;
    B: string;
  };
};


export default function ABTestingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
        toast({
            title: 'Firebase Not Connected',
            description: 'Please configure your Firebase credentials to use the A/B Testing feature.',
            variant: 'destructive',
        });
        setLoading(false);
        return;
    }

    setLoading(true);
    const q = query(collection(db, 'experiments'), orderBy('startDate', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const experimentsData: Experiment[] = [];
      querySnapshot.forEach((doc) => {
        experimentsData.push({ id: doc.id, ...doc.data() } as Experiment);
      });
      setExperiments(experimentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching experiments: ", error);
      toast({
        title: 'Error',
        description: 'Could not fetch experiments. Please check your connection and Firestore setup.',
        variant: 'destructive',
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const handleCreateExperiment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!db) {
        toast({ title: 'Error', description: 'Firebase is not connected.', variant: 'destructive' });
        return;
    }
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const newExperiment = {
      name: data['experiment-name'],
      description: data['experiment-description'],
      variables: {
        A: data['variable-a'],
        B: data['variable-b'],
      },
      keyMetric: data['primary-metric'],
      status: 'Running',
      startDate: serverTimestamp(),
      results: {
        control_conversions: 0,
        variant_conversions: 0,
        control_participants: 0,
        variant_participants: 0,
      }
    };

    try {
      await addDoc(collection(db, 'experiments'), newExperiment);
      toast({
        title: 'Success!',
        description: 'New experiment has been created.',
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        title: 'Error',
        description: 'Failed to create experiment.',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    setShowDetails(true);
  };
  
  const handleBackToDashboard = () => {
      setSelectedExperiment(null);
      setShowDetails(false);
  }

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
                            <TableHead>Start Date</TableHead>
                            <TableHead>Key Metric</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {loading ? (
                             <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                         ) : !db ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Please configure Firebase to view experiments.</TableCell></TableRow>
                         ) : experiments.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No experiments found.</TableCell></TableRow>
                         ) : (
                            experiments.map(exp => (
                                <TableRow key={exp.id}>
                                    <TableCell className="font-medium">{exp.name}</TableCell>
                                    <TableCell className={cn(
                                        'font-semibold',
                                        exp.status === 'Running' && 'text-green-500',
                                        exp.status === 'Completed' && 'text-gray-500',
                                        exp.status === 'Paused' && 'text-yellow-600',
                                    )}>{exp.status}</TableCell>
                                    <TableCell>{exp.startDate ? new Date(exp.startDate.toDate()).toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell>{exp.keyMetric}</TableCell>
                                    <TableCell>
                                        <Button variant="link" className="p-0 h-auto" onClick={() => handleViewDetails(exp)}>View Details</Button>
                                        <Button variant="link" className="p-0 h-auto text-destructive ml-4">Stop</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                         )}
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
             <DialogDescription>Define a new A/B test to run on the platform.</DialogDescription>
          </DialogHeader>
          <form id="create-experiment-form" onSubmit={handleCreateExperiment} className="space-y-6 py-4">
            <div>
              <Label htmlFor="experiment-name">Experiment Name</Label>
              <Input id="experiment-name" name="experiment-name" required />
            </div>
            <div>
              <Label htmlFor="experiment-description">Description / Hypothesis</Label>
              <Textarea id="experiment-description" name="experiment-description" rows={3} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Define Variables (A/B)</h3>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label htmlFor="variable-a">Variable A (Control)</Label>
                  <Input id="variable-a" name="variable-a" required />
                </div>
                <div className="flex-1">
                  <Label htmlFor="variable-b">Variable B (Variant)</Label>
                  <Input id="variable-b" name="variable-b" required />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="primary-metric">Primary Metric</Label>
              <Select name="primary-metric" required defaultValue='click_through_rate'>
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
              <Button type="submit" form="create-experiment-form">
                Create Experiment
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Experiment Details View */}
      <div className={cn(!showDetails && 'hidden')}>
        <Button variant="ghost" onClick={handleBackToDashboard} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">{selectedExperiment?.name}</h1>
        <p className="text-muted-foreground mb-6">{selectedExperiment?.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Total Participants</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold text-primary">
                        {(selectedExperiment?.results.control_participants || 0) + (selectedExperiment?.results.variant_participants || 0)}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Control (A) Conversion</CardTitle>
                </CardHeader>
                 <CardContent>
                    <p className="text-4xl font-bold text-green-500">
                        {selectedExperiment?.results.control_participants 
                            ? ((selectedExperiment.results.control_conversions / selectedExperiment.results.control_participants) * 100).toFixed(2)
                            : 0}%
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Variant (B) Conversion</CardTitle>
                </CardHeader>
                 <CardContent>
                    <p className="text-4xl font-bold text-purple-500">
                         {selectedExperiment?.results.variant_participants 
                            ? ((selectedExperiment.results.variant_conversions / selectedExperiment.results.variant_participants) * 100).toFixed(2)
                            : 0}%
                    </p>
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
