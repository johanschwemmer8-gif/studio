'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Server, BrainCircuit, Database, Gauge, LineChart as LineChartIcon, Play, Square } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BackButton } from '@/components/ui/back-button';

const initialData = [
  { time: '0s', users: 0, rps: 0, errors: 0 },
];

const latencyData: { service: string; p50: number; p95: number; p99: number; }[] = [];

export default function PerformanceDashboardPage() {
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [chartData, setChartData] = useState(initialData);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTestRunning) {
      let time = 0;
      interval = setInterval(() => {
        time += 5;
        setChartData(prevData => [
          ...prevData,
          {
            time: `${time}s`,
            users: Math.min(5000, prevData.length * 100 + Math.random() * 200),
            rps: Math.min(1000, prevData.length * 20 + Math.random() * 50),
            errors: Math.random() > 0.95 ? (prevData.at(-1)?.errors || 0) + 1 : (prevData.at(-1)?.errors || 0),
          },
        ]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isTestRunning]);
  
  const handleToggleTest = () => {
      if(isTestRunning) {
          setIsTestRunning(false);
      } else {
          setChartData(initialData);
          setIsTestRunning(true);
      }
  }


  return (
    <div className="space-y-8">
      <div>
        <BackButton fallback="/dashboard/system-integration" label="Back to Test Laboratory" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2 uppercase">
                Performance Monitor
                </h2>
                <p className="text-muted-foreground max-w-3xl text-sm">
                Simulate high-traffic scenarios to ensure system stability and scalability across all tenants.
                </p>
            </div>
            <Button onClick={handleToggleTest} variant={isTestRunning ? "destructive" : "default"} className="font-bold uppercase text-[10px] tracking-widest">
                {isTestRunning ? <Square className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isTestRunning ? 'Stop Load Test' : 'Start Load Test'}
            </Button>
        </div>
      </div>
      <Separator />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">API Gateway (p95)</CardTitle><Server className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-black">0ms</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Database CPU</CardTitle><Database className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-black">0%</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AI Node Response</CardTitle><BrainCircuit className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-black">0ms</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Throughput</CardTitle><Gauge className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-black">0 req/s</div></CardContent></Card>
      </div>

       <Card className="border-primary/10 shadow-lg">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight"><LineChartIcon className="h-5 w-5 text-primary" /> Live Load Simulation</CardTitle>
          <CardDescription className="text-xs">
            Real-time telemetry from the ongoing performance test.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ChartContainer config={{}} className="h-[350px] w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontWeight: 'bold', fontSize: '10px' } }} />
              <YAxis yAxisId="right" orientation="right" fontSize={10} tickLine={false} axisLine={false} label={{ value: 'Errors', angle: -90, position: 'insideRight', style: { textAnchor: 'middle', fontWeight: 'bold', fontSize: '10px' } }} />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
              <Line yAxisId="left" type="monotone" dataKey="users" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Concurrent Users" dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="rps" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Requests/sec" dot={false} />
              <Line yAxisId="right" type="step" dataKey="errors" stroke="hsl(var(--destructive))" strokeWidth={2} name="Errors" dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
