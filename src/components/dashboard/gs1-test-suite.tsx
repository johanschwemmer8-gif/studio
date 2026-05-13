'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { parseGS1 } from '@/lib/gs1-parser';
import { CheckCircle2, XCircle, Search, Code, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Gs1TestSuite() {
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const handleTest = () => {
    const result = parseGS1(testInput);
    setTestResult(result);
  };

  const testCases = [
    { label: 'Standard GTIN-13', value: '6001234567890' },
    { label: 'GS1 Digital Link', value: 'https://id.interact.io/01/06001234567891/10/BATCH123/21/SER999' },
    { label: 'AIDC String', value: '(01)06009876543210(10)LOT42' },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Code className="h-5 w-5" />
            GS1 Parsing Test Suite
          </CardTitle>
          <CardDescription>
            Validate raw input strings against the iNteract GS1-aligned parser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="gs1-test">Input String</Label>
              <Input
                id="gs1-test"
                placeholder="Paste GTIN, Digital Link, or AIDC string..."
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <Button onClick={handleTest} className="self-end">
              <Search className="mr-2 h-4 w-4" />
              Test Parser
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {testCases.map((tc) => (
              <Button
                key={tc.label}
                variant="outline"
                size="sm"
                className="text-[10px] uppercase font-bold"
                onClick={() => {
                  setTestInput(tc.value);
                  setTestResult(parseGS1(tc.value));
                }}
              >
                {tc.label}
              </Button>
            ))}
          </div>

          {testResult ? (
            <div className="p-4 rounded-lg bg-background border animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Parser Result</span>
                <Badge className="bg-green-500 text-white border-none text-[10px]">VALID FORMAT</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">GTIN-14 (Canonical)</p>
                  <p className="font-mono text-lg font-black text-primary">{testResult.gtin}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Batch (AI 10)</p>
                  <p className="font-mono text-lg font-bold">{testResult.batchNumber || '---'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Serial (AI 21)</p>
                  <p className="font-mono text-lg font-bold">{testResult.serialNumber || '---'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Digital Link Native</p>
                  <p className="font-bold text-sm">{testResult.isDigitalLink ? 'TRUE' : 'FALSE'}</p>
                </div>
              </div>
            </div>
          ) : testInput && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
              <XCircle className="h-5 w-5" />
              <p className="text-sm font-bold">Invalid GS1 Identity: Parser rejected input.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
