'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import { QrCode, Loader2, Link2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function SingleQrTestGenerator() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState('https://interact-aoe.com');
  const { toast } = useToast();

  const handleGenerateTestQr = async () => {
    setIsLoading(true);
    setQrCodeUrl(null);
    if (!db) {
      toast({ title: 'Error', description: 'Firestore is not initialized.', variant: 'destructive'});
      setIsLoading(false);
      return;
    }

    try {
      // Use a unique ID for the test QR
      const qrCodeId = `test_${Date.now()}`;
      const qrRef = doc(db, 'qrcodes', qrCodeId);
      
      const qrData = {
          retailerId: 'simulated-retailer-id',
          campaignId: 'test-campaign',
          qrCodeId: qrCodeId,
          requestId: 'test-request',
          // Prioritize the custom destination URL entered by the user
          redirectUrl: destinationUrl || '/product/1',
          // The tracking URL is the standard entry point
          trackingUrl: `${window.location.origin}/scan/${qrCodeId}`,
          scanCount: 0,
          createdAt: new Date(),
          isTest: true,
      };
      
      await setDoc(qrRef, qrData);

      // Encode the tracking URL into the QR code
      const encodedUrl = encodeURIComponent(qrData.trackingUrl);
      const generatedQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodedUrl}`;
      
      setQrCodeUrl(generatedQrUrl);
      toast({
          title: 'Test QR Code Ready!',
          description: 'Scan the code with your phone to begin the test journey.',
      });

    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || 'Could not create test QR code in Firestore.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/10 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Interactive Test Laboratory
        </CardTitle>
        <CardDescription>
          Generate a single, live QR code to test the complete scan-to-interaction flow. Assign a custom destination URL to test your own business links or website.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="dest-url" className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-muted-foreground">
                <Link2 className="h-3.5 w-3.5 text-primary" />
                Test Destination URL
            </Label>
            <Input 
                id="dest-url" 
                placeholder="e.g. https://your-website.com" 
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="h-11 bg-muted/30 focus-visible:ring-primary/20"
            />
            <p className="text-[10px] text-muted-foreground italic">
                The shopper will arrive at this URL after Ari greets them and provides buying guidance.
            </p>
          </div>
          
          <Button onClick={handleGenerateTestQr} disabled={isLoading} className="w-full h-12 rounded-xl font-bold gap-2">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
            Generate Interactive Test Code
          </Button>
           <p className="text-[10px] text-muted-foreground text-center font-medium">
             This creates a live record in the Decision Intelligence Layer.
           </p>
        </div>

         <div className="flex flex-col items-center justify-center bg-muted/50 p-6 rounded-2xl min-h-[240px] border-2 border-dashed border-primary/10 relative overflow-hidden">
            {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-xs font-bold text-primary animate-pulse">Syncing with Infrastructure...</p>
                </div>
            ) : qrCodeUrl ? (
              <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="p-4 bg-white rounded-xl shadow-2xl border">
                    <Image
                        src={qrCodeUrl}
                        alt="Generated Test QR Code"
                        width={180}
                        height={180}
                        className="mx-auto"
                    />
                </div>
                <div className="space-y-1">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black uppercase text-[10px]">
                        SCAN TO TEST REDIRECT
                    </Badge>
                    <p className="text-[9px] text-muted-foreground font-mono truncate max-w-[200px] mt-2">Target: {destinationUrl}</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground/30">
                <QrCode className="h-20 w-20 mx-auto mb-4 opacity-10" />
                <p className="font-bold text-sm">Visual Preview Window</p>
                <p className="text-[10px] mt-1">Generate a code to see it here.</p>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
