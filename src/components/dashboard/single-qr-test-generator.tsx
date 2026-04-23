'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import { QrCode, Loader2 } from 'lucide-react';

export default function SingleQrTestGenerator() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
      const qrCodeId = `test_${Date.now()}`;
      const qrRef = doc(db, 'qrcodes', qrCodeId);
      
      const qrData = {
          retailerId: 'simulated-retailer-id',
          campaignId: 'test-campaign',
          qrCodeId: qrCodeId,
          requestId: 'test-request',
          redirectUrl: '/product/1', // Final destination after interaction
          trackingUrl: `${window.location.origin}/track/${qrCodeId}`,
          scanCount: 0,
          createdAt: new Date(),
      };
      
      await setDoc(qrRef, qrData);

      const encodedUrl = encodeURIComponent(qrData.trackingUrl);
      const generatedQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodedUrl}`;
      
      setQrCodeUrl(generatedQrUrl);
      toast({
          title: 'Test QR Code Ready!',
          description: 'Scan the code with your phone to begin the test.',
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
    <Card>
      <CardHeader>
        <CardTitle>Test a QR Code</CardTitle>
        <CardDescription>
          Generate a single, live QR code to test the complete scan-to-interaction flow with your phone.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <Button onClick={handleGenerateTestQr} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
            Generate Test QR Code
          </Button>
           <p className="text-xs text-muted-foreground mt-2">This will create a live QR code record in your database for testing.</p>
        </div>
         <div className="flex flex-col items-center justify-center bg-muted/50 p-4 rounded-lg min-h-[200px]">
            {isLoading ? (
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            ) : qrCodeUrl ? (
              <Image
                src={qrCodeUrl}
                alt="Generated Test QR Code"
                width={180}
                height={180}
                className="rounded-md border bg-white"
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <QrCode className="h-16 w-16 mx-auto mb-4" />
                <p>Your test QR code will appear here.</p>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
