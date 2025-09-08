
import { type SavedRetailer } from '@/app/dashboard/admin/page';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Eye, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import Link from 'next/link';

type RetailerDashboardPreviewProps = {
  retailer: SavedRetailer;
};

function slugify(text: string) {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export default function RetailerDashboardPreview({ retailer }: RetailerDashboardPreviewProps) {
  const chartData = [
    { month: 'Jan', revenue: Math.floor(Math.random() * 2000) + 1000 },
    { month: 'Feb', revenue: Math.floor(Math.random() * 2000) + 1000 },
    { month: 'Mar', revenue: Math.floor(Math.random() * 2000) + 1000 },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{retailer.name}</CardTitle>
        <CardDescription>A preview of their live dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-md bg-muted">
            <h4 className="font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> ROI Ratio
            </h4>
            <p className="font-bold text-base">3.5:1</p>
          </div>
          <div className="p-2 rounded-md bg-muted">
            <h4 className="font-semibold flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Net Gain
            </h4>
            <p className="font-bold text-base">R45k</p>
          </div>
        </div>
        <div>
          <h4 className="text-xs mb-1 font-semibold text-muted-foreground">Revenue Uplift</h4>
          <ChartContainer config={{}} className="h-[100px] w-full">
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={10} tickFormatter={(val) => `R${val/1000}k`}/>
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
      <Separator />
      <div className="p-4">
        <Button asChild className="w-full" size="sm">
            <Link href={`/retailer-mvp/dashboard?retailer=${slugify(retailer.name)}`} target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                View Full Dashboard
            </Link>
        </Button>
      </div>
    </Card>
  );
}
