
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
  conversionRate,
  color,
  isLast = false
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  conversionRate: number;
  color: string;
  isLast?: boolean;
}) => (
  <div className="flex flex-col items-center">
    <div className={`flex items-center justify-between p-4 rounded-lg w-full max-w-sm text-white shadow-md ${color}`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-semibold text-lg">{label}</span>
      </div>
      <span className="font-bold text-xl">{value.toLocaleString()}</span>
    </div>
    {!isLast && (
      <div className="flex flex-col items-center my-2 text-muted-foreground">
        <ChevronDown className="h-5 w-5" />
        <span className="text-xs font-semibold">{conversionRate.toFixed(1)}% to next</span>
      </div>
    )}
  </div>
);

export default function SalesFunnelChart({ data }: SalesFunnelChartProps) {
  const { scans, interactions, conversions, sales } = data;
  
  const stages = [
    { 
      label: 'Scans', 
      value: scans, 
      icon: <QrCode className="h-6 w-6"/>, 
      color: 'bg-chart-1', 
      conversionRate: scans > 0 ? (interactions / scans) * 100 : 0,
    },
    { 
      label: 'Interactions', 
      value: interactions, 
      icon: <MousePointerClick className="h-6 w-6"/>, 
      color: 'bg-primary',
      conversionRate: interactions > 0 ? (conversions / interactions) * 100 : 0,
    },
    { 
      label: 'Conversions', 
      value: conversions, 
      icon: <Tag className="h-6 w-6"/>, 
      color: 'bg-chart-4',
      conversionRate: conversions > 0 ? (sales / conversions) * 100 : 0,
    },
    { 
      label: 'Sales', 
      value: sales, 
      icon: <ShoppingCart className="h-6 w-6"/>, 
      color: 'bg-chart-2',
      conversionRate: 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Journey Funnel</CardTitle>
        <CardDescription>From initial scan to final sale.</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-6">
         <div className="space-y-0">
            {stages.map((stage, index) => (
                <FunnelStage key={stage.label} {...stage} isLast={index === stages.length - 1} />
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
