import { NextRequest, NextResponse } from 'next/server';

import { resolveProductionQr } from '@/lib/qr-resolution';

/**
 * CANONICAL QR IDENTITY GATEWAY
 *
 * Resolving/scanning a QR is an exposure event. It does NOT itself create a
 * Shopper Session. A Session begins only after a qualifying shopper
 * interaction in the experience layer.
 *
 * Identity authority:
 * Campaign -> Activation -> Deployment -> QR
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await resolveProductionQr(id);

    return NextResponse.redirect(
      new URL(`/scan/${encodeURIComponent(id)}`, request.url),
      302
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'QR_RESOLUTION_FAILED';

    console.error(`[Resolver] Resolution failed for ${id}:`, message);

    const code = encodeURIComponent(message);
    return NextResponse.redirect(
      new URL(`/error?code=${code}`, request.url),
      302
    );
  }
}
