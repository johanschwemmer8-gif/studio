'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { VisualsReportingTrendPoint } from '@/lib/schemas/visuals-reporting';

type Props = {
  title: string;
  description: string;
  data: VisualsReportingTrendPoint[];
};

export function ReportingTrendChart({ title, description, data }: Props) {
  const chartData = data.map((point) => ({
    period: new Date(point.periodStart).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
    }),
    value: point.status === 'MEASURED' ? point.value : null,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reportable trend evidence is available for this scope and period.
          </p>
        ) : (
          <ChartContainer
            config={{ value: { label: title, color: 'hsl(var(--chart-1))' } }}
            className="h-[280px] w-full"
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                connectNulls={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
