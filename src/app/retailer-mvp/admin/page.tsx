
'use client';

import BrandSettingsForm from "@/components/dashboard/brand-settings-form";
import BrandManagementForm from "@/components/dashboard/brand-management-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import UserManagement from "@/components/dashboard/user-management";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Slider } from '@/components/ui/slider';
import { Save, Image as ImageIcon } from 'lucide-react';

export default function RetailerAdminPage() {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoWidth, setLogoWidth] = useState(128);
    const { toast } = useToast();

    useEffect(() => {
        const savedLogo = localStorage.getItem('retailer-mvp-logo');
        if (savedLogo) {
            setLogoPreview(savedLogo);
        }
        const savedWidth = localStorage.getItem('retailer-mvp-logo-width');
        if (savedWidth) {
            setLogoWidth(Number(savedWidth));
        }
    }, []);

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveLogo = () => {
        if (logoPreview) {
            localStorage.setItem('retailer-mvp-logo', logoPreview);
            localStorage.setItem('retailer-mvp-logo-width', String(logoWidth));
            window.dispatchEvent(new CustomEvent('logoUpdated'));
            toast({
                title: "Logo Saved",
                description: "Your new logo and size settings have been saved."
            });
        } else {
            localStorage.removeItem('retailer-mvp-logo');
            localStorage.removeItem('retailer-mvp-logo-width');
            window.dispatchEvent(new CustomEvent('logoUpdated'));
            toast({
                title: "Logo Removed",
                description: "The logo has been removed."
            });
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                    Retailer Admin Panel
                </h2>
                <p className="text-muted-foreground max-w-3xl">
                    Manage users, brand identity, and settings specific to your organization.
                </p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>MVP Logo Editor</CardTitle>
                    <CardDescription>Manage the main logo for the MVP dashboard sidebar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label htmlFor="logo-upload-mvp">Platform Logo</Label>
                        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2 p-4 border rounded-lg">
                            <div className="flex-shrink-0 w-48 h-20 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                                {logoPreview ? (
                                    <Image 
                                        src={logoPreview} 
                                        alt="Logo Preview" 
                                        width={logoWidth} 
                                        height={logoWidth / (128/50)}
                                        className="h-auto"
                                        style={{ width: `${logoWidth}px` }}
                                    />
                                ) : (
                                    <div className="text-xs text-muted-foreground flex flex-col items-center gap-1">
                                        <ImageIcon className="h-6 w-6" />
                                        <span>Logo Preview</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 w-full space-y-4">
                                <Input id="logo-upload-mvp" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoUpload} />
                                <div>
                                    <Label htmlFor="logo-size-mvp">Logo Width: {logoWidth}px</Label>
                                    <Slider
                                        id="logo-size-mvp"
                                        min={40}
                                        max={240}
                                        step={2}
                                        value={[logoWidth]}
                                        onValueChange={(value) => setLogoWidth(value[0])}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Upload a .png, .jpg, or .svg file. Max size: 1MB.</p>
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleSaveLogo}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Logo Settings
                    </Button>
                </CardContent>
            </Card>

            <Separator />
            <Card>
                <CardHeader>
                    <CardTitle>Global Brand Configuration</CardTitle>
                    <CardDescription>
                        Customize the general look and feel of your dashboard, including a default logo and brand colors. This will be used if a specific brand does not have its own styling.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BrandSettingsForm />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Brand Management</CardTitle>
                    <CardDescription>
                       Define your organization's brands, their specific branding (logo, colors), and the stores within them.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BrandManagementForm />
                </CardContent>
            </Card>
            <UserManagement />
        </div>
    );
}
