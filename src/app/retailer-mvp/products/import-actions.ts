'use server';

import { verifyAuth } from '@/lib/auth-server';
import {
  createProductImportJob,
  type CreateProductImportJobInput,
} from '@/services/importer/product-import-job-service';
import {
  previewProductImportRows,
  type ProductImportPreviewInput,
} from '@/services/importer/product-import-preview';
import {
  executeProductImport,
  type ProductImportExecutionRow,
} from '@/services/importer/product-import-execution';
import {
  updateProductImportJob,
  type UpdateProductImportJobInput,
} from '@/services/importer/product-import-job-service';

export async function createBulkProductImportJob(
  idToken: string,
  input: CreateProductImportJobInput
) {
  return createProductImportJob(idToken, input);
}

export async function previewBulkProductImport(
  idToken: string,
  requestedRetailerId: string,
  rows: ProductImportPreviewInput[]
) {
  const auth = await verifyAuth(idToken);

  if (auth.error || auth.uid === '') {
    throw new Error(auth.error || 'Authentication failed.');
  }

  const retailerId =
    auth.role === 'admin' ? requestedRetailerId : auth.retailerId;

  if (!retailerId || retailerId === 'unknown') {
    throw new Error('Account is not linked to a valid retailer.');
  }

  if (
    auth.role !== 'admin' &&
    auth.retailerId !== requestedRetailerId
  ) {
    throw new Error(
      'Access denied: retailer identity does not match your account.'
    );
  }

  return previewProductImportRows(retailerId, rows);
}

export async function updateBulkProductImportJob(
  idToken: string,
  importJobId: string,
  input: UpdateProductImportJobInput
) {
  return updateProductImportJob(idToken, importJobId, input);
}

export async function executeBulkProductImport(
  idToken: string,
  requestedRetailerId: string,
  rows: ProductImportExecutionRow[]
) {
  return executeProductImport(idToken, requestedRetailerId, rows);
}
