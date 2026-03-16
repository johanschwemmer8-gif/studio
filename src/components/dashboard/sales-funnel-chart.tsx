
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QrCode, MousePointerClick, Tag, ShoppingCart, ChevronDown } from "lucide-react";
import { cn } from '@/lib/utils';

type SalesFunnelChartProps = {
  data: {
    scans: number;
    interactions: number;
    conversions: number;
    sales: number;
  };
};

const FunnelStage = ({
  icon,
  label,
  value,
  color,
  width,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  width: string;
}) => {
  // We use inline styles here for dynamic properties like color and width
  // and Tailwind classes for static properties.
  const stageStyle: React.CSSProperties = {
    backgroundColor: color,
    clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)',
    width: width,
  };

  const bottomEdgeStyle: React.CSSProperties = {
    backgroundColor: color,
    filter: 'brightness(0.7)',
    height: '0.75rem', // Creates the 3D thickness
    transform: 'translateY(100%) perspective(1px) rotateX(-1deg)', // Slight perspective
    clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)',
  };

  return (
    <div className="relative" style={{ width }}>
      <div
        className="relative h-16 flex items-center justify-between px-6 text-white shadow-lg"
        style={stageStyle}
      >
        <div className="flex items-center gap-3 z-10">
          {icon}
          <span className="font-semibold text-lg">{label}</span>
        </div>
        <span className="font-bold text-xl z-10">{value.toLocaleString()}</span>

        {/* 3D effect bottom edge */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={bottomEdgeStyle}
        ></div>
      </div>
    </div>
  );
};


export default function SalesFunnelChart({ data }: SalesFunnelChartProps) {
  const { scans, interactions, conversions, sales } = data;
  
  const stages = [
    { 
      label: 'Scans', 
      value: scans, 
      icon: <QrCode className="h-6 w-6"/>, 
      color: "hsl(var(--chart-1))",
      width: '100%',
      conversionRate: scans > 0 ? (interactions / scans) * 100 : 0,
    },
    { 
      label: 'Interactions', 
      value: interactions, 
      icon: <MousePointerClick className="h-6 w-6"/>, 
      color: "hsl(var(--primary))",
      width: '88%',
      conversionRate: interactions > 0 ? (conversions / interactions) * 100 : 0,
    },
    { 
      label: 'Conversions', 
      value: conversions, 
      icon: <Tag className="h-6 w-6"/>, 
      color: "hsl(var(--chart-4))",
      width: '76%',
      conversionRate: conversions > 0 ? (sales / conversions) * 100 : 0,
    },
    { 
      label: 'Sales', 
      value: sales, 
      icon: <ShoppingCart className="h-6 w-6"/>, 
      color: "hsl(var(--chart-2))",
      width: '64%',
      conversionRate: null,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Journey Funnel</CardTitle>
        <CardDescription>From initial scan to final sale.</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center items-center py-6 min-h-[440px]">
         <div className="space-y-8 w-full max-w-xs flex flex-col items-center">
            {stages.map((stage, index) => (
              <div key={stage.label} className="w-full flex flex-col items-center">
                <FunnelStage {...stage} />
                {stage.conversionRate !== null && index < stages.length - 1 && (
                  <div className="flex flex-col items-center mt-2 text-muted-foreground">
                    <ChevronDown className="h-5 w-5" />
                    <span className="text-xs font-semibold">{stage.conversionRate.toFixed(1)}% to next</span>
                  </div>
                )}
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
