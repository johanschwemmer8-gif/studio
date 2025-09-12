
import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { qrCodeId: string } }
) {
  const { qrCodeId } = params;
  const db = admin.firestore();

  if (!qrCodeId) {
    return NextResponse.redirect(new URL('/error?code=400', request.url));
  }
  
  const qrRef = db.collection('qrcodes').doc(qrCodeId);

  try {
    // We still log the scan here, but now we redirect to the interaction page
    // instead of the final destination. The interaction page will handle the final redirect.
    const qrData = await db.runTransaction(async (transaction) => {
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

            const scanEventRef = db.collection('scanEvents').doc();
            transaction.set(scanEventRef, {
                qrCodeId,
                retailerId: externalData.retailerId,
                campaignId: externalData.campaignId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                userAgent: request.headers.get('user-agent') || '',
                ip: request.ip || '',
                referrer: request.headers.get('referer') || '',
            });
            
            // For external codes, we still redirect directly as they might not have AI profiles.
            return { redirectUrl: externalData.originalUrl, immediate: true };
        }
        
        const data = qrDoc.data()!;
        
        if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
            return { redirectUrl: '/error?code=expired', immediate: true };
        }
        
        transaction.update(qrRef, {
            scanCount: admin.firestore.FieldValue.increment(1)
        });
        
        const scanEventRef = db.collection('scanEvents').doc();
        transaction.set(scanEventRef, {
            qrCodeId: data.qrCodeId,
            retailerId: data.retailerId,
            campaignId: data.campaignId,
            requestId: data.requestId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userAgent: request.headers.get('user-agent') || '',
            ip: request.ip || '',
            referrer: request.headers.get('referer') || '',
        });
        
        // If an AI profile is attached, redirect to the interaction screen.
        // Otherwise, redirect directly to the product page.
        if (data.aiProfileId) {
             return { redirectUrl: `/scan/${qrCodeId}`, immediate: false };
        } else {
             return { redirectUrl: data.redirectUrl, immediate: true };
        }
    });

    if (qrData === null) {
        return NextResponse.redirect(new URL('/error?code=404', request.url));
    }

    // For immediate redirects, we use the original URL.
    // For interaction screen, we use the app's own URL structure.
    const redirectTarget = qrData.immediate ? new URL(qrData.redirectUrl) : new URL(qrData.redirectUrl, request.url);

    return NextResponse.redirect(redirectTarget, 302);

  } catch (error) {
    console.error(`Transaction failed for qrCodeId ${qrCodeId}:`, error);
    return NextResponse.redirect(new URL('/error?code=500', request.url));
  }
}
