
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
            
            return { redirectUrl: externalData.originalUrl };
        }
        
        const data = qrDoc.data()!;
        
        if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
            return { redirectUrl: '/error?code=expired' };
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

        // Fetch the campaign request to check for scan destination
        if (data.requestId) {
            const requestRef = db.collection('bulkQrRequests').doc(data.requestId);
            const requestDoc = await transaction.get(requestRef); // Read inside transaction
            if (requestDoc.exists) {
                const requestData = requestDoc.data()!;
                const scanDestination = requestData.options?.scanDestination;
                const landingPageUrl = requestData.options?.landingPageUrl;

                if (scanDestination === 'url' && landingPageUrl) {
                    return { redirectUrl: landingPageUrl }; // Redirect to custom URL
                }
            }
        }
        
        // Default behavior: redirect to the interaction screen.
        return { redirectUrl: `/scan/${qrCodeId}` };
    });

    if (qrData === null) {
        return NextResponse.redirect(new URL('/error?code=404', request.url));
    }

    return NextResponse.redirect(new URL(qrData.redirectUrl, request.url), 302);

  } catch (error) {
    console.error(`Transaction failed for qrCodeId ${qrCodeId}:`, error);
    return NextResponse.redirect(new URL('/error?code=500', request.url));
  }
}
