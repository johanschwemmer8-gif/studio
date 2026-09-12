import { randomUUID } from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';

import { admin } from '@/lib/firebase-admin';
import { resolveProductionQr } from '@/lib/qr-resolution';
import { ScanEventSchema } from '@/lib/schemas/scan-events';

if (!admin.apps.length) {
  admin.initializeApp();
}

const RESOLUTION_ERROR_CODES = new Set([
  'QR_NOT_FOUND',
  'QR_INTEGRITY_ERROR',
  'UNSUPPORTED_QR_ENVIRONMENT',
  'QR_RETIRED',
  'DEPLOYMENT_NOT_FOUND',
  'DEPLOYMENT_INTEGRITY_ERROR',
  'DEPLOYMENT_REMOVED',
  'DEPLOYMENT_UNAVAILABLE',
  'ACTIVATION_NOT_FOUND',
  'ACTIVATION_INTEGRITY_ERROR',
  'ACTIVATION_UNAVAILABLE',
  'ACTIVATION_NOT_STARTED',
  'ACTIVATION_ENDED',
  'CAMPAIGN_NOT_FOUND',
  'CAMPAIGN_INTEGRITY_ERROR',
  'CAMPAIGN_ARCHIVED',
  'CAMPAIGN_NOT_STARTED',
  'CAMPAIGN_ENDED',
]);

/**
 * Canonical production QR resolver.
 *
 * Identity path:
 * Retailer
 *   -> Campaign
 *     -> Activation
 *       -> Deployment
 *         -> QR
 *           -> Scan Event
 *
 * A QR scan records exposure only. It does NOT automatically create a
 * Shopper Session. A qualifying downstream interaction establishes the
 * anonymous Shopper Session separately.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = admin.firestore();

  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    'localhost';

  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const origin = `${protocol}://${host}`;

  const reject = (code: string) =>
    NextResponse.redirect(new URL(`/error?code=${code}`, origin), 302);

  try {
    // 1. Resolve the canonical production QR relationship chain.
    const { qr, activation } = await resolveProductionQr(id);

    // 2. Record canonical scan event only.
    //
    // No Shopper Session is created here.
    const eventId = `ev_${randomUUID()}`;
    const now = admin.firestore.Timestamp.now();

    const scanEvent = {
      eventId,
      eventType: 'scan' as const,

      retailerId: qr.retailerId,
      campaignId: qr.campaignId,
      activationId: qr.activationId,
      deploymentId: qr.deploymentId,
      qrCodeId: qr.qrCodeId,

      configurationVersion: activation.configurationVersion,
      environment: qr.environment,

      timestamp: now,

      userAgent: request.headers.get('user-agent') || '',
      referrer: request.headers.get('referer') || '',
    };

    ScanEventSchema.parse(scanEvent);

    await db.collection('events').doc(eventId).set(scanEvent);

    // 3. Hand off canonical QR identity to the shopper experience.
    return NextResponse.redirect(
      new URL(`/scan/${encodeURIComponent(qr.qrCodeId)}`, origin),
      302
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'UNKNOWN_RESOLUTION_FAILURE';

    if (RESOLUTION_ERROR_CODES.has(message)) {
      return reject(message.toLowerCase());
    }

    console.error(`[Resolver] Critical failure for ${id}:`, message);

    return reject('500');
  }
}
