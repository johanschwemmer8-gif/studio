
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Loader2, Image as ImageIcon, Trash2, Pencil, Copy, Send } from 'lucide-react';
import { getQrTemplates, type GetQrTemplatesInput } from '@/ai/flows/get-qr-templates';
import type { QrTemplate } from '@/lib/schemas/qr-templates';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


function BrandQrTemplateDesigner() {
    // This is a placeholder for the actual template designer UI.
    return (
        <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
            <p>Brand QR Template Designer component will go here.</p>
            <p className="text-sm">This will include controls for color, shape, logo, etc.</p>
        </div>
    );
}

function TemplatePreview({ template }: { template: QrTemplate }) {
    const { colorHex = '#000000', bgColorHex = '#FFFFFF', logoPath } = template.defaults || {};
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="w-24 h-24 rounded-md border-2 flex items-center justify-center cursor-pointer" style={{ backgroundColor: bgColorHex }}>
                        {logoPath ? (
                            <Image src={logoPath} alt={`${template.name} logo`} width={64} height={64} className="object-contain" />
                        ) : (
                             <div className="w-16 h-16 rounded-sm" style={{ backgroundColor: colorHex }}></div>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                     <p>Color: {colorHex}</p>
                     <p>Background: {bgColorHex}</p>
                     {logoPath && <p>Includes Logo</p>}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

function TemplateCard({ template }: { template: QrTemplate }) {
    const { toast } = useToast();
    
    const handleAction = (action: string) => {
        toast({
            title: `${action} Clicked`,
            description: `Action for "${template.name}" is not yet implemented.`,
        });
    };

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                <TemplatePreview template={template} />
            </CardContent>
            <CardFooter className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleAction('Apply')}>
                    <Send className="mr-2 h-3.5 w-3.5" /> Apply
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAction('Edit')}>
                    <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                </Button>
                 <Button variant="outline" size="sm" onClick={() => handleAction('Duplicate')}>
                    <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleAction('Delete')}>
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                </Button>
            </CardFooter>
        </Card>
    );
}


export default function BrandQrTemplateGallery() {
    const [templates, setTemplates] = useState<QrTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const input: GetQrTemplatesInput = { retailerId: 'simulated-retailer-id' };
                const result = await getQrTemplates(input);
                setTemplates(result);
            } catch (error: any) {
                console.error('Failed to fetch templates:', error);
                toast({
                    title: 'Error Fetching Templates',
                    description: error.message || 'Could not load QR templates.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, [toast]);
    
    const globalTemplates = templates.filter(t => t.retailerId === 'GLOBAL');
    const retailerTemplates = templates.filter(t => t.retailerId !== 'GLOBAL');

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2">Brand QR Templates</h2>
                    <p className="text-muted-foreground max-w-3xl">Design and manage reusable QR code styles for each of your brands.</p>
                </div>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2" />
                            Create New Template
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Create New Brand QR Template</DialogTitle>
                            <DialogDescription>
                                Design a new reusable template for your QR codes.
                            </DialogDescription>
                        </DialogHeader>
                        <BrandQrTemplateDesigner />
                    </DialogContent>
                </Dialog>
            </div>

            <Separator />

            {loading ? (
                <div className="text-center text-muted-foreground py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Loading templates...</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Retailer-specific templates */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4">My Brand Templates</h3>
                         {retailerTemplates.length > 0 ? (
                             <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {retailerTemplates.map(template => (
                                    <TemplateCard key={template.templateId} template={template} />
                                ))}
                            </div>
                         ) : (
                            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">You haven't created any brand templates yet.</p>
                                <p className="text-sm text-muted-foreground">Click "Create New Template" to get started.</p>
                            </div>
                         )}
                    </div>
                    
                    <Separator />
                    
                    {/* Global templates */}
                     <div>
                        <h3 className="text-xl font-semibold mb-4">Global Templates</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {globalTemplates.map(template => (
                                <TemplateCard key={template.templateId} template={template} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
