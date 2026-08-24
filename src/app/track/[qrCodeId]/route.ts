
import { NextRequest, NextResponse } from 'next/server';

/**
 * LEGACY TRACKING REDIRECT
 * This route is maintained for backward compatibility with legacy QR codes.
 * It strictly redirects to the /resolve endpoint to maintain the GS1-aligned 
 * architecture and remove tracking terminology from identity resolution.
 * 
 * UPDATE: Updated for Next.js 15 async parameters.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrCodeId: string }> }
) {
  const { qrCodeId } = await params;
  
  // Rule: Permanent redirect to the architectural resolver.
  // We maintain the ID so the resolver can handle the stateless parsing.
  const destination = `/resolve/${qrCodeId}`;
  
  return NextResponse.redirect(new URL(destination, request.url), 301);
}
