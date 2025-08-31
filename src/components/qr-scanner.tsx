'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { QrCode } from 'lucide-react';

export default function QrScanner() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSimulateScan = () => {
    // In a real app, this would come from the QR scanner result
    const productId = '1';
    setIsOpen(false);
    router.push(`/product/${productId}`);
  };

  return (
    <>
      <Button
        size="lg"
        className="w-full text-lg py-7"
        onClick={() => setIsOpen(true)}
      >
        <QrCode className="mr-2 h-6 w-6" />
        Scan QR Code
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Scan Product QR Code</DialogTitle>
            <DialogDescription>
              Point your camera at the QR code on the product tag.
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full aspect-square bg-slate-900/80 rounded-lg overflow-hidden flex items-center justify-center border">
            <div className="absolute top-0 left-0 w-full h-1 bg-accent/80 animate-scan-line shadow-[0_0_1rem_0.25rem_hsl(var(--accent)/0.5)]" />
            <QrCode className="h-32 w-32 text-white/10" />
          </div>
          <DialogFooter>
            <Button
              onClick={handleSimulateScan}
              className="w-full"
              variant="secondary"
            >
              Simulate Scan &rarr;
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
