
'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Info,
  Upload,
  Square,
  Circle,
  Eye,
  RefreshCw,
  FileText,
  Palette,
  ChevronDown,
  Loader2,
  Download,
  AlertTriangle,
  FilePattern,
  Settings,
  Link,
  Type
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Papa from 'papaparse';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';


const styleSchema = z.object({
  format: z.enum(['svg', 'png', 'pdf']).default('svg'),
  sizePx: z.number().min(128).max(2048).default(512),
  errorCorrection: z.enum(['L', 'M', 'Q', 'H']).default('M'),
  dotShape: z.enum(['square', 'circle', 'rounded']).default('square'),
  eyeStyle: z.enum(['standard', 'rounded', 'leaf']).default('standard'),
  color1: z.string().default('#000000'),
  color2: z.string().default('#000000'),
  gradientAngle: z.number().min(0).max(360).default(0),
  useGradient: z.boolean().default(false),
  logo: z.any().optional(),
  logoUrl: z.string().optional(),
  margin: z.number().min(0).max(20).default(4),
});

const formSchema = z.object({
  campaignName: z.string().min(1, 'Campaign name is required'),
  isDynamic: z.boolean().default(true),
  namingScheme: z.string().min(1, 'Naming scheme prefix is required').default('qr-'),
  style: styleSchema,
  manualList: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type StyleValues = z.infer<typeof styleSchema>;

const LiveQrPreview = ({ style }: { style: StyleValues }) => {
    const { dotShape, eyeStyle, color1, color2, useGradient, gradientAngle, logoUrl } = style;

    return (
        <div className="relative w-full aspect-square rounded-lg bg-white p-4 border shadow-inner flex items-center justify-center">
            {/* This is a visual approximation. A real library would generate an actual SVG. */}
            <div className="w-5/6 h-5/6 relative">
                 <div
                    className="absolute w-full h-full"
                    style={{
                        background: useGradient ? `linear-gradient(${gradientAngle}deg, ${color1}, ${color2})` : color1,
                        WebkitMask: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cGF0aCBkPSJNMCAwIGg0MHY0MEgwVjB6TTUwIDAgeDQwdjQwSDUwVjB6TTAgNTAgaDQwdjQwSDBWNTB6TTk1IDYwIGgtNSB2NSBoNSB2NWgtNSB2NWgtNSB2NWgtNSB2NWgtNSB2NWgtNSB2NWgtNSB2NWgtNSB2NWgtNSB2NWgtNSB2NSBoLTUgdjVoLTUgdjVoLTUgdjVoLTUgdjVoLTUgdjVoLTUgdjVIMTB2NWgtNSB2NWgtNSB2NWgtNSB2NWgtNSB2NWgtNSB2NSBoLTUgdjVoLTUgdjVoLTUgdjVIMCB2LTQ1aDV2LTVoNXYtNWg1di01aDV2LTVoNXYtNWg1di01aDV2LTVoNXYtNWg1di01aDV2LTVoNXYtNWg1di01aDV2LTVoNXYtNWg1di01aDV2LTVoNXYtNWg1VjU1aDV2LTVoNXYtNWg1di01aDV2LTVoNXYtNWg1VjQ1aDV2LTVoNXYtNWg1VjMwSDcwVjI1aDVWMjBoNVYxNWg1VjEwaDVWNSIvPjwvc3ZnPg==") no-repeat center',
                        mask: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cGF0aCBkPSJNMCAwIGg0MHY0MEgwVjB6TTUwIDAgeDQwdjQwSDUwVjB6TTAgNTAgaDQwdjQwSDBWNTB6TTk1IDYwIGgtNSB2NSBoNSB2NWgtNSB2NWgtNSB2NWgtNSB2NWgtNSB2NWgtNSB2NWgtNSB2NWgtNSB2NWgtNSB2NSBoLTUgdjVoLTUgdjVoLTUgdjVoLTUgdjVoLTUgdjVoLTUgdjVIMTB2NWgtNSB2NWgtNSB2NWgtNSB2NWgtNSB2NWgtNSB2NSBoLTUgdjVoLTUgdjVoLTUgdjVIMCB2LTQ1aDV2LTVoNXYtNWg1di01aDV2LTVoNXYtNWg1di01aDV2LTVoNXYtNWg1di01aDV2LTVoNXYtNWg1di01aDV2LTVoNXYtNWg1di01aDV2LTVoNXYtNWg1VjU1aDV2LTVoNXYtNWg1di01aDV2LTVoNXYtNWg1VjQ1aDV2LTVoNXYtNWg1VjMwSDcwVjI1aDVWMjBoNVYxNWg1VjEwaDVWNSIvPjwvc3ZnPg==") no-repeat center'
                    }}
                ></div>

                {logoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Image src={logoUrl} alt="logo" width={64} height={64} className="bg-white p-1 rounded-md" />
                    </div>
                )}
            </div>
        </div>
    )
};

const CsvUploader = ({ onCsvDataChange }: { onCsvDataChange: (data: any[], headers: string[]) => void }) => {
    const [fileName, setFileName] = useState('');
    const { toast } = useToast();

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'text/csv') {
            toast({ title: 'Invalid File Type', description: 'Please upload a CSV file.', variant: 'destructive' });
            return;
        }

        setFileName(file.name);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                onCsvDataChange(results.data.slice(0, 5), results.meta.fields || []);
            }
        });
    };

    return (
        <div className="space-y-4">
            <Label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700">
                Upload CSV File
            </Label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                        <Label htmlFor="csv-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                            <span>Upload a file</span>
                            <Input id="csv-upload" name="csv-upload" type="file" className="sr-only" onChange={handleFileUpload} accept=".csv" />
                        </Label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">{fileName || 'CSV up to 10MB'}</p>
                </div>
            </div>
        </div>
    );
};

export default function BulkQRCodeGenerator() {
    const { toast } = useToast();
    const [csvData, setCsvData] = useState<any[]>([]);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>({
        destination_url: '',
        filename: '',
        ai_profile_id: ''
    });
    const [jobs, setJobs] = useState<{ id: string; name: string; count: number; status: string; progress: number; error: string; }[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            campaignName: '',
            isDynamic: true,
            namingScheme: 'qr-',
            style: {
                format: 'svg',
                sizePx: 512,
                errorCorrection: 'M',
                dotShape: 'square',
                eyeStyle: 'standard',
                color1: '#000000',
                color2: '#000000',
                gradientAngle: 0,
                useGradient: false,
                margin: 4,
            }
        },
    });

    const watchedStyle = form.watch('style');

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                form.setValue('style.logoUrl', reader.result as string);
                // Here you would also upload to Firebase Storage and save the URL
                console.log('Uploading logo to Firebase Storage...');
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleColumnMapChange = (field: string, csvHeader: string) => {
        setColumnMapping(prev => ({ ...prev, [field]: csvHeader }));
    };

    const onSubmit = (data: FormValues) => {
        console.log('Submitting form data:', data);
        console.log('Column Mapping:', columnMapping);
        
        const newJob = {
            id: `job-${Math.random().toString(36).substr(2, 9)}`,
            name: data.campaignName,
            count: data.manualList?.split('\n').filter(Boolean).length || csvData.length || 0,
            status: 'QUEUED',
            progress: 0,
            error: ''
        };
        setJobs(prev => [newJob, ...prev]);

        // Mock job processing
        setTimeout(() => {
            setJobs(prev => prev.map(j => j.id === newJob.id ? { ...j, status: 'PROCESSING', progress: 50 } : j));
        }, 2000);
        setTimeout(() => {
            setJobs(prev => prev.map(j => j.id === newJob.id ? { ...j, status: 'COMPLETED', progress: 100 } : j));
        }, 5000);
        
        toast({
            title: 'Batch Job Submitted',
            description: `Campaign "${data.campaignName}" has been queued for generation.`,
        });
    };

    return (
        <TooltipProvider>
            <div className="space-y-8 p-4 md:p-8">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight">Bulk QR Code Generator</h1>
                    <p className="text-muted-foreground">Create and manage large-scale QR code campaigns.</p>
                </header>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid lg:grid-cols-3 gap-8 items-start">
                        {/* Left/Main Column */}
                        <div className="lg:col-span-2 space-y-8">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Campaign Setup</CardTitle>
                                    <CardDescription>Define the basic parameters for your new QR batch.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                     <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="campaignName">Campaign Name</Label>
                                            <Input id="campaignName" {...form.register('campaignName')} placeholder="e.g., Summer Sale 2024" />
                                        </div>
                                        <div>
                                            <Label htmlFor="namingScheme">File Naming Prefix</Label>
                                            <Input id="namingScheme" {...form.register('namingScheme')} placeholder="qr-"/>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Controller name="isDynamic" control={form.control} render={({ field }) => (
                                            <Switch id="isDynamic" checked={field.value} onCheckedChange={field.onChange} />
                                        )} />
                                        <Label htmlFor="isDynamic">Dynamic QR Codes</Label>
                                         <Tooltip>
                                            <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground"/></TooltipTrigger>
                                            <TooltipContent><p>Dynamic QRs can be edited after creation. Static QRs cannot.</p></TooltipContent>
                                        </Tooltip>
                                    </div>
                                </CardContent>
                            </Card>

                            <Tabs defaultValue="manual" className="w-full">
                                <TabsList>
                                    <TabsTrigger value="manual"><Type className="mr-2"/> Manual Input</TabsTrigger>
                                    <TabsTrigger value="csv"><FileText className="mr-2"/> CSV Upload</TabsTrigger>
                                    <TabsTrigger value="pattern" disabled><FilePattern className="mr-2"/> Pattern Generator</TabsTrigger>
                                </TabsList>
                                <TabsContent value="manual">
                                    <Card>
                                        <CardHeader><CardTitle>Enter URLs</CardTitle><CardDescription>Enter one URL per line.</CardDescription></CardHeader>
                                        <CardContent>
                                            <Textarea {...form.register('manualList')} rows={10} placeholder="https://example.com/product/1&#10;https://example.com/product/2" />
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="csv">
                                    <Card>
                                         <CardHeader><CardTitle>Upload Data</CardTitle><CardDescription>Upload a CSV file and map the columns to the required fields.</CardDescription></CardHeader>
                                        <CardContent>
                                            <CsvUploader onCsvDataChange={(data, headers) => { setCsvData(data); setCsvHeaders(headers); }} />
                                            {csvData.length > 0 && (
                                                <div className="mt-6 space-y-4">
                                                    <h4 className="font-semibold">Column Mapping</h4>
                                                    <div className="grid md:grid-cols-3 gap-4 p-4 border rounded-md">
                                                        {(['destination_url', 'filename', 'ai_profile_id'] as const).map(field => (
                                                            <div key={field}>
                                                                <Label className="capitalize">{field.replace('_', ' ')}</Label>
                                                                <Select onValueChange={(value) => handleColumnMapChange(field, value)} value={columnMapping[field]}>
                                                                    <SelectTrigger><SelectValue placeholder="Select CSV column..."/></SelectTrigger>
                                                                    <SelectContent>
                                                                        {csvHeaders.map(header => <SelectItem key={header} value={header}>{header}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <h4 className="font-semibold">Data Preview (First 5 Rows)</h4>
                                                    <div className="overflow-x-auto border rounded-md">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>{csvHeaders.map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {csvData.map((row, i) => <TableRow key={i}>{csvHeaders.map(h => <TableCell key={h} className="text-xs truncate max-w-xs">{row[h]}</TableCell>)}</TableRow>)}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                        
                        {/* Right Column */}
                        <div className="space-y-8">
                             <Card>
                                <CardHeader><CardTitle>Style & Preview</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <LiveQrPreview style={watchedStyle} />
                                    <Accordion type="single" collapsible>
                                      <AccordionItem value="item-1">
                                        <AccordionTrigger><Settings className="mr-2"/>Styling Options</AccordionTrigger>
                                        <AccordionContent className="space-y-4 pt-4">
                                           {/* Style Controls Here */}
                                            <div><Label>Format</Label><Select name="style.format" onValueChange={v => form.setValue('style.format', v as any)} defaultValue={watchedStyle.format}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="svg">SVG</SelectItem><SelectItem value="png">PNG</SelectItem><SelectItem value="pdf">PDF</SelectItem></SelectContent></Select></div>
                                            <div><Label>Error Correction</Label><RadioGroup onValueChange={v => form.setValue('style.errorCorrection', v as any)} defaultValue={watchedStyle.errorCorrection} className="flex gap-2"><div><RadioGroupItem value="L" id="L"/><Label htmlFor="L">L</Label></div><div><RadioGroupItem value="M" id="M"/><Label htmlFor="M">M</Label></div><div><RadioGroupItem value="Q" id="Q"/><Label htmlFor="Q">Q</Label></div><div><RadioGroupItem value="H" id="H"/><Label htmlFor="H">H</Label></div></RadioGroup></div>
                                            <div><Label>Dot Shape</Label><RadioGroup onValueChange={v => form.setValue('style.dotShape', v as any)} defaultValue={watchedStyle.dotShape} className="flex gap-2"><div><RadioGroupItem value="square" id="ds_sq"/><Label htmlFor="ds_sq">Square</Label></div><div><RadioGroupItem value="circle" id="ds_ci"/><Label htmlFor="ds_ci">Circle</Label></div><div><RadioGroupItem value="rounded" id="ds_ro"/><Label htmlFor="ds_ro">Rounded</Label></div></RadioGroup></div>
                                            <div className="flex items-center space-x-2"><Controller name="style.useGradient" control={form.control} render={({ field }) => (<Switch id="useGradient" checked={field.value} onCheckedChange={field.onChange} />)} /><Label htmlFor="useGradient">Use Gradient</Label></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><Label>Color 1</Label><Input type="color" {...form.register('style.color1')} /></div>
                                                <div><Label>Color 2</Label><Input type="color" {...form.register('style.color2')} disabled={!watchedStyle.useGradient} /></div>
                                            </div>
                                            <div><Label>Gradient Angle</Label><Slider disabled={!watchedStyle.useGradient} defaultValue={[watchedStyle.gradientAngle]} max={360} step={1} onValueChange={([v]) => form.setValue('style.gradientAngle', v)}/></div>
                                            <div><Label>Logo</Label><Input type="file" accept="image/*" onChange={handleLogoUpload}/></div>
                                        </AccordionContent>
                                      </AccordionItem>
                                    </Accordion>
                                </CardContent>
                            </Card>
                             <Button type="submit" size="lg" className="w-full">
                                <RefreshCw className="mr-2"/>
                                Generate QR Codes
                            </Button>
                        </div>
                    </div>
                </form>

                 <Card>
                    <CardHeader>
                        <CardTitle>Generation Queue</CardTitle>
                        <CardDescription>Track the status of your bulk generation jobs.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {jobs.length === 0 ? <p className="text-center text-muted-foreground py-8">No jobs yet.</p> : jobs.map(job => (
                                <Card key={job.id} className="p-4">
                                    <div className="flex flex-wrap justify-between items-center gap-4">
                                        <div>
                                            <p className="font-semibold">{job.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{job.id}</p>
                                        </div>
                                        <div className="text-sm">{job.status} ({job.count} QRs)</div>
                                        <div className="w-full md:w-1/3">
                                            <Slider value={[job.progress]} disabled />
                                        </div>
                                        <div>
                                             <Button size="sm" disabled={job.status !== 'COMPLETED'}>
                                                <Download className="mr-2"/>
                                                Download ZIP
                                            </Button>
                                        </div>
                                    </div>
                                    {job.error && <p className="text-destructive-foreground bg-destructive p-2 rounded-md mt-2 text-xs">{job.error}</p>}
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
}
