
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ABTestingPage() {
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [showDetailsView, setShowDetailsView] = useState(false);

    // Placeholder data - in a real app, this would come from state management or an API
    const experiment = {
        name: 'Homepage UI Test',
        description: 'Testing if a different homepage layout increases customer engagement.',
        status: 'Running',
        statusColor: 'text-green-600',
        date: '2025-09-01 to 2025-10-01',
        metric: 'Click-Through Rate',
        result: 'Inconclusive',
        resultColor: 'text-yellow-600',
        participants: '1,289',
        controlRate: '4.2%',
        variantRate: '4.5%',
        recommendation: 'Insufficient data. Continue running the experiment to get a statistically significant result.',
    };

    const handleViewDetails = () => {
        setShowDetailsView(true);
    };

    const handleBackToDashboard = () => {
        setShowDetailsView(false);
    };

    if (showDetailsView) {
        return (
            <div className="container mx-auto space-y-6">
                <Button variant="ghost" onClick={handleBackToDashboard} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">{experiment.name}</CardTitle>
                        <CardDescription>{experiment.description}</CardDescription>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="text-center">
                        <CardHeader>
                            <CardTitle className="text-xl">Total Participants</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-primary">{experiment.participants}</p>
                        </CardContent>
                    </Card>
                    <Card className="text-center">
                        <CardHeader>
                            <CardTitle className="text-xl">Control (A) Conversion</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-green-600">{experiment.controlRate}</p>
                        </CardContent>
                    </Card>
                    <Card className="text-center">
                         <CardHeader>
                            <CardTitle className="text-xl">Variant (B) Conversion</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-purple-600">{experiment.variantRate}</p>
                        </CardContent>
                    </Card>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Results & Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg text-muted-foreground mb-6">{experiment.recommendation}</p>
                        <div className="flex gap-4">
                            <Button className="bg-green-600 hover:bg-green-700">Apply Winner</Button>
                            <Button variant="destructive">End Experiment</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">A/B Testing & Experimentation</h1>
                    <p className="text-muted-foreground mt-1">Create, manage, and analyze experiments to optimize customer experiences.</p>
                </div>
                <Button onClick={() => setCreateModalOpen(true)}>
                    Create New Experiment
                </Button>
            </div>
            
            <Separator className="my-6" />

            <Card>
                <CardContent className="p-0">
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
                            <TableRow className="hover:bg-muted/50">
                                <TableCell className="font-medium">{experiment.name}</TableCell>
                                <TableCell className={`font-semibold ${experiment.statusColor}`}>{experiment.status}</TableCell>
                                <TableCell>{experiment.date}</TableCell>
                                <TableCell>{experiment.metric}</TableCell>
                                <TableCell className={`font-semibold ${experiment.resultColor}`}>{experiment.result}</TableCell>
                                <TableCell className="space-x-4">
                                    <Button variant="link" className="p-0 h-auto" onClick={handleViewDetails}>View Details</Button>
                                    <Button variant="link" className="p-0 h-auto text-destructive hover:text-destructive/80">Stop</Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Create New Experiment</DialogTitle>
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
                            <h3 className="text-lg font-semibold mb-2">Define Variables (A/B)</h3>
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
                        <DialogFooter>
                            <Button type="submit">
                                Create Experiment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
