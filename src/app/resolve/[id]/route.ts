
import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { parseGS1 } from '@/lib/gs1-parser';

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Identity Resolver Route
 * Responsibilities:
 * 1. Parse incoming GS1 identifier (Digital Link, AIDC, or GTIN)
 * 2. Validate GTIN-14 canonical format
 * 3. Initialize iNteract Intelligence Session
 * 4. Log initial scan event (session-anchored)
 * 5. Redirect to Experience Layer
 * 
 * NOTE: This route is part of the stateless GS1 Identity Layer.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const db = admin.firestore();

  // 1. Resolve Identity via GS1-aligned parser
  const identity = parseGS1(id);
  if (!identity) {
    return NextResponse.redirect(new URL('/error?code=invalid_identity', request.url));
  }

  const { gtin, batchNumber, serialNumber } = identity;

  try {
    // 2. Initialize iNteract Intelligence Session
    const sessionId = `sess_${Date.now()}`;
    const eventId = `ev_${Date.now()}`;
    
    const batch = db.batch();
    
    // Create Session
    batch.set(db.collection('sessions').doc(sessionId), {
        sessionId,
        startTime: admin.firestore.FieldValue.serverTimestamp(),
        entryGtin: gtin,
        batchNumber,
        serialNumber,
        userAgent: request.headers.get('user-agent') || '',
        ip: request.ip || ''
    });

    // Log initial behavioural event (Scan)
    // Anchored to sessionId, GTIN is a dimension.
    batch.set(db.collection('events').doc(eventId), {
        eventId,
        sessionId,
        gtin,
        eventType: 'scan',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
            batchNumber,
            serialNumber,
            source: "GS1_RESOLVER"
        }
    });

    await batch.commit();

    // 3. Redirect to Experience Layer (Product View)
    let destination = `/p/${gtin}?session=${sessionId}`;
    if (batchNumber) destination += `&batch=${batchNumber}`;
    if (serialNumber) destination += `&serial=${serialNumber}`;

    return NextResponse.redirect(new URL(destination, request.url), 302);

  } catch (error) {
    console.error(`Identity Resolution Friction for ${gtin}:`, error);
    return NextResponse.redirect(new URL('/error?code=500', request.url));
  }
}
