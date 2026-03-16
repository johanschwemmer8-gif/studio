
'use client';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { hourlyPerformanceData } from '@/lib/data';

type MetricKey = 'uniqueScans' | 'engagementRate' | 'offerRedemption' | 'basketUplift' | 'conversionRate' | 'dwellTime';

const metricConfig: Record<MetricKey, { label: string; color: string; unit: string }> = {
  uniqueScans: { label: 'Unique Scans', color: 'hsl(var(--chart-1))', unit: '' },
  engagementRate: { label: 'Engagement Rate', color: 'hsl(var(--chart-2))', unit: '%' },
  offerRedemption: { label: 'Offer Redemption', color: 'hsl(var(--chart-3))', unit: '%' },
  basketUplift: { label: 'Basket Uplift', color: 'hsl(var(--chart-4))', unit: '%' },
  conversionRate: { label: 'Conversion Rate', color: 'hsl(var(--chart-5))', unit: '%' },
  dwellTime: { label: 'Dwell Time', color: 'hsl(var(--chart-1))', unit: 's' },
};

const chartConfig = {
  uniqueScans: { label: 'Unique Scans', color: 'hsl(var(--chart-1))' },
  engagementRate: { label: 'Engagement Rate', color: 'hsl(var(--chart-2))' },
  offerRedemption: { label: 'Offer Redemption', color: 'hsl(var(--chart-3))' },
  basketUplift: { label: 'Basket Uplift', color: 'hsl(var(--chart-4))' },
  conversionRate: { label: 'Conversion Rate', color: 'hsl(var(--chart-5))' },
  dwellTime: { label: 'Dwell Time', color: 'hsl(var(--chart-1))' },
};

export default function HourlyPerformanceChart({ metric, title, description }: { metric: MetricKey, title: string, description: string }) {
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={hourlyPerformanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}${metricConfig[metric].unit}`}
              fontSize={12}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey={metric} fill={`var(--color-${metric})`} radius={4} name={metricConfig[metric].label} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
