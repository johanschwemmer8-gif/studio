'use client';

import { useState } from 'react';
import QRCode from 'qrcode';
import {
  FlaskConical,
  Link2,
  Loader2,
  QrCode,
  AlertTriangle,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function SingleQrTestGenerator() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState(
    'https://interactaoe.co.za'
  );
  const { toast } = useToast();

  const handleGenerateTestQr = async () => {
    setIsLoading(true);
    setQrCodeUrl(null);

    try {
      const destination = new URL(destinationUrl);

      if (destination.protocol !== 'https:' && destination.protocol !== 'http:') {
        throw new Error('Enter a valid HTTP or HTTPS destination URL.');
      }

      const dataUrl = await QRCode.toDataURL(destination.toString(), {
        width: 256,
        margin: 2,
        errorCorrectionLevel: 'M',
      });

      setQrCodeUrl(dataUrl);

      toast({
        title: 'Simulation QR Ready',
        description:
          'This QR exists only in your browser and does not create a production QR identity.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not generate the simulation QR.';

      toast({
        title: 'Generation Failed',
        description: message,
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
          Test QR presentation and destination behaviour without creating
          production Campaign, Activation, Deployment or QR records.
        </p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-xs font-black uppercase text-blue-700 tracking-widest">
          Isolated Simulation
        </AlertTitle>
        <AlertDescription className="text-xs text-blue-600 leading-relaxed">
          Codes generated here are temporary browser simulations. They are not
          registered QR identities and must not be used for physical store
          deployment. Use <strong>Activate Shelves</strong> for production.
        </AlertDescription>
      </Alert>

      <Card className="border-primary/10 shadow-md">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Simulation Config
          </CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label
                htmlFor="dest-url"
                className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-muted-foreground"
              >
                <Link2 className="h-3.5 w-3.5 text-primary" />
                Test Destination URL
              </Label>

              <Input
                id="dest-url"
                placeholder="e.g. https://your-website.com"
                value={destinationUrl}
                onChange={(event) => setDestinationUrl(event.target.value)}
                className="h-11 bg-muted/30 focus-visible:ring-primary/20"
              />

              <p className="text-[10px] text-muted-foreground italic leading-tight">
                The generated QR opens this URL directly. No Firestore record,
                shopper session or production identity is created.
              </p>
            </div>

            <Button
              onClick={handleGenerateTestQr}
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-bold gap-2"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              Generate Simulation QR
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center bg-muted/50 p-6 rounded-2xl min-h-[240px] border-2 border-dashed border-primary/10 relative overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-xs font-bold text-primary animate-pulse">
                  Generating Simulation...
                </p>
              </div>
            ) : qrCodeUrl ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-white rounded-xl shadow-2xl border">
                  <img
                    src={qrCodeUrl}
                    alt="Generated simulation QR code"
                    width={180}
                    height={180}
                    className="mx-auto"
                  />
                </div>

                <div className="space-y-1">
                  <Badge
                    variant="outline"
                    className="bg-primary/5 text-primary border-primary/20 font-black uppercase text-[10px]"
                  >
                    Simulation Only
                  </Badge>
                  <p className="text-[9px] text-muted-foreground font-mono truncate max-w-[200px] mt-2">
                    Target: {destinationUrl}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground/30">
                <QrCode className="h-20 w-20 mx-auto mb-4 opacity-10" />
                <p className="font-bold text-sm">Lab Window</p>
                <p className="text-[10px] mt-1">
                  Generate a simulation QR to see it here.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
