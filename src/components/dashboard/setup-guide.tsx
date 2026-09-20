'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Sparkles,
} from 'lucide-react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

function SetupGuide({ retailerId }: { retailerId: string }) {
  const [status, setStatus] = useState({ network: false, brand: false, catalog: false, qr: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!db || !retailerId || retailerId === 'unknown') return;
      try {
        const [orgSnap, brandSnap, productsSnap, qrsSnap] = await Promise.all([
          getDoc(doc(db, 'configurations', `${retailerId}_org`)),
          getDoc(doc(db, 'configurations', `${retailerId}_brand`)),
          getDocs(query(collection(db, 'products'), where('retailerId', '==', retailerId), limit(1))),
          getDocs(query(collection(db, 'qrcodes'), where('retailerId', '==', retailerId), limit(1)))
        ]);
        
        setStatus({
          network: orgSnap.exists(),
          brand: brandSnap.exists(),
          catalog: !productsSnap.empty,
          qr: !qrsSnap.empty
        });
      } catch (e) {
        console.warn("Status check friction.");
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [retailerId]);

  if (loading) return <Skeleton className="h-48 w-full rounded-2xl" />;

  const steps = [
    { label: "My Retail Network", href: "/retailer-mvp/organization", done: status.network, desc: "Define your stores and brands." },
    { label: "Brand & Experience", href: "/retailer-mvp/ui-management", done: status.brand, desc: "Upload logos and pick a template." },
    { label: "Product Catalog", href: "/retailer-mvp/products", done: status.catalog, desc: "Add products you want to activate." },
    { label: "QR Activation", href: "/retailer-mvp/qr-management", done: status.qr, desc: "Create your first digital link." },
    { label: "Learn the Platform", href: "/retailer-mvp/documentation", done: true, desc: "Review metrics and training guides.", optional: true },
  ];

  const isComplete = status.network && status.brand && status.catalog && status.qr;
  if (isComplete) return null;

  return (
    <Card className="border-accent bg-accent/5 shadow-lg border-2 overflow-hidden mb-8">
      <CardHeader className="bg-accent/10 py-4">
        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-foreground" />
          Welcome! Let's get started
        </CardTitle>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 pt-6">
        {steps.map((step) => (
          <Link key={step.label} href={step.href} className="group block space-y-2">
            <div className="flex items-center gap-3">
              {step.done ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />}
              <span className={cn("font-bold text-sm group-hover:underline", step.done && !step.optional && "text-muted-foreground")}>{step.label}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight pl-8">{step.desc}</p>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export default SetupGuide;
