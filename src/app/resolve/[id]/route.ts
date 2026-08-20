import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { parseGS1 } from '@/lib/gs1-parser';

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * ARCHITECTURAL GATEWAY:
 * This route is the central resolution point for all iNteract Digital Links.
 * It prioritizes registered QR identifiers over stateless GS1 parsing to 
 * support both standard and demonstration/test identifiers.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = admin.firestore();

  try {
    // 1. Resolve Identity from QR Registry First (Handles registered standard and demo IDs)
    const qrDoc = await db.collection('qrcodes').doc(id).get();
    
    let gtin = '';
    let batchNumber = '';
    let serialNumber = '';
    let resolvedRetailerId = 'unknown';

    if (qrDoc.exists) {
        const qrData = qrDoc.data()!;
        gtin = qrData.gtin || '';
        resolvedRetailerId = qrData.retailerId || 'unknown';
    } else {
        // 2. Fallback to Stateless Identity Resolution (for direct GS1 strings)
        const identity = parseGS1(id);
        if (!identity) {
            console.error(`[Resolver] Invalid identity format: ${id}`);
            return NextResponse.redirect(new URL('/error?code=invalid_identity', request.url));
        }
        gtin = identity.gtin;
        batchNumber = identity.batchNumber || '';
        serialNumber = identity.serialNumber || '';
    }

    // 3. Initialize iNteract Intelligence Session (Anchors all future behavior)
    const sessionId = `sess_${Date.now()}`;
    const eventId = `ev_${Date.now()}`;
    
    const batch = db.batch();
    
    // Create Session with Retailer Anchor
    batch.set(db.collection('sessions').doc(sessionId), {
        sessionId,
        retailerId: resolvedRetailerId,
        shopperId: 'guest',
        startTime: admin.firestore.FieldValue.serverTimestamp(),
        entryGtin: gtin,
        entryQrId: id,
        batchNumber,
        serialNumber,
        userAgent: request.headers.get('user-agent') || '',
        ip: request.ip || ''
    });

    // 4. Log Atomic Behavioral Event (Scan)
    batch.set(db.collection('events').doc(eventId), {
        eventId,
        sessionId,
        gtin,
        retailerId: resolvedRetailerId,
        eventType: 'scan',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
            batchNumber,
            serialNumber,
            source: "IDENTITY_RESOLVER",
            qrId: id
        }
    });

    await batch.commit();

    // 5. Hand-off to Experience Layer (Product View)
    let destination = `/p/${gtin}?session=${sessionId}`;
    if (batchNumber) destination += `&batch=${batchNumber}`;
    if (serialNumber) destination += `&serial=${serialNumber}`;

    return NextResponse.redirect(new URL(destination, request.url), 302);

  } catch (error: any) {
    console.error(`[Resolver] Critical failure for ${id}:`, error.message);
    return NextResponse.redirect(new URL('/error?code=500', request.url));
  }
}
