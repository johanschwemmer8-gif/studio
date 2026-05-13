
import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { parseGS1 } from '@/lib/gs1-parser';

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * resolveGS1()
 * The primary entry point for all platform scans.
 * Resolves identity via GTIN and handles infrastructure logging.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { qrCodeId: string } }
) {
  const { qrCodeId } = params;
  const db = admin.firestore();

  // Parse Identity
  const identity = parseGS1(qrCodeId);
  if (!identity) {
    return NextResponse.redirect(new URL('/error?code=invalid_gs1', request.url));
  }

  const { gtin, batchNumber, serialNumber } = identity;

  try {
    // 1. Fetch Product via GTIN (Primary Key)
    const productRef = db.collection('products').doc(gtin);
    const productDoc = await productRef.get();

    // 2. Initialize Session & Log Behavioural Event
    const sessionId = `sess_${Date.now()}`;
    const interactionId = `scan_${Date.now()}`;
    
    const batch = db.batch();
    
    // Log Session
    batch.set(db.collection('sessions').doc(sessionId), {
        sessionId,
        startTime: admin.firestore.FieldValue.serverTimestamp(),
        entryGtin: gtin,
        batchNumber,
        serialNumber,
        source: "GS1"
    });

    // Log Interaction
    batch.set(db.collection('product_interactions').doc(interactionId), {
        interactionId,
        sessionId,
        gtin,
        batchNumber,
        serialNumber,
        type: 'scan',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userAgent: request.headers.get('user-agent') || '',
        ip: request.ip || '',
        source: "GS1"
    });

    await batch.commit();

    // 3. Redirect to Product Experience Layer
    // Standard Route: /p/{gtin}
    let destination = `/p/${gtin}?session=${sessionId}`;
    if (batchNumber) destination += `&batch=${batchNumber}`;
    if (serialNumber) destination += `&serial=${serialNumber}`;

    return NextResponse.redirect(new URL(destination, request.url), 302);

  } catch (error) {
    console.error(`GS1 Resolution Failed for ${gtin}:`, error);
    return NextResponse.redirect(new URL('/error?code=500', request.url));
  }
}
