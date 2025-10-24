
'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ImageIcon, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type TemplateProps = {
    logoPreview: string | null;
    logoWidth: number;
    logoAlign: string;
    logoPadding: number;
    isThumbnail?: boolean;
};

const commonScanner = (isThumbnail?: boolean) => (
    <div className="max-w-xs mx-auto">
        <div className={cn(
            "w-full aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center border",
            isThumbnail ? "w-20 h-20" : ""
        )}>
            <QrCode className={cn("text-muted-foreground/50", isThumbnail ? "h-8 w-8" : "h-16 w-16")} />
        </div>
    </div>
);

const commonLogo = ({ logoPreview, logoWidth, logoAlign, logoPadding, isThumbnail }: TemplateProps) => {
    const logoContainerClass = cn('w-full px-4 text-center', {
      'text-left': logoAlign === 'flex-start',
      'text-center': logoAlign === 'center',
      'text-right': logoAlign === 'flex-end',
    });
    
    const headerStyle: React.CSSProperties = {
      paddingTop: isThumbnail ? '8px' : `${logoPadding}px`,
      paddingBottom: isThumbnail ? '8px' : `${logoPadding}px`,
    };

    return (
        <header className={logoContainerClass} style={headerStyle}>
             {logoPreview ? (
                <Image 
                    src={logoPreview}
                    alt="Landing Page Logo"
                    width={isThumbnail ? 40 : logoWidth}
                    height={isThumbnail ? (40 / (128/50)) : (logoWidth / (128/50))}
                    style={{ width: `${isThumbnail ? 40 : logoWidth}px`, display: 'inline-block' }}
                />
            ) : <div className={cn("h-4 bg-muted rounded w-20 inline-block", isThumbnail ? "w-10 h-3" : "")} />}
        </header>
    );
};

export function Template1({ isThumbnail, ...props }: TemplateProps) {
  return (
    <div className="flex flex-col h-full w-full">
      {commonLogo({ ...props, isThumbnail })}
      <div className="flex-1 p-4 text-center">
        <h2 className={cn("font-bold tracking-tighter mb-2", isThumbnail ? "text-sm" : "text-2xl")}>
            Shop Smarter, In-Store.
        </h2>
        <p className={cn("max-w-xl mx-auto text-muted-foreground mb-4", isThumbnail ? "text-[8px] leading-tight" : "text-sm")}>
            Scan any product's QR code to get instant details, reviews, and
            AI-powered recommendations right on your phone.
        </p>
        {commonScanner(isThumbnail)}
      </div>
      <div className={cn("p-4", isThumbnail ? "p-2" : "")}>
        <Button size={isThumbnail ? "sm" : "lg"} className={cn("w-full", isThumbnail ? "text-[8px] h-6" : "")}>Simulated Button</Button>
      </div>
    </div>
  );
}

export function Template2({ isThumbnail, ...props }: TemplateProps) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="relative w-full aspect-video bg-slate-200 dark:bg-slate-700">
             <ImageIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground/50"/>
        </div>
        <div className="p-4 text-left">
          {commonLogo({ ...props, isThumbnail })}
          <h2 className={cn("font-bold tracking-tighter mb-1", isThumbnail ? "text-sm" : "text-2xl")}>
              Product Name Here
          </h2>
          <p className={cn("mx-auto text-muted-foreground mb-4", isThumbnail ? "text-[8px] leading-tight" : "text-sm")}>
              A brief, compelling description of the product and what makes it special goes here.
          </p>
          {commonScanner(isThumbnail)}
        </div>
      </div>
    );
}

export function Template3({ isThumbnail, ...props }: TemplateProps) {
    return (
        <div className="bg-gray-900 text-gray-100 flex flex-col h-full w-full">
            {commonLogo({ ...props, isThumbnail })}
             <div className="flex-1 p-4 text-center">
                <h2 className={cn("font-bold tracking-tighter mb-2", isThumbnail ? "text-sm" : "text-2xl")}>
                    Experience the Dark Side
                </h2>
                <p className={cn("max-w-xl mx-auto text-gray-400 mb-4", isThumbnail ? "text-[8px] leading-tight" : "text-sm")}>
                    A modern, sleek interface perfect for premium brands.
                </p>
                {commonScanner(isThumbnail)}
            </div>
             <div className={cn("p-4", isThumbnail ? "p-2" : "")}>
                <Button size={isThumbnail ? "sm" : "lg"} className={cn("w-full bg-primary text-primary-foreground", isThumbnail ? "text-[8px] h-6" : "")}>Explore Now</Button>
            </div>
        </div>
    );
}

export function Template4({ isThumbnail, ...props }: TemplateProps) {
    return (
         <div className="flex flex-col h-full w-full p-4 space-y-4">
            {commonLogo({ ...props, isThumbnail })}
            <Card className={cn(isThumbnail ? "p-2" : "p-4")}>
                <h2 className={cn("font-bold tracking-tighter mb-1", isThumbnail ? "text-sm" : "text-xl")}>
                    Discover More
                </h2>
                 <p className={cn("text-muted-foreground", isThumbnail ? "text-[8px] leading-tight" : "text-sm")}>
                    Scan the code to unlock exclusive content.
                </p>
            </Card>
             <Card className={cn("flex-1", isThumbnail ? "p-2" : "p-4")}>
                <CardContent className={cn("p-0 h-full flex flex-col justify-center items-center", isThumbnail ? "gap-1" : "gap-2")}>
                    {commonScanner(isThumbnail)}
                    <p className={cn("text-muted-foreground", isThumbnail ? "text-[8px]" : "text-xs")}>Point your camera here</p>
                </CardContent>
            </Card>
        </div>
    );
}

export function Template5({ isThumbnail, ...props }: TemplateProps) {
    return (
        <div className="bg-gradient-to-br from-primary to-accent text-primary-foreground flex flex-col h-full w-full">
            <div className="flex-1 p-4 text-center flex flex-col justify-center">
                 <h2 className={cn("font-bold tracking-tighter mb-2", isThumbnail ? "text-sm" : "text-3xl")}>
                    Vibrant & Engaging
                </h2>
                <p className={cn("max-w-xl mx-auto opacity-80 mb-4", isThumbnail ? "text-[8px] leading-tight" : "text-sm")}>
                    Capture attention with a colorful and dynamic layout.
                </p>
                {commonScanner(isThumbnail)}
            </div>
        </div>
    );
}

export function Template6({ isThumbnail, ...props }: TemplateProps) {
    return (
        <div className="flex flex-col h-full w-full border border-gray-200 dark:border-gray-800">
             <header className="p-4 border-b">
                {commonLogo({ ...props, isThumbnail })}
            </header>
            <div className="flex-1 p-6 text-left">
                <h2 className={cn("font-bold tracking-tight mb-2 text-primary", isThumbnail ? "text-sm" : "text-2xl")}>
                    Your Corporate Heading
                </h2>
                <p className={cn("text-muted-foreground mb-6", isThumbnail ? "text-[8px] leading-tight" : "text-base")}>
                    A clean, professional layout for a trustworthy brand experience.
                </p>
                {commonScanner(isThumbnail)}
            </div>
            <div className={cn("p-4 border-t", isThumbnail ? "p-2" : "")}>
                <Button variant="outline" size={isThumbnail ? "sm" : "lg"} className={cn("w-full", isThumbnail ? "text-[8px] h-6" : "")}>Learn More</Button>
            </div>
        </div>
    );
}
