'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Loader2,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';

import { Badge } from '../ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

type BulkRequestStatus =
  | 'SUBMITTING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

type BulkRequest = {
  id: string;
  totalRequested: number;
  status: BulkRequestStatus;
  createdAt: Timestamp | Date;
  itemsDone: number;
  retailerId?: string;
  submittedBy?: string;
  error?: string;
};

type BulkWorkItem = {
  id: string;
  status: 'PENDING' | 'DONE' | 'ERROR';
  activation?: {
    campaignId?: string;
    name?: string;
    target?: {
      level?: string;
      value?: string;
      label?: string;
      productGtin?: string;
    };
  };
  deployments?: Array<{
    storeId?: string;
    storeName?: string;
    placement?: string;
  }>;
  activationId?: string | null;
  deploymentIds?: string[];
  qrCodeIds?: string[];
  retryCount?: number;
  error?: string | null;
};

const getDisplayDate = (timestamp: unknown) => {
  if (timestamp == null) return 'Date pending...';

  if (
    typeof timestamp === 'object' &&
    timestamp !== null &&
    'toDate' in timestamp &&
    typeof (timestamp as { toDate?: unknown }).toDate === 'function'
  ) {
    return (timestamp as { toDate: () => Date }).toDate().toLocaleString();
  }

  if (timestamp instanceof Date) return timestamp.toLocaleString();

  const date = new Date(String(timestamp));
  return Number.isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
};

function QrRequestDetails({ request }: { request: BulkRequest }) {
  const [items, setItems] = useState<BulkWorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (db == null) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const itemsQuery = query(
      collection(db, `bulkQrRequests/${request.id}/items`)
    );

    const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
      const fetchedItems = snapshot.docs.map((itemDoc) => ({
        id: itemDoc.id,
        ...itemDoc.data(),
      })) as BulkWorkItem[];

      setItems(fetchedItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [request.id]);

  if (loading) {
    return (
      <div className="grid gap-3">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {request.status === 'COMPLETED' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Bulk Request Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs leading-relaxed text-muted-foreground">
              The requested Activation and Deployment records have been created successfully. QR identities are not created by the bulk request and remain subject to the canonical Deployment and QR assignment lifecycle.
            </p>
          </CardContent>
        </Card>
      )}

      {request.status === 'FAILED' && request.error && (
        <Card className="border-destructive/30">
          <CardContent className="flex gap-3 p-4 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{request.error}</span>
          </CardContent>
        </Card>
      )}

      <Separator />

      <div>
        <h3 className="text-lg font-black uppercase tracking-tighter">
          Activation Work Items
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Each work item represents one canonical Activation and its requested Deployments.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm italic text-muted-foreground">
          No Activation work items found.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const deploymentCount = item.deployments?.length || 0;
            const completedDeployments = item.deploymentIds?.length || 0;

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Activation {index + 1}</Badge>
                        <Badge
                          variant={item.status === 'ERROR' ? 'destructive' : 'secondary'}
                        >
                          {item.status}
                        </Badge>
                      </div>

                      <h4 className="truncate font-bold">
                        {item.activation?.name || 'Unnamed Activation'}
                      </h4>

                      <p className="text-xs text-muted-foreground">
                        Target: {item.activation?.target?.label || item.activation?.target?.value || 'Not specified'}
                      </p>

                      {item.activationId && (
                        <p className="break-all font-mono text-[10px] text-muted-foreground">
                          Activation ID: {item.activationId}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-left md:text-right">
                      <p className="text-xs font-bold">
                        {completedDeployments} / {deploymentCount} Deployment records
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        QR identities: {item.qrCodeIds?.length || 0}
                      </p>
                    </div>
                  </div>

                  {item.error && (
                    <div className="mt-4 flex gap-2 rounded-md border border-destructive/20 p-3 text-xs text-destructive">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{item.error}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function QrCampaignDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BulkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<BulkRequest | null>(
    null
  );

  useEffect(() => {
    if (db == null || user?.retailerId == null) {
      setLoading(false);
      return;
    }

    const requestsQuery = query(
      collection(db, 'bulkQrRequests'),
      where('retailerId', '==', user.retailerId)
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const fetched = snapshot.docs.map((requestDoc) => ({
        id: requestDoc.id,
        ...requestDoc.data(),
      })) as BulkRequest[];

      fetched.sort((a, b) => {
        const dateA =
          a.createdAt instanceof Timestamp
            ? a.createdAt.toDate().getTime()
            : new Date(a.createdAt).getTime();

        const dateB =
          b.createdAt instanceof Timestamp
            ? b.createdAt.toDate().getTime()
            : new Date(b.createdAt).getTime();

        return dateB - dateA;
      });

      setRequests(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.retailerId]);

  if (loading) {
    return (
      <Card className="flex justify-center p-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-black uppercase tracking-tighter">
            Bulk Activation History
          </CardTitle>
          <CardDescription>
            Monitor canonical bulk Activation and Deployment requests.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {requests.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed bg-muted/20 p-12 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                No bulk Activation history found.
              </p>
            </div>
          ) : (
            requests.map((request) => {
              const progress =
                request.totalRequested > 0
                  ? ((request.itemsDone || 0) / request.totalRequested) * 100
                  : 0;

              const isSelected = selectedRequest?.id === request.id;

              return (
                <Card
                  key={request.id}
                  className={cn(
                    'transition-all duration-300',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/10'
                      : 'hover:border-primary/30'
                  )}
                >
                  <div className="flex flex-col items-center gap-6 p-6 sm:flex-row">
                    <div className="min-w-0 flex-1">
                      <Badge
                        variant="outline"
                        className="mb-2 text-[8px] font-black uppercase tracking-tighter opacity-60"
                      >
                        {request.id}
                      </Badge>

                      <h4 className="text-lg font-black tracking-tight">
                        Bulk Activation Request
                      </h4>

                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        {getDisplayDate(request.createdAt)}
                      </p>
                    </div>

                    <div className="w-full space-y-2 sm:w-48">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                        <span
                          className={cn(
                            request.status === 'COMPLETED'
                              ? 'text-green-600'
                              : request.status === 'FAILED'
                                ? 'text-destructive'
                                : 'text-primary'
                          )}
                        >
                          {request.status}
                        </span>

                        <span>
                          {request.itemsDone || 0} / {request.totalRequested}
                        </span>
                      </div>

                      <Progress value={progress} className="h-2" />
                    </div>

                    <Button
                      variant={isSelected ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() =>
                        setSelectedRequest(isSelected ? null : request)
                      }
                      className="h-10 shrink-0 px-6 text-[10px] font-black uppercase tracking-widest"
                    >
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      {isSelected ? 'Close' : 'Manage'}
                    </Button>
                  </div>

                  {isSelected && (
                    <div className="border-t bg-muted/5 px-6 pb-6 pt-0">
                      <div className="pt-6">
                        <QrRequestDetails request={request} />
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
