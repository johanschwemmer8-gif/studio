'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import { QrCode, Loader2, Link2, Sparkles, FlaskConical, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SingleQrTestGenerator() {
  const { user } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState('https://interact-aoe.com');
  const { toast } = useToast();

  const handleGenerateTestQr = async () => {
    setIsLoading(true);
    setQrCodeUrl(null);
    if (!db || !user?.retailerId) {
      toast({ title: 'Error', description: 'Handshake with identity infrastructure failed.', variant: 'destructive'});
      setIsLoading(false);
      return;
    }

    try {
      const qrCodeId = `test_${Date.now()}`;
      const qrRef = doc(db, 'qrcodes', qrCodeId);
      
      const qrData = {
          retailerId: user.retailerId,
          campaignId: 'Test Laboratory',
          qrCodeId: qrCodeId,
          requestId: 'test-request',
          redirectUrl: destinationUrl || '/p/06001234567891',
          trackingUrl: `${window.location.origin}/scan/${qrCodeId}`,
          scanCount: 0,
          createdAt: new Date(),
          isTest: true,
      };
      
      await setDoc(qrRef, qrData);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
          <FlaskConical className="text-primary h-7 w-7" />
          Interactive Test Laboratory
        </h2>
        <p className="text-muted-foreground text-sm">
          Simulate the scan-to-interaction journey in an isolated test environment.
        </p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-xs font-black uppercase text-blue-700 tracking-widest">Lab Use Only</AlertTitle>
        <AlertDescription className="text-xs text-blue-600 leading-relaxed">
          Codes generated here create <strong>Test Records</strong> in the Intelligence Layer. Do not use these for physical store deployment. 
          Use the <strong>Activate a Shelf</strong> workflow for production.
        </AlertDescription>
      </Alert>

      <Card className="border-primary/10 shadow-md">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Simulation Config</CardTitle>
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
              <p className="text-[10px] text-muted-foreground italic leading-tight">
                  The shopper will arrive at this URL after Ari provides guidance.
              </p>
            </div>
            
            <Button onClick={handleGenerateTestQr} disabled={isLoading} className="w-full h-12 rounded-xl font-bold gap-2">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
              Generate Test Activation
            </Button>
          </div>

           <div className="flex flex-col items-center justify-center bg-muted/50 p-6 rounded-2xl min-h-[240px] border-2 border-dashed border-primary/10 relative overflow-hidden">
              {isLoading ? (
                  <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <p className="text-xs font-bold text-primary animate-pulse">Syncing with Lab Infrastructure...</p>
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
                  <p className="font-bold text-sm">Lab Window</p>
                  <p className="text-[10px] mt-1 text-center">Generate a test code to see it here.</p>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
