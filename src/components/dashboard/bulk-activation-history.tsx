'use client';

import * as React from 'react';
import {
  Loader2,
  RefreshCw,
} from 'lucide-react';

import {
  listBulkActivationHistory,
  type BulkActivationHistoryItem,
} from '@/ai/flows/list-bulk-activation-history';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

function formatTimestamp(value?: string): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString();
}

export function BulkActivationHistory() {
  const { user } = useAuth();

  const [items, setItems] = React.useState<BulkActivationHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadHistory = React.useCallback(async () => {
    const authenticatedUser = user;
    const retailerId = authenticatedUser?.retailerId;

    if (!authenticatedUser || !retailerId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idToken = await authenticatedUser.getIdToken();

      const result = await listBulkActivationHistory({
        idToken,
        retailerId,
      });

      setItems(result);
    } catch (loadError) {
      console.error(
        '[QR Management] Failed to load Bulk Activation History:',
        loadError
      );

      setError('Bulk Activation History could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading Bulk Activation History...
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadHistory()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        No Bulk Activation requests have been submitted yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void loadHistory()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {items.map((item) => (
        <Card key={item.requestId}>
          <CardContent className="grid gap-4 p-5 md:grid-cols-5">
            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Request ID
              </p>
              <p className="break-all text-sm font-medium">
                {item.requestId}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </p>
              <p className="text-sm font-bold">
                {item.status}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Processed
              </p>
              <p className="text-sm">
                {item.itemsDone} / {item.totalRequested}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Updated
              </p>
              <p className="text-sm">
                {formatTimestamp(item.updatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
