import QrScanner from '@/components/qr-scanner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AppLogo } from '@/components/app-logo';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <Link href="/" className="flex items-center gap-2">
          <AppLogo />
          <h1 className="text-xl font-bold tracking-tight">ShopScan AI</h1>
        </Link>
        <Button asChild variant="ghost">
          <Link href="/dashboard">Retailer Dashboard</Link>
        </Button>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Shop Smarter, In-Store.
          </h2>
          <p className="max-w-xl mx-auto text-muted-foreground md:text-lg mb-8">
            Scan any product's QR code to get instant details, reviews, and
            AI-powered recommendations right on your phone.
          </p>
          <div className="max-w-xs mx-auto">
            <QrScanner />
          </div>
        </div>
      </main>
    </div>
  );
}
