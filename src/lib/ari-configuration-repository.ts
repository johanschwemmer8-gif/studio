import { admin } from '@/lib/firebase-admin';
import {
  RetailerAriConfiguration,
  RetailerAriConfigurationSchema,
} from '@/lib/schemas/retailer-ari-configuration';

export async function getRetailerAriConfiguration(
  retailerId: string
): Promise<RetailerAriConfiguration | null> {
  if (!retailerId) {
    throw new Error('ARI_CONFIGURATION_DENIED:RETAILER_ID_REQUIRED');
  }

  const db = admin.firestore();

  const snapshot = await db
    .collection('configurations')
    .doc(`${retailerId}_ai`)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const parsed = RetailerAriConfigurationSchema.safeParse(snapshot.data());

  if (!parsed.success) {
    throw new Error('ARI_CONFIGURATION_DENIED:INVALID_CONFIGURATION');
  }

  if (parsed.data.retailerId !== retailerId) {
    throw new Error('ARI_CONFIGURATION_DENIED:TENANT_IDENTITY_MISMATCH');
  }

  return parsed.data;
}
