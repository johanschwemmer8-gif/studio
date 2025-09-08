
import { Button } from '@/components/ui/button';
import QrScanner from '@/components/qr-scanner';
import Link from 'next/link';
import { notFound } from 'next/navigation';

function formatRetailerName(slug: string) {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export default function RetailerLandingPage({ params }: { params: { name: string } }) {
    if (!params.name) {
        notFound();
    }
    const retailerName = formatRetailerName(params.name);

    return (
        <div className="flex flex-col min-h-screen">
            <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
                <Link href={`/retailer/${params.name}`} className="font-bold text-lg">
                    {retailerName}
                </Link>
                <Button asChild variant="ghost">
                    <Link href={`/dashboard/dashboard?retailer=${params.name}`}>{retailerName} Dashboard</Link>
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
