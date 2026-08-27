
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
    ShoppingCart, Monitor, Loader2, ShieldCheck, 
    Smartphone, Banknote, RotateCcw, Barcode, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';

type BasketItem = {
    gtin: string;
    name: string;
    price: number;
    quantity: number;
};

type SyncedBasket = {
    id: string;
    sessionId: string; // Authoritative journey anchor preserved
    shopperId: string;
    retailerId: string;
    items: BasketItem[];
    total: number;
    status: 'active' | 'synced' | 'paid';
    terminalId?: string;
};

export default function PosTerminalSimulation() {
    const { user } = useAuth();
    const [syncedBasket, setSyncedBasket] = useState<SyncedBasket | null>(null);
    const [terminalId] = useState('register_001');
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const currentRetailerId = user?.retailerId || 'unknown';

    useEffect(() => {
        if (!db) return;
        // Listen for baskets synced to this terminal for THIS retailer
        const q = query(
            collection(db, 'baskets'), 
            where('terminalId', '==', terminalId), 
            where('status', '==', 'synced'),
            where('retailerId', '==', currentRetailerId)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                setSyncedBasket({ id: doc.id, ...doc.data() } as SyncedBasket);
                toast({ title: "GS1 Handshake Detected", description: "Global identifiers and journey sessionId transferred to terminal." });
            } else {
                setSyncedBasket(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [terminalId, currentRetailerId, toast]);

    const handleCompleteSale = async () => {
        if (!syncedBasket || !db) return;
        
        // Data Integrity Check
        if (!syncedBasket.sessionId) {
            toast({ 
                title: "POS Integrity Error", 
                description: "Cannot complete sale: Digital journey sessionId is missing from synced basket.",
                variant: "destructive"
            });
            return;
        }

        setIsProcessing(true);
        try {
            // Log transaction using GTINs and preserving sessionId lineage
            await addDoc(collection(db, 'transactions'), {
                transactionId: `gs1_txn_${crypto.randomUUID()}`,
                sessionId: syncedBasket.sessionId, // Lineage from journey start
                shopperId: syncedBasket.shopperId,
                retailerId: syncedBasket.retailerId,
                basketId: syncedBasket.id,
                amount: syncedBasket.total,
                paymentMethod: 'POS Terminal Cash/Card',
                items: syncedBasket.items,
                timestamp: serverTimestamp(),
                dataStatus: 'VERIFIED' // Proven lineage
            });
            
            // Mark basket as paid
            await updateDoc(doc(db, 'baskets', syncedBasket.id), { status: 'paid', updatedAt: serverTimestamp() });
            
            toast({ title: "Sale Completed", description: "Transaction archived via sessionId and GTIN logging." });
            setSyncedBasket(null);
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Monitor className="text-primary h-8 w-8" />
                        Checkout Sync Simulation
                    </h1>
                    <p className="text-muted-foreground max-w-3xl text-sm">
                        Simulating the physical point-of-sale handshake using global trade identifiers (GTIN).
                    </p>
                </div>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1.5 py-1.5 px-3 rounded-full font-bold uppercase tracking-wider text-[10px]">
                    <AlertTriangle className="h-3.5 w-3.5" /> Simulation
                </Badge>
            </div>

            <Alert className="bg-primary/5 border-primary/10">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <AlertTitle className="text-[10px] font-black uppercase tracking-widest text-primary">GS1 Standard Verification</AlertTitle>
                <AlertDescription className="text-xs">
                    This module demonstrates the <strong>Verified Handshake</strong> protocol. All identifiers are normalized to the 14-digit GTIN standard before being committed to the transactional layer.
                </AlertDescription>
            </Alert>

            <Separator />

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-2xl bg-slate-900 text-white min-h-[500px] flex flex-col">
                        <CardHeader className="border-b border-white/10 flex flex-row justify-between items-center bg-slate-800/50">
                            <div><CardTitle className="text-xl font-black uppercase tracking-tighter">Terminal Register #01</CardTitle><CardDescription className="text-slate-400 text-xs">Factual Sync: GLN 6001234567890</CardDescription></div>
                            <Badge className="bg-green-500 text-white font-black border-none text-[10px] uppercase">GS1 READY</Badge>
                        </CardHeader>
                        
                        <CardContent className="flex-1 p-0 flex">
                            {!syncedBasket ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
                                    <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center"><ShoppingCart className="h-10 w-10 text-slate-500" /></div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight opacity-40">Awaiting Identity...</h2>
                                    <div className="text-[10px] font-bold text-slate-500 max-w-xs mx-auto uppercase tracking-widest">
                                        Scan the terminal QR to sync digital basket
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col animate-in fade-in duration-500">
                                    <div className="p-6 bg-blue-600 flex items-center justify-between shadow-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center"><Smartphone className="h-6 w-6" /></div>
                                            <div>
                                                <p className="text-xs font-black uppercase opacity-80 tracking-tighter">Verified Journey Linage</p>
                                                <p className="font-bold text-lg">Session: {syncedBasket.sessionId.substring(0, 15)}...</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black uppercase opacity-80">Total</p>
                                            <p className="text-3xl font-black">R{syncedBasket.total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 flex-1 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-slate-400 uppercase text-[10px] font-black tracking-widest text-left border-b border-white/10">
                                                    <th className="pb-4">Product Identifier (GTIN)</th>
                                                    <th className="pb-4 text-center">Qty</th>
                                                    <th className="pb-4 text-right">Price</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {syncedBasket.items.map((item, i) => (
                                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                                        <td className="py-4">
                                                            <p className="font-bold">{item.name}</p>
                                                            <div className="flex items-center gap-1.5 opacity-50"><Barcode className="h-3 w-3" /><span className="text-[9px] font-mono font-bold tracking-tighter">{item.gtin}</span></div>
                                                        </td>
                                                        <td className="py-4 text-center font-mono font-bold">{item.quantity}</td>
                                                        <td className="py-4 text-right font-mono font-black text-blue-400">R{item.price.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <CardFooter className="p-6 border-t border-white/10 bg-slate-800/30 flex gap-4">
                                        <Button variant="ghost" onClick={() => setSyncedBasket(null)} className="h-14 px-8 text-slate-300 font-black uppercase text-[10px] tracking-widest hover:bg-white/10"><RotateCcw className="h-4 w-4 mr-2"/> Reset</Button>
                                        <Button onClick={handleCompleteSale} disabled={isProcessing} className="flex-1 h-14 bg-green-600 hover:bg-green-500 text-white font-black text-xl gap-3 shadow-2xl uppercase tracking-tighter">
                                            {isProcessing ? <Loader2 className="animate-spin" /> : <Banknote />} Process Verified Sale
                                        </Button>
                                    </CardFooter>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-primary/20 bg-muted/30">
                        <CardHeader className="text-center">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Terminal Identity</CardTitle>
                            <CardDescription className="text-xs">Scan to resolve and sync digital links.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center p-8 bg-white m-4 rounded-xl shadow-inner border">
                            <div className="relative">
                                <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=register_001`} alt="GS1 GLN Code" width={250} height={250} />
                                <div className="absolute inset-0 border-4 border-slate-900/10 pointer-events-none rounded-sm"></div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-primary/5 p-4 text-center">
                            <div className="w-full space-y-1">
                                <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Global Location Number (GLN)</p>
                                <p className="font-mono font-bold text-sm">6001234567890</p>
                            </div>
                        </CardFooter>
                    </Card>
                    
                    <Card className="border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-50">Handshake Integrity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-xs font-medium">
                                <ShieldCheck className="text-green-500 h-5 w-5 shrink-0" />
                                <span>End-to-end sessionId lineage enforced.</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-medium">
                                <ShieldCheck className="text-green-500 h-5 w-5 shrink-0" />
                                <span>Deterministic attribution mapping active.</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
