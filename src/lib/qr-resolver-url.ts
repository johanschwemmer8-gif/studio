/**
 * Canonical QR resolver URL construction.
 *
 * Production QR identities must resolve through an explicitly configured
 * public HTTPS origin. Development fallbacks such as localhost must never
 * be persisted into a PRODUCTION QR identity.
 */

export function buildProductionQrTrackingUrl(
  resolverBaseUrl: string | undefined,
  qrCodeId: string
): string {
  if (!resolverBaseUrl?.trim()) {
    throw new Error(
      'QR_CONFIGURATION_ERROR: QR_RESOLVER_BASE_URL is required for production QR creation.'
    );
  }

  let url: URL;

  try {
    url = new URL(resolverBaseUrl);
  } catch {
    throw new Error(
      'QR_CONFIGURATION_ERROR: QR_RESOLVER_BASE_URL must be a valid URL.'
    );
  }

  if (url.protocol !== 'https:') {
    throw new Error(
      'QR_CONFIGURATION_ERROR: Production QR resolver must use HTTPS.'
    );
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  ) {
    throw new Error(
      'QR_CONFIGURATION_ERROR: Production QR resolver must use a public host.'
    );
  }

  if (
    url.pathname !== '/' ||
    url.search !== '' ||
    url.hash !== '' ||
    url.username !== '' ||
    url.password !== ''
  ) {
    throw new Error(
      'QR_CONFIGURATION_ERROR: QR_RESOLVER_BASE_URL must be an origin without path, query, credentials, or fragment.'
    );
  }

  if (!qrCodeId.trim()) {
    throw new Error(
      'QR_CONFIGURATION_ERROR: qrCodeId is required to construct a tracking URL.'
    );
  }

  return `${url.origin}/resolve/${encodeURIComponent(qrCodeId)}`;
}
