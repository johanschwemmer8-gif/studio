
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { analytics, remoteConfig } from '@/lib/firebase';
import { fetchAndActivate, getString } from 'firebase/remote-config';
import { logEvent } from 'firebase/analytics';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function InStoreDisplayPage() {
  const [greeting, setGreeting] = useState('');
  const [variant, setVariant] = useState('default');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (remoteConfig) {
      fetchAndActivate(remoteConfig)
        .then(() => {
          const message = getString(remoteConfig, 'in_store_greeting_message');
          const experimentVariant = getString(remoteConfig, 'experiment_variant_id');
          setGreeting(message);
          setVariant(experimentVariant || 'default');
        })
        .catch((err) => {
          console.error('Remote Config fetch failed:', err);
          // Set default value on failure
          setGreeting('Welcome to our special event!');
        })
        .finally(() => {
            setLoading(false);
        });
    } else {
        // Fallback for SSR or if remote config is disabled
        setGreeting('Welcome to our special event!');
        setLoading(false);
    }
  }, []);

  const handleShopNowClick = () => {
    if (analytics) {
      logEvent(analytics, 'shop_now_clicked', {
        experiment_variant: variant,
      });
      alert(`Analytics event 'shop_now_clicked' logged with variant: ${variant}`);
    } else {
        alert('Firebase Analytics is not available.');
    }
  };

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle>In-Store Experience</CardTitle>
          <CardDescription>
            This page demonstrates fetching live content from Firebase Remote Config.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div id="greeting-display" className="text-3xl font-bold text-primary min-h-[40px]">
            {loading ? 'Loading...' : greeting}
          </div>
          <Button id="shop-now-button" size="lg" onClick={handleShopNowClick}>
            Shop Now
          </Button>
          <p className="text-xs text-muted-foreground pt-4">
              Clicking "Shop Now" will log a custom event to Firebase Analytics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
