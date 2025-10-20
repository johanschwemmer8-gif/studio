
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
import { ArrowLeft, Server, BrainCircuit, Database, Gauge, Users, AlertTriangle, LineChart as LineChartIcon, Play, Square } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const initialData = [
  { time: '0s', users: 0, rps: 0, errors: 0 },
];

const latencyData = [
    { service: 'QR Tracking API', p50: 45, p95: 120, p99: 250 },
    { service: 'AI Recommendation Flow', p50: 350, p95: 850, p99: 1500 },
    { service: 'Inventory Check', p50: 80, p95: 200, p99: 400 },
    { service: 'User Authentication', p50: 60, p95: 150, p99: 300 },
];

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
        <Button asChild variant="ghost" className="-ml-4 mb-4">
          <Link href="/dashboard/system-integration">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to System Integration
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                Performance & Load Testing
                </h2>
                <p className="text-muted-foreground max-w-3xl">
                Simulate high-traffic scenarios to ensure system stability and scalability.
                </p>
            </div>
            <Button onClick={handleToggleTest} variant={isTestRunning ? "destructive" : "default"}>
                {isTestRunning ? <Square className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isTestRunning ? 'Stop Load Test' : 'Start Load Test'}
            </Button>
        </div>
      </div>
      <Separator />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">API Gateway (p95)</CardTitle><Server className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">180ms</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Database CPU</CardTitle><Database className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">45%</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">AI Model Avg. Response</CardTitle><BrainCircuit className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">650ms</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Throughput</CardTitle><Gauge className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">850 req/s</div></CardContent></Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LineChartIcon /> Live Load Test</CardTitle>
          <CardDescription>
            Real-time metrics from the ongoing load simulation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[350px] w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Errors', angle: -90, position: 'insideRight' }} />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="users" stroke="hsl(var(--chart-1))" name="Concurrent Users" dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="rps" stroke="hsl(var(--chart-2))" name="Requests/sec" dot={false} />
              <Line yAxisId="right" type="step" dataKey="errors" stroke="hsl(var(--destructive))" name="Errors" dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Component Latency Breakdown (p95)</CardTitle>
            <CardDescription>95th percentile response times for core services under load.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>p50</TableHead>
                        <TableHead>p95</TableHead>
                        <TableHead className="text-right">p99</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {latencyData.map(item => (
                        <TableRow key={item.service}>
                            <TableCell className="font-medium">{item.service}</TableCell>
                            <TableCell>{item.p50}ms</TableCell>
                            <TableCell>{item.p95}ms</TableCell>
                            <TableCell className="text-right">{item.p99}ms</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
