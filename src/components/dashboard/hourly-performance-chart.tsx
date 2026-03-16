
'use client';
import { useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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


export default function HourlyPerformanceChart() {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('uniqueScans');

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle>Hourly Performance Breakdown</CardTitle>
                <CardDescription>
                    Key metrics by hour of the day.
                </CardDescription>
            </div>
            <div className="w-full sm:w-[200px]">
                <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricKey)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a metric" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(metricConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={hourlyPerformanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}${metricConfig[selectedMetric].unit}`}
            />
            <Tooltip content={<ChartTooltipContent />} />
            <Bar dataKey={selectedMetric} fill={`var(--color-${selectedMetric})`} radius={4} name={metricConfig[selectedMetric].label} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
