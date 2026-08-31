
'use client';

import { cn } from '@/lib/utils';
import { ImageIcon, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmbeddedChat from './embedded-chat';

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
                <img
                    src={logoPreview}
                    alt="Landing Page Logo"
                    style={{
                        width: `${isThumbnail ? 40 : logoWidth}px`,
                        height: 'auto',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        display: 'inline-block',
                    }}
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
        <div className={cn(isThumbnail ? "h-12" : "h-48")}>
            <EmbeddedChat isThumbnail={isThumbnail} />
        </div>
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
        <div className="p-4 text-left flex-1 flex flex-col">
          {commonLogo({ ...props, isThumbnail })}
          <h2 className={cn("font-bold tracking-tighter mb-1", isThumbnail ? "text-sm" : "text-2xl")}>
              Product Name Here
          </h2>
          <p className={cn("mx-auto text-muted-foreground mb-4", isThumbnail ? "text-[8px] leading-tight" : "text-sm")}>
              A brief, compelling description of the product and what makes it special goes here.
          </p>
          {commonScanner(isThumbnail)}
           <div className={cn("mt-4 flex-1", isThumbnail ? "mt-2" : "")}>
              <EmbeddedChat isThumbnail={isThumbnail} />
          </div>
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
                <div className={cn(isThumbnail ? "h-12" : "h-48")}>
                    <EmbeddedChat isThumbnail={isThumbnail} />
                </div>
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
                     <div className={cn("w-full flex-1", isThumbnail ? "h-24" : "h-48")}>
                        <EmbeddedChat isThumbnail={isThumbnail} />
                    </div>
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
                <div className={cn("mt-4", isThumbnail ? "mt-2" : "")}>
                    <div className={cn(isThumbnail ? "h-12" : "h-48")}>
                        <EmbeddedChat isThumbnail={isThumbnail} />
                    </div>
                </div>
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
                 <div className={cn(isThumbnail ? "h-12" : "h-48")}>
                    <EmbeddedChat isThumbnail={isThumbnail} />
                </div>
            </div>
        </div>
    );
}

export function Template7({ isThumbnail, ...props }: TemplateProps) {
    return (
        <div className="flex flex-col h-full w-full">
            <div className={cn("relative w-full bg-slate-200 dark:bg-slate-700", isThumbnail ? "aspect-square" : "aspect-[4/3]")}>
                <ImageIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground/50"/>
            </div>
            <div className={cn("p-4 flex-1 flex flex-col justify-between", isThumbnail ? "p-2" : "")}>
                <div>
                    <h2 className={cn("font-bold tracking-tight mb-1", isThumbnail ? "text-sm" : "text-2xl")}>
                        Product Title
                    </h2>
                    <p className={cn("text-accent font-bold", isThumbnail ? "text-base" : "text-3xl")}>
                        R1,234.56
                    </p>
                </div>
                <div className={cn("mt-4", isThumbnail ? "mt-2" : "")}>
                    <div className={cn(isThumbnail ? "h-12" : "h-48")}>
                        <EmbeddedChat isThumbnail={isThumbnail} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function Template8({ isThumbnail, ...props }: TemplateProps) {
    return (
        <div className="flex flex-col h-full w-full p-4 space-y-4">
            {commonLogo({ ...props, isThumbnail })}
            <div className="flex-1 text-left space-y-2">
                 <h2 className={cn("font-bold tracking-tight text-primary", isThumbnail ? "text-sm" : "text-xl")}>
                    Minimalist & Clean
                </h2>
                 <p className={cn("text-muted-foreground", isThumbnail ? "text-[8px] leading-tight" : "text-sm")}>
                    Perfect for informational scans. Focus on text and clarity. Provides key details without distractions.
                </p>
            </div>
            <div className={cn("pt-4 border-t", isThumbnail ? "pt-2" : "")}>
                <div className={cn(isThumbnail ? "h-24" : "h-48")}>
                    <EmbeddedChat isThumbnail={isThumbnail} />
                </div>
            </div>
        </div>
    );
}

export function Template9({ isThumbnail, ...props }: TemplateProps) {
    return (
        <div className="relative flex flex-col h-full w-full justify-end">
            <div className="absolute inset-0 bg-slate-400 dark:bg-slate-800">
                <ImageIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 text-muted-foreground/20"/>
            </div>
            <div className={cn("relative z-10 p-4 space-y-2 text-primary-foreground bg-gradient-to-t from-black/80 via-black/50 to-transparent", isThumbnail ? "p-2" : "")}>
                <h2 className={cn("font-bold tracking-tighter", isThumbnail ? "text-base" : "text-2xl")}>
                    Action-Oriented
                </h2>
                <p className={cn("opacity-80", isThumbnail ? "text-[8px] leading-tight" : "text-sm")}>
                    This layout drives users towards a single, clear call-to-action.
                </p>
                <div className={cn("mt-4", isThumbnail ? "mt-2" : "")}>
                    <div className={cn(isThumbnail ? "h-12" : "h-48")}>
                        <EmbeddedChat isThumbnail={isThumbnail} />
                    </div>
                </div>
            </div>
        </div>
    );
}
