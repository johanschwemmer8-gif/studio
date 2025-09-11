
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import QrCampaignDashboard from '@/components/dashboard/qr-campaign-dashboard';
import { submitBulkQrRequest } from '@/ai/flows/submit-bulk-qr-request';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const qrOptionsSchema = z.object({
    colorHex: z.string().optional(),
    bgColorHex: z.string().optional(),
    logoPath: z.string().url().optional(),
    errorCorrection: z.enum(['L', 'M', 'Q', 'H']).default('M'),
});

const formSchema = z.object({
    campaignId: z.string().min(1, "Campaign ID is required."),
    count: z.number().min(1).max(500, "Count must be between 1 and 500."),
    baseRedirect: z.string().url("Must be a valid HTTPS URL.").refine(s => s.startsWith('https://'), "Base redirect URL must be HTTPS."),
    options: qrOptionsSchema.optional(),
});


export default function QrManagementPage() {
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            campaignId: `campaign-${Math.random().toString(36).substring(2, 8)}`,
            count: 10,
            baseRedirect: 'https://example.com/product',
            options: {
                colorHex: '#000000',
                bgColorHex: '#FFFFFF',
                errorCorrection: 'M'
            }
        },
    });

    const handleSubmitRequest = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
            const result = await submitBulkQrRequest({
                ...values,
                retailerId: 'simulated-retailer-id',
            });
            toast({
                title: "Request Submitted",
                description: `Bulk QR request for ${values.count} codes has been queued with ID: ${result.requestId}`,
            });
            setIsDialogOpen(false);
            form.reset();
        } catch (error: any) {
            console.error("Failed to submit request:", error);
            toast({
                title: "Submission Failed",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2">QR Code Management</h2>
                    <p className="text-muted-foreground max-w-3xl">Create, monitor, and download bulk QR code campaigns.</p>
                </div>
                 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                         <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Bulk Request
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>New Bulk QR Code Request</DialogTitle>
                            <DialogDescription>
                                Configure and submit a job to generate multiple QR codes.
                            </DialogDescription>
                        </DialogHeader>
                         <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmitRequest)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                                <FormField
                                    control={form.control}
                                    name="campaignId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Campaign ID</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="count"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Number of Codes</FormLabel>
                                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="baseRedirect"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Base Redirect URL</FormLabel>
                                            <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                     <FormField
                                        control={form.control}
                                        name="options.colorHex"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>QR Color</FormLabel>
                                                <FormControl><Input type="color" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="options.bgColorHex"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Background</FormLabel>
                                                <FormControl><Input type="color" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="options.errorCorrection"
                                    render={({ field }) => (
                                         <FormItem>
                                            <FormLabel>Error Correction</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select level" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="L">Low (L)</SelectItem>
                                                    <SelectItem value="M">Medium (M)</SelectItem>
                                                    <SelectItem value="Q">Quartile (Q)</SelectItem>
                                                    <SelectItem value="H">High (H)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <DialogFooter>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? "Submitting..." : "Submit Request"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Separator />
            
            <QrCampaignDashboard />

        </div>
    );
}
