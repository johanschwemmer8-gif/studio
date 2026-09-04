'use server';

import { getDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-server';
import type {
  ProductImportFileType,
  ProductImportJob,
  ProductImportJobStatus,
  ProductImportMapping,
} from '@/types/importer/product-import';

export type CreateProductImportJobInput = {
  requestedRetailerId: string;
  filename: string;
  fileType: ProductImportFileType;
  mappings: ProductImportMapping[];
  totalRows: number;
};

export type UpdateProductImportJobInput = {
  status?: ProductImportJobStatus;
  completedAt?: unknown;
  totalRows?: number;
  validRows?: number;
  warningRows?: number;
  rejectedRows?: number;
  createdRows?: number;
  duplicateRows?: number;
};

export type ProductImportJobResult =
  | {
      success: true;
      job: ProductImportJob;
    }
  | {
      success: false;
      error: string;
    };

function serializeProductImportJob(job: ProductImportJob): ProductImportJob {
  const serializeDate = (value: unknown): unknown => {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (
      value !== null &&
      typeof value === 'object' &&
      'toDate' in value &&
      typeof (value as { toDate?: unknown }).toDate === 'function'
    ) {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }

    return value;
  };

  return {
    ...job,
    startedAt: serializeDate(job.startedAt),
    completedAt: serializeDate(job.completedAt),
  };
}

function resolveRetailerId(
  role: 'admin' | 'retailerAdmin' | 'storeManager' | 'analyst',
  authenticatedRetailerId: string | undefined,
  requestedRetailerId: string
): string {
  if (role === 'admin') {
    return requestedRetailerId.trim();
  }

  return authenticatedRetailerId?.trim() || '';
}

export async function createProductImportJob(
  idToken: string,
  input: CreateProductImportJobInput
): Promise<ProductImportJobResult> {
  const auth = await verifyAuth(idToken);

  if (auth.error || auth.uid === '') {
    return {
      success: false,
      error: auth.error || 'Authentication failed.',
    };
  }

  const retailerId = resolveRetailerId(
    auth.role,
    auth.retailerId,
    input.requestedRetailerId
  );

  if (retailerId === '' || retailerId === 'unknown') {
    return {
      success: false,
      error: 'Account is not linked to a valid retailer.',
    };
  }

  if (
    auth.role !== 'admin' &&
    auth.retailerId !== input.requestedRetailerId
  ) {
    return {
      success: false,
      error: 'Access denied: retailer identity does not match your account.',
    };
  }

  const filename = input.filename.trim();

  if (filename === '') {
    return {
      success: false,
      error: 'Import filename is required.',
    };
  }

  if (!Number.isInteger(input.totalRows) || input.totalRows < 0) {
    return {
      success: false,
      error: 'Import row count is invalid.',
    };
  }

  const db = getDb();

  if (db === undefined || db === null) {
    return {
      success: false,
      error: 'Product database is currently unavailable.',
    };
  }

  const now = new Date();
  const jobRef = db.collection('productImportJobs').doc();

  const job: ProductImportJob = {
    importJobId: jobRef.id,
    retailerId,
    filename,
    fileType: input.fileType,
    source: 'BULK_IMPORT',
    status: 'PENDING',
    startedAt: now,
    totalRows: input.totalRows,
    validRows: 0,
    warningRows: 0,
    rejectedRows: 0,
    createdRows: 0,
    duplicateRows: 0,
    createdBy: auth.uid,
    mappings: input.mappings,
  };

  await jobRef.set(job);

  return {
    success: true,
    job: serializeProductImportJob(job),
  };
}

function isValidProductImportJobTransition(
  current: ProductImportJobStatus,
  next: ProductImportJobStatus
): boolean {
  const transitions: Record<ProductImportJobStatus, ProductImportJobStatus[]> = {
    PENDING: ['VALIDATING', 'FAILED'],
    VALIDATING: ['READY', 'FAILED'],
    READY: ['IMPORTING', 'FAILED'],
    IMPORTING: ['COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED'],
    COMPLETED: [],
    COMPLETED_WITH_ERRORS: [],
    FAILED: [],
  };

  return transitions[current].includes(next);
}


export async function updateProductImportJob(
  idToken: string,
  importJobId: string,
  input: UpdateProductImportJobInput
): Promise<ProductImportJobResult> {
  const auth = await verifyAuth(idToken);

  if (auth.error || auth.uid === '') {
    return {
      success: false,
      error: auth.error || 'Authentication failed.',
    };
  }

  const jobId = importJobId.trim();

  if (jobId === '') {
    return {
      success: false,
      error: 'Import job ID is required.',
    };
  }

  const db = getDb();

  if (db === undefined || db === null) {
    return {
      success: false,
      error: 'Product database is currently unavailable.',
    };
  }

  const jobRef = db.collection('productImportJobs').doc(jobId);
  const snapshot = await jobRef.get();

  if (snapshot.exists === false) {
    return {
      success: false,
      error: 'Import job was not found.',
    };
  }

  const existing = snapshot.data() as ProductImportJob;

  if (
    auth.role !== 'admin' &&
    existing.retailerId !== auth.retailerId
  ) {
    return {
      success: false,
      error: 'Access denied: import job belongs to another retailer.',
    };
  }

  const updates: Record<string, unknown> = {};

  if (input.status !== undefined) {
    if (input.status !== existing.status) {
      if (!isValidProductImportJobTransition(existing.status, input.status)) {
        return {
          success: false,
          error: `Invalid import job status transition: ${existing.status} -> ${input.status}.`,
        };
      }
    }

    updates.status = input.status;
  }

  if (input.completedAt !== undefined) {
    updates.completedAt = input.completedAt;
  }

  if (input.totalRows !== undefined) {
    updates.totalRows = input.totalRows;
  }

  if (input.validRows !== undefined) {
    updates.validRows = input.validRows;
  }

  if (input.warningRows !== undefined) {
    updates.warningRows = input.warningRows;
  }

  if (input.rejectedRows !== undefined) {
    updates.rejectedRows = input.rejectedRows;
  }

  if (input.createdRows !== undefined) {
    updates.createdRows = input.createdRows;
  }

  if (input.duplicateRows !== undefined) {
    updates.duplicateRows = input.duplicateRows;
  }

  if (Object.keys(updates).length === 0) {
    return {
      success: false,
      error: 'No import job updates were supplied.',
    };
  }

  await jobRef.update(updates);

  const updatedSnapshot = await jobRef.get();

  return {
    success: true,
    job: serializeProductImportJob(
      updatedSnapshot.data() as ProductImportJob
    ),
  };
}
