
'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { CalendarIcon, Download, FileText, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getScanEvents, GetScanEventsOutput } from '@/ai/flows/get-scan-events';
import { Skeleton } from '../ui/skeleton';
import Papa from 'papaparse';

export default function QrScanActivityView() {
    const [events, setEvents] = useState<GetScanEventsOutput>([]);
    const [loading, startLoading] = useTransition();
    const [retailerFilter, setRetailerFilter] = useState<string | undefined>(undefined);
    const [campaignFilter, setCampaignFilter] = useState<string | undefined>(undefined);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 7), to: new Date() });
    
    const { toast } = useToast();

    const fetchEvents = () => {
        startLoading(async () => {
            try {
                const result = await getScanEvents({
                    retailerId: retailerFilter,
                    campaignId: campaignFilter,
                    startDate: dateRange?.from?.toISOString(),
                    endDate: dateRange?.to?.toISOString(),
                });
                setEvents(result);
            } catch (error: any) {
                toast({
                    title: 'Failed to fetch scan events',
                    description: error.message,
                    variant: 'destructive',
                });
            }
        });
    };

    useEffect(() => {
        fetchEvents();
    }, [retailerFilter, campaignFilter, dateRange]);

    const uniqueRetailers = useMemo(() => [...new Set(events.map(e => e.retailerId))], [events]);
    const uniqueCampaigns = useMemo(() => [...new Set(events.map(e => e.campaignId))], [events]);

    const handleExport = () => {
        if (events.length === 0) {
            toast({ title: 'No data to export', variant: 'destructive' });
            return;
        }
        const csv = Papa.unparse(events);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'scan_activity.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>QR Code Scan Activity</CardTitle>
                <CardDescription>A real-time log of all QR code scan events across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <Select value={retailerFilter || 'all'} onValueChange={(value) => setRetailerFilter(value === 'all' ? undefined : value)}>
                        <SelectTrigger><SelectValue placeholder="All Retailers" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Retailers</SelectItem>
                            {uniqueRetailers.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={campaignFilter || 'all'} onValueChange={(value) => setCampaignFilter(value === 'all' ? undefined : value)}>
                        <SelectTrigger><SelectValue placeholder="All Campaigns" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Campaigns</SelectItem>
                            {uniqueCampaigns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`: format(dateRange.from, "LLL dd, y")) : (<span>Pick a date range</span>)}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/>
                        </PopoverContent>
                      </Popover>
                      <div className="flex items-center gap-2">
                        <Button onClick={handleExport} variant="outline" className="w-full"><FileText className="mr-2"/>Export CSV</Button>
                        <Button onClick={fetchEvents} variant="secondary" size="icon" disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""}/></Button>
                      </div>
                </div>
                 <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>QR Code ID</TableHead>
                                <TableHead>Retailer / Campaign</TableHead>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>User Agent</TableHead>
                                <TableHead>Referrer</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    </TableRow>
                                ))
                            ) : events.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center h-24">No scan events found for the selected filters.</TableCell></TableRow>
                            ) : (
                                events.map(event => (
                                    <TableRow key={event.eventId}>
                                        <TableCell className="font-mono text-xs text-primary">{event.qrCodeId}</TableCell>
                                        <TableCell>
                                            <p className="font-semibold">{event.retailerId}</p>
                                            <p className="text-xs text-muted-foreground">{event.campaignId}</p>
                                        </TableCell>
                                        <TableCell className="text-xs">{new Date(event.timestamp).toLocaleString()}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{event.userAgent}</TableCell>
                                        <TableCell>{event.referrer ? <Badge variant="secondary">{new URL(event.referrer).hostname}</Badge> : 'Direct'}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
