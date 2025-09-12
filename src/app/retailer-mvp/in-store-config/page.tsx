
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Save, Upload, Sparkles, Tv } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

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
                    <Image src={config.imageUrl} alt="Preview" layout="fill" objectFit="contain" />
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


export default function InStoreConfigPage() {
    const [contentType, setContentType] = useState<ContentType>('dynamic_ai_prompt');
    const [config, setConfig] = useState<any>({type: 'dynamic_ai_prompt', prompt: 'Highlight today\'s best deals.'});
    const { toast } = useToast();

    const handleContentTypeChange = (value: ContentType) => {
        setContentType(value);
        // Reset config when type changes
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
    
    const handleSave = () => {
        console.log("Saving configuration:", config);
        // In a real app, this would call a Firebase function to update Remote Config
        toast({
            title: "Configuration Saved!",
            description: "The in-store display content has been updated.",
        });
    };

  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">In-Store Experience Configuration</h2>
            <p className="text-muted-foreground max-w-3xl">
                Manage the content displayed on your in-store digital screens using Firebase Remote Config.
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
    </div>
  );
}
