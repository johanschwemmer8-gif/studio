'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fallback?: string;
  label?: string;
}

/**
 * Standardized Back Button for iNteract
 * Returns to previous history entry or uses fallback path if no history exists.
 */
export function BackButton({ 
  fallback = '/', 
  label = 'Back', 
  className,
  ...props 
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Check if we can go back in history
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      // Otherwise use the architectural fallback
      router.push(fallback);
    }
    
    // Call original onClick if provided
    if (props.onClick) props.onClick(e);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "-ml-4 mb-4 gap-2 text-muted-foreground hover:text-foreground",
        className
      )}
      onClick={handleBack}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
}
