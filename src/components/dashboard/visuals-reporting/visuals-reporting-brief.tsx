'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';
import type { VisualsReportingBrief as VisualsReportingBriefType } from '@/lib/schemas/visuals-reporting-brief';

type VisualsReportingBriefProps = {
  brief: VisualsReportingBriefType | null;
  loading: boolean;
  onGenerate: () => void;
};

export function VisualsReportingBrief({
  brief,
  loading,
  onGenerate,
}: VisualsReportingBriefProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">
              AI Reporting Brief
            </h3>
            <Badge variant="outline">
              AI Interpretation
            </Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Governed interpretation of the Verified Reporting Evidence shown for this exact scope and reporting period.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onGenerate}
          disabled={loading}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {loading
            ? 'Generating...'
            : brief
              ? 'Regenerate Brief'
              : 'Generate Brief'}
        </Button>
      </div>

      {loading && (
        <Card>
          <CardContent className="space-y-3 py-6">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      )}

      {!loading && !brief && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Generate a governed AI interpretation of the verified evidence. The AI cannot add metrics, expand the reporting scope, or replace unavailable evidence.
          </CardContent>
        </Card>
      )}

      {!loading && brief && (
        <Card>
          <CardContent className="space-y-6 py-6">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  brief.status === 'AVAILABLE'
                    ? 'default'
                    : 'outline'
                }
              >
                {brief.status.replaceAll('_', ' ')}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Interpretation only — Verified Reporting Evidence remains authoritative.
              </span>
            </div>

            <div>
              <h4 className="text-sm font-semibold">
                Executive Summary
              </h4>
              <p className="mt-2 text-sm text-muted-foreground">
                {brief.executiveSummary}
              </p>
            </div>

            {brief.factualObservations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold">
                  Factual Observations
                </h4>
                <div className="mt-2 space-y-3">
                  {brief.factualObservations.map(
                    (item, index) => (
                      <div
                        key={`observation-${index}`}
                        className="text-sm"
                      >
                        <p>{item.statement}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Evidence: {item.evidenceRefs.join(', ')}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {brief.notablePatterns.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold">
                  Notable Patterns
                </h4>
                <div className="mt-2 space-y-3">
                  {brief.notablePatterns.map(
                    (item, index) => (
                      <div
                        key={`pattern-${index}`}
                        className="text-sm"
                      >
                        <p>{item.statement}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Evidence: {item.evidenceRefs.join(', ')}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {brief.reportingLimitations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold">
                  Reporting Limitations
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {brief.reportingLimitations.map(
                    (limitation, index) => (
                      <li key={`limitation-${index}`}>
                        • {limitation}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
