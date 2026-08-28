import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

/**
 * FORRENSIC DIAGNOSTIC ENDPOINT: Admin SDK -> Firestore Bridge
 * Purpose: Verifies whether the initialized Firebase Admin SDK can perform a minimal 
 * Firestore operation using the environment's Application Default Credentials.
 * 
 * SECURITY: This endpoint returns only status and latency metadata.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();
  const start = performance.now();

  try {
    // Targeted verification: check whether the demo tenant exists
    const tenantDoc = await db.collection('tenants').doc('interact-test-tenant').get();
    
    const latencyMs = Math.round(performance.now() - start);

    return NextResponse.json({
      success: true,
      firestoreStatus: "success",
      tenantExists: tenantDoc.exists,
      tenantId: tenantDoc.exists ? tenantDoc.id : null,
      tenantData: tenantDoc.exists ? tenantDoc.data() : null,
      latencyMs,
      errorCode: null,
      errorMessage: null,
      timestamp,
    }, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (error: any) {
    const latencyMs = Math.round(performance.now() - start);
    
    // Capture gRPC/SDK error details without exposing sensitive data
    return NextResponse.json({
      success: false,
      firestoreStatus: "failed",
      latencyMs,
      errorCode: error.code?.toString() || "UNKNOWN",
      errorMessage: error.message || "An unexpected error occurred during Firestore handshake",
      timestamp,
    }, {
      status: 500,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}
