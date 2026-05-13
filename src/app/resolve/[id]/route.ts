
import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { parseGS1 } from '@/lib/gs1-parser';

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * ARCHITECTURAL FIREWALL:
 * This route is the strictly stateless gateway for GS1-aligned Identity Resolution.
 * 
 * RESPONSIBILITIES:
 * 1. Parse incoming GS1 identifier (Digital Link, AIDC, or GTIN).
 * 2. Validate GTIN-14 canonical format.
 * 3. Initialize a neutral iNteract Intelligence Session.
 * 4. Log initial scan event (atomic behavioral node).
 * 5. Redirect to the Experience Layer.
 * 
 * PROHIBITED EVOLUTIONS (NON-NEGOTIABLE):
 * - DO NOT add user-specific personalization logic.
 * - DO NOT add A/B testing or experimental variants.
 * - DO NOT fetch AI recommendations or trigger interaction flows.
 * - DO NOT perform any analytics aggregation.
 * 
 * Reason: Any deviation transforms this stateless bridge into a stateful 
 * intelligence layer, violating the separation of Global Standards and Proprietary Logic.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const db = admin.firestore();

  // 1. Stateless Identity Resolution
  const identity = parseGS1(id);
  if (!identity) {
    return NextResponse.redirect(new URL('/error?code=invalid_identity', request.url));
  }

  const { gtin, batchNumber, serialNumber } = identity;

  try {
    // 2. Initialize iNteract Intelligence Session (Anchors all future behavior)
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

    // 3. Log Atomic Behavioral Event (Scan)
    // Rule: GTIN is a dimension, not the primary key for the event stream.
    batch.set(db.collection('events').doc(eventId), {
        eventId,
        sessionId,
        gtin,
        eventType: 'scan',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
            batchNumber,
            serialNumber,
            source: "IDENTITY_RESOLVER"
        }
    });

    await batch.commit();

    // 4. Hand-off to Experience Layer (Product View)
    let destination = `/p/${gtin}?session=${sessionId}`;
    if (batchNumber) destination += `&batch=${batchNumber}`;
    if (serialNumber) destination += `&serial=${serialNumber}`;

    return NextResponse.redirect(new URL(destination, request.url), 302);

  } catch (error) {
    console.error(`Identity hand-off failure for ${gtin}:`, error);
    return NextResponse.redirect(new URL('/error?code=500', request.url));
  }
}
