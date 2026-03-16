
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QrCode, MousePointerClick, Tag, ShoppingCart, ChevronDown } from "lucide-react";

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
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) => (
  <Card className="w-full max-w-xs shadow-md hover:shadow-lg transition-shadow">
    <CardContent className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {icon}
        <span className="font-semibold text-lg">{label}</span>
      </div>
      <span className="font-bold text-xl text-primary">{value.toLocaleString()}</span>
    </CardContent>
  </Card>
);


export default function SalesFunnelChart({ data }: SalesFunnelChartProps) {
  const { scans, interactions, conversions, sales } = data;
  
  const stages = [
    { 
      label: 'Scans', 
      value: scans, 
      icon: <QrCode className="h-8 w-8 text-muted-foreground"/>, 
      conversionRate: scans > 0 ? (interactions / scans) * 100 : 0,
    },
    { 
      label: 'Interactions', 
      value: interactions, 
      icon: <MousePointerClick className="h-8 w-8 text-muted-foreground"/>, 
      conversionRate: interactions > 0 ? (conversions / interactions) * 100 : 0,
    },
    { 
      label: 'Conversions', 
      value: conversions, 
      icon: <Tag className="h-8 w-8 text-muted-foreground"/>, 
      conversionRate: conversions > 0 ? (sales / conversions) * 100 : 0,
    },
    { 
      label: 'Sales', 
      value: sales, 
      icon: <ShoppingCart className="h-8 w-8 text-muted-foreground"/>, 
      conversionRate: null,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Journey Funnel</CardTitle>
        <CardDescription>From initial scan to final sale.</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center items-center py-6">
         <div className="space-y-2 w-full max-w-xs flex flex-col items-center">
            {stages.map((stage, index) => (
              <div key={stage.label} className="w-full flex flex-col items-center">
                <FunnelStage {...stage} />
                {stage.conversionRate !== null && index < stages.length - 1 && (
                  <div className="flex flex-col items-center my-1 text-muted-foreground">
                    <ChevronDown className="h-5 w-5" />
                    <span className="text-xs font-semibold">{stage.conversionRate.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
