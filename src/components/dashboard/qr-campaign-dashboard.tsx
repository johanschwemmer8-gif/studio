'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Eye, Loader2, Download, RefreshCw, AlertTriangle, CheckCircle2, MapPin, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

type BulkRequest = {
    id: string;
    campaignId: string;
    productName?: string;
    totalRequested: number;
    status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DRAFT';
    createdAt: any;
    itemsDone: number;
    storeName?: string;
    location?: string;
};

export default function QrCampaignDashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<BulkRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    
    useEffect(() => {
        if (!db || !user?.retailerId) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'bulkQrRequests'), where('retailerId', '==', user.retailerId));
        const unsubscribe = onSnapshot(q, snapshot => {
            const fetched = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as BulkRequest));
            fetched.sort((a, b) => {
                const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
                const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
                return bTime - aTime;
            });
            setRequests(fetched);
            setLoading(false);
        });
            
        return () => unsubscribe();
    }, [user?.retailerId]);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-black uppercase">Active Campaigns</h3>
            {requests.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed rounded-xl">
                    <p className="text-muted-foreground">No campaigns found.</p>
                </div>
            ) : requests.map(req => (
                <Card key={req.id} className="hover:border-primary/30 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-[10px] uppercase">{req.campaignId}</Badge>
                                <Badge className={cn("text-[10px] uppercase", req.status === 'COMPLETED' ? "bg-green-500" : "")}>{req.status}</Badge>
                            </div>
                            <CardTitle className="text-lg">{req.productName || 'Multiple Products'}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" /> {req.storeName} — {req.location}
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm">Details</Button>
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}
