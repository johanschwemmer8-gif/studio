
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, Timestamp, doc, deleteDoc, updateDoc, where } from 'firebase/firestore';
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
import { useAuth } from '@/context/auth-context';

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
            <CardTitle>Live Preview</CardTitle>
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
                        <h3 className="text-xl font-bold">AI Powered Display</h3>
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
  const { user } = useAuth();
  const [contentType, setContentType] = useState<ContentType>('dynamic_ai_prompt');
  const [config, setConfig] = useState<any>({type: 'dynamic_ai_prompt', prompt: 'Highlight today\'s best deals.'});
  const [configName, setConfigName] = useState('');
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  
  const [inStoreConfigs, setInStoreConfigs] = useState<InStoreConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  const retailerId = user?.retailerId || 'unknown';

  useEffect(() => {
    if (!db || retailerId === 'unknown') {
        setLoadingConfigs(false);
        return;
    }
    const q = query(
        collection(db, 'inStoreConfigs'), 
        where('retailerId', '==', retailerId),
        orderBy('lastUpdated', 'desc')
    );
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
  }, [toast, retailerId]);


  const handleContentTypeChange = (value: ContentType) => {
    setContentType(value);
    setConfig({ type: value }); 
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
     event.preventDefault();
     if (!db || retailerId === 'unknown') {
        toast({ title: 'Error', description: 'Handshake with identity layer failed.', variant: 'destructive'});
        return;
    }
    if (!configName.trim()) {
        toast({ title: 'Error', description: 'Configuration Name is required.', variant: 'destructive'});
        return;
    }

    setIsSaving(true);
    try {
        await addDoc(collection(db, 'inStoreConfigs'), {
            retailerId: retailerId,
            configId: `config_${Date.now()}`,
            configName: configName,
            contentSlot: config,
            isActive: false, 
            lastUpdated: serverTimestamp()
        });
        toast({
            title: "Configuration Saved!",
            description: `"${configName}" has been saved to the cloud.`,
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

  const handleDeleteConfig = async (configId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "inStoreConfigs", configId));
      toast({ title: "Success", description: "Configuration deleted."});
    } catch (error) {
      toast({ title: "Error", description: "Could not delete configuration.", variant: "destructive"});
    }
  };

  const handleToggleActive = async (configId: string, currentStatus: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "inStoreConfigs", configId), { isActive: !currentStatus });
      toast({ title: "Success", description: `Configuration ${!currentStatus ? 'activated' : 'deactivated'}.`});
    } catch (error) {
       toast({ title: "Error", description: "Could not update configuration status.", variant: "destructive"});
    }
  };


  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">In-Store Experience</h2>
            <p className="text-muted-foreground max-w-3xl text-sm">
                Manage the content and intelligence displayed on your in-store digital screens.
            </p>
        </div>

        <Card className="border-primary/10 shadow-lg">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start border-b bg-muted/30">
                <div>
                    <CardTitle className="text-lg">Content Configurations</CardTitle>
                    <CardDescription className="text-xs">Library of content and AI prompts for your store network.</CardDescription>
                </div>
                <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                    <DialogTrigger asChild>
                         <Button className="mt-4 sm:mt-0 font-bold uppercase text-[10px] tracking-widest gap-2">
                            <PlusCircle className="h-4 w-4"/> New Configuration
                        </Button>
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
                                        <CardTitle className="text-base">Identity</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <Label htmlFor="configName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Configuration Name</Label>
                                            <Input 
                                                id="configName"
                                                placeholder="e.g., Summer Sale Welcome"
                                                value={configName}
                                                onChange={e => setConfigName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Intelligence & Content</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="content-type" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</Label>
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
                                                <Label htmlFor="ai-prompt" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AI Prompt Instructions</Label>
                                                <Textarea id="ai-prompt" placeholder="e.g., 'Show a welcome message and highlight products on sale.'" value={config.prompt || ''} onChange={e => handleConfigChange('prompt', e.target.value)} />
                                            </div>
                                        )}
                                        {contentType === 'static_image' && (
                                             <div className="space-y-2">
                                                <Label htmlFor="image-upload" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Image URL</Label>
                                                <Input id="image-upload" type="text" placeholder="https://..." onChange={e => handleConfigChange('imageUrl', e.target.value)} />
                                            </div>
                                        )}
                                        {contentType === 'promotional_video' && (
                                             <div className="space-y-4">
                                                <div className="space-y-2"><Label htmlFor="video-headline" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Headline</Label><Input id="video-headline" value={config.videoHeadline || ''} onChange={e => handleConfigChange('videoHeadline', e.target.value)} /></div>
                                                <div className="space-y-2"><Label htmlFor="video-url" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Video URL</Label><Input id="video-url" value={config.videoUrl || ''} onChange={e => handleConfigChange('videoUrl', e.target.value)} /></div>
                                            </div>
                                        )}
                                        {contentType === 'product_showcase' && (
                                            <div className="space-y-2"><Label htmlFor="product-sku" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product Barcode/SKU</Label><Input id="product-sku" value={config.productSku || ''} onChange={e => handleConfigChange('productSku', e.target.value)} /></div>
                                        )}
                                        {contentType === 'dynamic_content' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="dynamic-type" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source</Label>
                                                <Select onValueChange={(value) => handleConfigChange('dynamicType', value)} value={config.dynamicType}>
                                                    <SelectTrigger id="dynamic-type"><SelectValue placeholder="Select source..." /></SelectTrigger>
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
                            <DialogFooter className="col-span-full border-t p-6">
                                <Button type="submit" size="lg" disabled={isSaving} className="w-full font-black uppercase text-xs tracking-widest gap-2">
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                                    Save Configuration
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="p-0">
                 <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="text-[10px] font-black uppercase tracking-widest">
                            <TableHead className="px-6">Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right px-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingConfigs ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
                        ) : inStoreConfigs.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic text-xs">No configurations created.</TableCell></TableRow>
                        ) : (
                            inStoreConfigs.map(cfg => (
                                <TableRow key={cfg.id} className="group transition-colors">
                                    <TableCell className="font-bold px-6">{cfg.configName}</TableCell>
                                    <TableCell className="capitalize text-[10px] font-bold text-muted-foreground uppercase">{cfg.contentSlot?.type?.replace(/_/g, ' ')}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{cfg.lastUpdated ? new Date(cfg.lastUpdated.toDate()).toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Button 
                                            size="sm" 
                                            variant={cfg.isActive ? "secondary" : "outline"}
                                            className="text-[9px] font-black uppercase tracking-widest h-7"
                                            onClick={() => handleToggleActive(cfg.id, cfg.isActive || false)}
                                        >
                                            {cfg.isActive ? "Active" : "Inactive"}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteConfig(cfg.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Separator />
        
        <div>
            <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">Live Display Fleet</h2>
            <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                Monitor real-time health and heartbeat logs for your physical in-store hardware.
            </p>
        </div>
        
        <DisplayManager />
    </div>
  );
}
