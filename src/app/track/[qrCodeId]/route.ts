
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { qrCodeId: string } }
) {
  const { qrCodeId } = params;

  if (!db) {
    console.error('Firestore not initialized');
    return NextResponse.redirect(new URL('/error?code=500', request.url));
  }

  if (!qrCodeId) {
    return NextResponse.redirect(new URL('/error?code=400', request.url));
  }
  
  const qrRef = db.collection('qrcodes').doc(qrCodeId);

  try {
    const redirectUrl = await db.runTransaction(async (transaction) => {
        const qrDoc = await transaction.get(qrRef);

        if (!qrDoc.exists) {
            // Also check external QR codes as a fallback
            const externalQrRef = db.collection('externalQRCodes').doc(qrCodeId);
            const externalQrDoc = await transaction.get(externalQrRef);
            if (!externalQrDoc.exists) {
                return null; // Not found
            }
            
            const externalData = externalQrDoc.data()!;
             transaction.update(externalQrRef, {
                scanCount: admin.firestore.FieldValue.increment(1)
            });

            // Log scan event for external QR
            const scanEventRef = db.collection('scanEvents').doc();
            transaction.set(scanEventRef, {
                qrCodeId,
                retailerId: externalData.retailerId,
                campaignId: externalData.campaignId,
                requestId: externalData.batchId, // Using batchId as requestId
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                userAgent: request.headers.get('user-agent') || '',
                ip: request.ip || '',
                referrer: request.headers.get('referer') || '',
            });
            
            return externalData.originalUrl;
        }
        
        const qrData = qrDoc.data()!;
        
        // Check for expiration
        if (qrData.expiresAt && qrData.expiresAt.toDate() < new Date()) {
            return '/error?code=expired'; // Special URL for expired codes
        }
        
        // 1. Increment scanCount on the qrcode document
        transaction.update(qrRef, {
            scanCount: admin.firestore.FieldValue.increment(1)
        });
        
        // 2. Write a new document to scanEvents
        const scanEventRef = db.collection('scanEvents').doc();
        transaction.set(scanEventRef, {
            qrCodeId: qrData.qrCodeId,
            retailerId: qrData.retailerId,
            campaignId: qrData.campaignId,
            requestId: qrData.requestId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userAgent: request.headers.get('user-agent') || '',
            ip: request.ip || '',
            referrer: request.headers.get('referer') || '',
            details: {},
        });
        
        return qrData.redirectUrl;
    });

    if (redirectUrl === null) {
        return NextResponse.redirect(new URL('/error?code=404', request.url));
    }
    if (redirectUrl === '/error?code=expired') {
        return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    return NextResponse.redirect(new URL(redirectUrl), 302);

  } catch (error) {
    console.error(`Transaction failed for qrCodeId ${qrCodeId}:`, error);
    // Redirect to a generic error page
    return NextResponse.redirect(new URL('/error?code=500', request.url));
  }
}
