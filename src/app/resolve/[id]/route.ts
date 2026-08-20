import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { parseGS1 } from '@/lib/gs1-parser';

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * ARCHITECTURAL FIREWALL:
 * This route is the strictly stateless gateway for GS1-aligned Identity Resolution.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = admin.firestore();

  // 1. Stateless Identity Resolution
  const identity = parseGS1(id);
  if (!identity) {
    return NextResponse.redirect(new URL('/error?code=invalid_identity', request.url));
  }

  const { gtin, batchNumber, serialNumber } = identity;

  try {
    // 2. Resolve Retailer Identity from QR Registry
    // If scanning a direct GS1 link, we may need a global product lookup
    const qrDoc = await db.collection('qrcodes').doc(id).get();
    let resolvedRetailerId = 'unknown';
    
    if (qrDoc.exists) {
        resolvedRetailerId = qrDoc.data()?.retailerId || 'unknown';
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
            source: "IDENTITY_RESOLVER"
        }
    });

    await batch.commit();

    // 5. Hand-off to Experience Layer (Product View)
    let destination = `/p/${gtin}?session=${sessionId}`;
    if (batchNumber) destination += `&batch=${batchNumber}`;
    if (serialNumber) destination += `&serial=${serialNumber}`;

    return NextResponse.redirect(new URL(destination, request.url), 302);

  } catch (error) {
    console.error(`Identity hand-off failure for ${gtin}:`, error);
    return NextResponse.redirect(new URL('/error?code=500', request.url));
  }
}