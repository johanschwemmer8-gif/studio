import { z } from 'zod';

import {
  DeploymentStatusSchema,
  FirestoreTimestampSchema,
} from './retail-domain';

export const DeploymentPlacementSchema = z.object({
  department: z.string().optional(),
  area: z.string().optional(),
  aisle: z.string().optional(),
  shelf: z.string().optional(),
  fixture: z.string().optional(),
  description: z.string().optional(),
});

export type DeploymentPlacement = z.infer<typeof DeploymentPlacementSchema>;

export const DeploymentSchema = z.object({
  deploymentId: z.string().min(1),
  retailerId: z.string().min(1),
  activationId: z.string().min(1),
  campaignId: z.string().min(1),
  storeId: z.string().min(1),
  storeName: z.string().min(1),
  placement: DeploymentPlacementSchema,
  qrCodeId: z.string().min(1),
  status: DeploymentStatusSchema,
  assignedAt: FirestoreTimestampSchema.optional(),
  assignedBy: z.string().min(1).optional(),
  printedAt: FirestoreTimestampSchema.optional(),
  printedBy: z.string().min(1).optional(),
  deployedAt: FirestoreTimestampSchema.optional(),
  deployedBy: z.string().min(1).optional(),
  problemReportedAt: FirestoreTimestampSchema.optional(),
  problemReportedBy: z.string().min(1).optional(),
  problemReason: z.string().optional(),
  createdAt: FirestoreTimestampSchema,
  createdBy: z.string().min(1),
  updatedAt: FirestoreTimestampSchema,
  updatedBy: z.string().min(1),
  removedAt: FirestoreTimestampSchema.optional(),
  removedBy: z.string().min(1).optional(),
});

export type Deployment = z.infer<typeof DeploymentSchema>;
