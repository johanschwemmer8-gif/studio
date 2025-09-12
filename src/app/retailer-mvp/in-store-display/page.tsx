
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { analytics, remoteConfig } from '@/lib/firebase';
import { fetchAndActivate, getString } from 'firebase/remote-config';
import { logEvent } from 'firebase/analytics';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Sparkles, Tv } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import DisplayManager from '@/components/dashboard/display-manager';


type ContentType = 'static_image' | 'dynamic_ai_prompt' | 'promotional_video' | 'product_showcase';

function LivePreview({ config }: { config: any }) {
  return (
    <Card className="sticky top-6">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Tv /> Live Preview</CardTitle>
            <CardDescription>This is what will be displayed on the in-store screen.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="aspect-video w-full bg-slate-900 rounded-lg flex items-center justify-center p-4 text-center text-white overflow-hidden relative">
                {config.type === 'static_image' && config.imageUrl && (
                    <Image src={config.imageUrl} alt="Preview" fill objectFit="contain" />
                )}
                {config.type === 'dynamic_ai_prompt' && (
                    <div className="space-y-4">
                        <Sparkles className="h-12 w-12 mx-auto text-accent" />
                        <h3 className="text-xl font-bold">Dynamic AI Content</h3>
                        <p className="text-sm text-muted-foreground italic">"{config.prompt}"</p>
                    </div>
                )}
                 {config.type === 'promotional_video' && (
                    <div className="space-y-4">
                         <h3 className="text-xl font-bold">{config.videoHeadline}</h3>
                         <p className="text-sm text-muted-foreground">Video will play here</p>
                    </div>
                )}
                 {config.type === 'product_showcase' && (
                    <div className="space-y-4">
                         <h3 className="text-xl font-bold">Showcasing: {config.productSku}</h3>
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
  );
}


export default function InStoreDisplayPage() {
  const [greeting, setGreeting] = useState('');
  const [variant, setVariant] = useState('default');
  const [loading, setLoading] = useState(true);
  
  const [contentType, setContentType] = useState<ContentType>('dynamic_ai_prompt');
  const [config, setConfig] = useState<any>({type: 'dynamic_ai_prompt', prompt: 'Highlight today\'s best deals.'});
  const { toast } = useToast();

   useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'inStoreConfigs'), (snapshot) => {
        if (!snapshot.empty) {
            // Get the latest config
            const latestDoc = snapshot.docs[snapshot.docs.length - 1];
            setConfig(latestDoc.data().contentSlot);
        }
    });
    return () => unsubscribe();
  }, []);

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
          setGreeting('Welcome to our special event!');
        })
        .finally(() => {
            setLoading(false);
        });
    } else {
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

  const handleContentTypeChange = (value: ContentType) => {
    setContentType(value);
    setConfig({ type: value }); 
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
          handleConfigChange('imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = async () => {
     if (!db) {
        toast({ title: 'Error', description: 'Firestore is not initialized.', variant: 'destructive'});
        return;
    }
    try {
        await addDoc(collection(db, 'inStoreConfigs'), {
            retailerId: 'ret_123xyz',
            configId: `config_${Date.now()}`,
            contentSlot: config,
            isActive: false, // Default to inactive, activate from the management table
            lastUpdated: serverTimestamp()
        });
        toast({
            title: "Configuration Saved!",
            description: "The new in-store display content has been saved.",
        });
    } catch (error) {
        console.error("Error saving config: ", error);
        toast({ title: 'Error', description: 'Failed to save configuration.', variant: 'destructive'});
    }
  };

  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">In-Store Experience</h2>
            <p className="text-muted-foreground max-w-3xl">
                Manage the content displayed on your in-store digital screens and see a live demonstration of how content is fetched from Firebase Remote Config.
            </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Content Configuration</CardTitle>
                        <CardDescription>Select a content type and define its settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="content-type">Content Type</Label>
                            <Select onValueChange={handleContentTypeChange} value={contentType}>
                                <SelectTrigger id="content-type">
                                    <SelectValue placeholder="Select a content type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dynamic_ai_prompt">Dynamic AI Prompt</SelectItem>
                                    <SelectItem value="static_image">Static Image</SelectItem>
                                    <SelectItem value="promotional_video">Promotional Video</SelectItem>
                                    <SelectItem value="product_showcase">Product Showcase</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {contentType === 'dynamic_ai_prompt' && (
                            <div className="space-y-2">
                                <Label htmlFor="ai-prompt">AI Prompt</Label>
                                <Textarea 
                                    id="ai-prompt" 
                                    placeholder="e.g., 'Show a welcome message and highlight products on sale.'"
                                    value={config.prompt || ''}
                                    onChange={e => handleConfigChange('prompt', e.target.value)}
                                />
                            </div>
                        )}
                        {contentType === 'static_image' && (
                             <div className="space-y-2">
                                <Label htmlFor="image-upload">Image</Label>
                                <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} />
                            </div>
                        )}
                        {contentType === 'promotional_video' && (
                             <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="video-headline">Headline</Label>
                                    <Input id="video-headline" placeholder="e.g., 'Unmissable Summer Deals!'" value={config.videoHeadline || ''} onChange={e => handleConfigChange('videoHeadline', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="video-url">Video URL</Label>
                                    <Input id="video-url" placeholder="https://example.com/video.mp4" value={config.videoUrl || ''} onChange={e => handleConfigChange('videoUrl', e.target.value)} />
                                </div>
                            </div>
                        )}
                        {contentType === 'product_showcase' && (
                            <div className="space-y-2">
                                <Label htmlFor="product-sku">Product SKU</Label>
                                <Input id="product-sku" placeholder="Enter product SKU to showcase" value={config.productSku || ''} onChange={e => handleConfigChange('productSku', e.target.value)} />
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Button onClick={handleSave} size="lg">
                    <Save className="mr-2 h-4 w-4"/>
                    Save & Publish Configuration
                </Button>
            </div>

            <div>
                <LivePreview config={config} />
            </div>
        </div>

        <Separator />
        
        <Card className="w-full max-w-lg mx-auto text-center">
            <CardHeader>
            <CardTitle>Remote Config Demonstration</CardTitle>
            <CardDescription>
                This card demonstrates fetching live content from Firebase Remote Config.
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

        <Separator />

         <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Live Display Status</h2>
            <p className="text-muted-foreground max-w-3xl">
                Monitor the real-time status of all registered in-store display devices.
            </p>
        </div>
        
        <DisplayManager />
    </div>
  );
}
