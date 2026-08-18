import QrScanInteraction from '@/components/product/qr-scan-interaction';
import { Suspense } from 'react';

function InteractionLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <div className="w-full max-w-sm mx-auto animate-pulse">
                 <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-muted h-12 w-12"></div>
                    <div className="flex-1 space-y-3 py-1">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * SCAN INTERACTION GATEWAY
 * Standard entry point for all iNteract QR scans.
 * In Next.js 15, params is a promise and must be awaited.
 */
export default async function ScanPage({ params }: { params: Promise<{ qrCodeId: string }> }) {
  const { qrCodeId } = await params;
  
  return (
    <Suspense fallback={<InteractionLoading />}>
      <QrScanInteraction qrId={qrCodeId} />
    </Suspense>
  );
}
