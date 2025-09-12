
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { Save, Sparkles, Tv, Loader2, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import DisplayManager from '@/components/dashboard/display-manager';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type ContentType = 'static_image' | 'dynamic_ai_prompt' | 'promotional_video' | 'product_showcase' | 'dynamic_content';

type InStoreConfig = {
    id: string;
    configName: string;
    contentSlot: any;
    lastUpdated: Timestamp;
};

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
                {config.type === 'dynamic_content' && (
                    <div className="space-y-4">
                        <Sparkles className="h-12 w-12 mx-auto text-accent" />
                        <h3 className="text-xl font-bold">Dynamic Content</h3>
                        <p className="text-sm text-muted-foreground capitalize">Displaying: {config.dynamicType?.replace(/_/g, ' ')}</p>
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
  const [configName, setConfigName] = useState('');
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  
  const [inStoreConfigs, setInStoreConfigs] = useState<InStoreConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  useEffect(() => {
    if (!db) {
        setLoadingConfigs(false);
        return;
    }
    const q = query(collection(db, 'inStoreConfigs'), orderBy('lastUpdated', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const configsData: InStoreConfig[] = [];
        snapshot.forEach(doc => {
            configsData.push({ id: doc.id, ...doc.data() } as InStoreConfig);
        });
        setInStoreConfigs(configsData);
        setLoadingConfigs(false);
    }, (error) => {
        console.error("Error fetching configs: ", error);
        toast({ title: 'Error', description: 'Could not fetch configurations.', variant: 'destructive'});
        setLoadingConfigs(false);
    });
    return () => unsubscribe();
  }, [toast]);

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
  
  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
     event.preventDefault();
     if (!db) {
        toast({ title: 'Error', description: 'Firestore is not initialized.', variant: 'destructive'});
        return;
    }
    if (!configName.trim()) {
        toast({ title: 'Error', description: 'Configuration Name is required.', variant: 'destructive'});
        return;
    }

    setIsSaving(true);
    try {
        await addDoc(collection(db, 'inStoreConfigs'), {
            retailerId: 'ret_123xyz',
            configId: `config_${Date.now()}`,
            configName: configName,
            contentSlot: config,
            isActive: false, 
            lastUpdated: serverTimestamp()
        });
        toast({
            title: "Configuration Saved!",
            description: `"${configName}" has been saved.`,
        });
        setIsConfigModalOpen(false);
        setConfigName('');
        setConfig({type: 'dynamic_ai_prompt', prompt: 'Highlight today\'s best deals.'});
    } catch (error) {
        console.error("Error saving config: ", error);
        toast({ title: 'Error', description: 'Failed to save configuration.', variant: 'destructive'});
    } finally {
        setIsSaving(false);
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

        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle>Content Configurations</CardTitle>
                    <CardDescription>Manage the library of content to be shown on your displays.</CardDescription>
                </div>
                <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                    <DialogTrigger asChild>
                         <Button><PlusCircle className="mr-2"/> Create New Configuration</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl grid-rows-[auto,1fr] p-0 max-h-[90vh]">
                         <DialogHeader className="p-6 pb-0">
                            <DialogTitle>Create New Content Configuration</DialogTitle>
                            <DialogDescription>Define the content and settings for a new display configuration.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="grid md:grid-cols-3 md:gap-8 overflow-y-auto p-6">
                            <div className="md:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Configuration Details</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <Label htmlFor="configName" className="font-semibold">Configuration Name</Label>
                                            <Input 
                                                id="configName"
                                                placeholder="e.g., 'Summer Sale Welcome Screen'"
                                                value={configName}
                                                onChange={e => setConfigName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Content Setup</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="content-type">Content Type</Label>
                                            <Select onValueChange={handleContentTypeChange} value={contentType}>
                                                <SelectTrigger id="content-type"><SelectValue placeholder="Select a content type" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="dynamic_ai_prompt">Dynamic AI Prompt</SelectItem>
                                                    <SelectItem value="static_image">Static Image</SelectItem>
                                                    <SelectItem value="promotional_video">Promotional Video</SelectItem>
                                                    <SelectItem value="product_showcase">Product Showcase</SelectItem>
                                                    <SelectItem value="dynamic_content">Dynamic Content</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        {contentType === 'dynamic_ai_prompt' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="ai-prompt">AI Prompt</Label>
                                                <Textarea id="ai-prompt" placeholder="e.g., 'Show a welcome message and highlight products on sale.'" value={config.prompt || ''} onChange={e => handleConfigChange('prompt', e.target.value)} />
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
                                                <div className="space-y-2"><Label htmlFor="video-headline">Headline</Label><Input id="video-headline" placeholder="e.g., 'Unmissable Summer Deals!'" value={config.videoHeadline || ''} onChange={e => handleConfigChange('videoHeadline', e.target.value)} /></div>
                                                <div className="space-y-2"><Label htmlFor="video-url">Video URL</Label><Input id="video-url" placeholder="https://example.com/video.mp4" value={config.videoUrl || ''} onChange={e => handleConfigChange('videoUrl', e.target.value)} /></div>
                                            </div>
                                        )}
                                        {contentType === 'product_showcase' && (
                                            <div className="space-y-2"><Label htmlFor="product-sku">Product SKU</Label><Input id="product-sku" placeholder="Enter product SKU to showcase" value={config.productSku || ''} onChange={e => handleConfigChange('productSku', e.target.value)} /></div>
                                        )}
                                        {contentType === 'dynamic_content' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="dynamic-type">Dynamic Content Type</Label>
                                                <Select onValueChange={(value) => handleConfigChange('dynamicType', value)} value={config.dynamicType}>
                                                    <SelectTrigger id="dynamic-type"><SelectValue placeholder="Select a dynamic type" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="top_selling_products">Top Selling Products</SelectItem>
                                                        <SelectItem value="low_inventory_items">Low Inventory Items</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-1">
                                <LivePreview config={config} />
                            </div>
                            <DialogFooter className="col-span-full">
                                <Button type="submit" size="lg" disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    <Save className="mr-2 h-4 w-4"/>
                                    Save Configuration
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Configuration Name</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingConfigs ? (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                        ) : inStoreConfigs.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No configurations created yet.</TableCell></TableRow>
                        ) : (
                            inStoreConfigs.map(cfg => (
                                <TableRow key={cfg.id}>
                                    <TableCell className="font-medium">{cfg.configName}</TableCell>
                                    <TableCell>{cfg.lastUpdated ? new Date(cfg.lastUpdated.toDate()).toLocaleString() : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

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

    