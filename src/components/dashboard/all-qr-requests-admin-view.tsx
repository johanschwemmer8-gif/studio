
'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { CalendarIcon, Download, Eye, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { generateZipForRequest } from '@/ai/flows/generate-zip-for-request';
import { processBulkQrQueue } from '@/ai/flows/process-bulk-qr-queue';
import { deleteBulkQrRequest } from '@/ai/flows/delete-bulk-qr-request';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import QrRequestItemAdminView from './qr-request-item-admin-view';

// This is a mock/stub for Firestore client-side interaction.
const createMockDb = () => {
    return {
        collection: (name: string) => ({
            orderBy: (field: string, dir: string) => ({
                onSnapshot: (callback: (snapshot: any) => void) => {
                    const mockRequests = JSON.parse(localStorage.getItem('mockBulkQrRequests') || '[]');
                    const sorted = mockRequests.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    setTimeout(() => {
                        callback({
                            docs: sorted.map((doc: any) => ({ id: doc.id, data: () => doc })),
                            empty: sorted.length === 0,
                        })
                    }, 100);
                    return () => {}; // Unsubscribe
                },
            }),
        }),
    };
};

type BulkRequest = {
    id: string;
    retailerId: string;
    campaignId: string;
    status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    totalRequested: number;
    createdAt: string; // ISO string
    items: any[];
};

export default function AllQrRequestsAdminView() {
    const [requests, setRequests] = useState<BulkRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [retailerFilter, setRetailerFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 30), to: new Date() });
    const [isProcessing, startProcessing] = useTransition();
    const [isDeleting, startDeleting] = useTransition();
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

    const { toast } = useToast();
    const firestore = createMockDb();

    useEffect(() => {
        setLoading(true);
        const unsubscribe = firestore.collection('bulkQrRequests').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            const fetchedRequests: BulkRequest[] = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
            }));
            setRequests(fetchedRequests);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    const uniqueRetailers = useMemo(() => [...new Set(requests.map(r => r.retailerId))], [requests]);

    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const reqDate = new Date(req.createdAt);
            const isRetailerMatch = retailerFilter === 'all' || req.retailerId === retailerFilter;
            const isStatusMatch = statusFilter === 'all' || req.status === statusFilter;
            const isDateMatch = !dateRange?.from || !dateRange?.to || (reqDate >= dateRange.from && reqDate <= dateRange.to);
            return isRetailerMatch && isStatusMatch && isDateMatch;
        });
    }, [requests, retailerFilter, statusFilter, dateRange]);

    const handleAction = async (action: () => Promise<{success: boolean, message: string}>, successTitle: string) => {
        startProcessing(async () => {
            try {
                const result = await action();
                if (result.success) {
                    toast({ title: successTitle, description: result.message });
                } else {
                    throw new Error(result.message);
                }
            } catch (error: any) {
                toast({ title: "Action Failed", description: error.message, variant: 'destructive' });
            }
        });
    };

    const handleDelete = async (requestId: string) => {
        startDeleting(async () => {
            try {
                const result = await deleteBulkQrRequest({ requestId });
                if (result.success) {
                    toast({ title: "Request Deleted", description: result.message });
                } else {
                    throw new Error(result.message);
                }
            } catch (error: any) {
                toast({ title: "Deletion Failed", description: error.message, variant: 'destructive' });
            }
        });
    }

    if (selectedRequestId) {
        return <QrRequestItemAdminView requestId={selectedRequestId} onBack={() => setSelectedRequestId(null)} />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>All QR Code Bulk Requests</CardTitle>
                <CardDescription>View, manage, and troubleshoot all requests across all retailers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg">
                    <Select value={retailerFilter} onValueChange={setRetailerFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by retailer..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Retailers</SelectItem>
                            {uniqueRetailers.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by status..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="QUEUED">Queued</SelectItem>
                            <SelectItem value="PROCESSING">Processing</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                     <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                              dateRange.to ? (
                                `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                              ) : (
                                format(dateRange.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                </div>
                 <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Retailer / Campaign</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Progress</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center h-24">Loading requests...</TableCell></TableRow>
                            ) : filteredRequests.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center h-24">No requests found.</TableCell></TableRow>
                            ) : (
                                filteredRequests.map(req => {
                                    const itemsDone = req.items?.filter(i => i.status === 'DONE').length || 0;
                                    const progress = req.totalRequested > 0 ? (itemsDone / req.totalRequested) * 100 : 0;
                                    return (
                                        <TableRow key={req.id}>
                                            <TableCell>
                                                <p className="font-semibold">{req.retailerId}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{req.campaignId}</p>
                                            </TableCell>
                                            <TableCell><Badge variant={req.status === 'COMPLETED' ? 'default' : 'secondary'}>{req.status}</Badge></TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={progress} className="w-24" />
                                                    <span className="text-xs font-medium">{itemsDone}/{req.totalRequested}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedRequestId(req.id)}><Eye className="mr-2"/>View</Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleAction(() => generateZipForRequest({ requestId: req.id }), "ZIP Generated")} disabled={isProcessing}><Download className="mr-2"/>ZIP</Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleAction(processBulkQrQueue, "Regeneration Triggered")} disabled={isProcessing}><RefreshCw className="mr-2"/>Regen</Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="mr-2"/>Delete</Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the request '{req.campaignId}' and all its items. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(req.id)} disabled={isDeleting}>
                                                            {isDeleting && <Loader2 className="animate-spin mr-2"/>}
                                                            Delete
                                                            </AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
