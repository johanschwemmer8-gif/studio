import { NextResponse } from 'next/server';

/**
 * PRODUCTION DIAGNOSTIC ENDPOINT: Metadata Identity Bridge
 * Purpose: Verifies whether the App Hosting runtime can reach the Google metadata server
 * and successfully request a service-account access token.
 * 
 * SECURITY: This endpoint NEVER returns the actual access token.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  const METADATA_BASE_URL = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default';
  const headers = { 'Metadata-Flavor': 'Google' };

  let serviceAccount: string | null = null;
  let emailStatus: number | null = null;
  let tokenStatus: number | null = null;
  let emailLatencyMs: number = 0;
  let tokenLatencyMs: number = 0;
  let errorMsg: string | null = null;

  const timestamp = new Date().toISOString();

  try {
    // 1. Test Service Account Email Lookup
    const emailStart = performance.now();
    const emailResponse = await fetch(`${METADATA_BASE_URL}/email`, { 
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(5000) 
    });
    emailLatencyMs = Math.round(performance.now() - emailStart);
    emailStatus = emailResponse.status;

    if (emailResponse.ok) {
      serviceAccount = (await emailResponse.text()).trim();
    } else {
      errorMsg = `Email lookup failed with status: ${emailResponse.status}`;
    }

    // 2. Test Access Token Acquisition (NEVER expose the token body)
    const tokenStart = performance.now();
    const tokenResponse = await fetch(`${METADATA_BASE_URL}/token`, { 
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    tokenLatencyMs = Math.round(performance.now() - tokenStart);
    tokenStatus = tokenResponse.status;

    if (!tokenResponse.ok && !errorMsg) {
        errorMsg = `Token refresh failed with status: ${tokenResponse.status}`;
    }

    const success = (emailStatus === 200 && tokenStatus === 200);

    return NextResponse.json({
      success,
      serviceAccount,
      emailStatus,
      tokenStatus,
      emailLatencyMs,
      tokenLatencyMs,
      error: errorMsg,
      timestamp,
    }, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      serviceAccount,
      emailStatus,
      tokenStatus,
      emailLatencyMs,
      tokenLatencyMs,
      error: err.message || "Network error during metadata handshake",
      timestamp,
    }, {
      status: 500,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}
