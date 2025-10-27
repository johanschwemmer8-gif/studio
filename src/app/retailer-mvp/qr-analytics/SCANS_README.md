# Scans Collection Firestore Schema

This document outlines the Firestore schema for logging every individual QR code scan event.

## `scans` Collection

-   **Collection Path**: `/scanEvents` (Note: collection name updated from `scans` to `scanEvents` for clarity)
-   **Document ID**: Auto-generated unique ID (`eventId`).

Each document is an immutable record of a single scan event. This collection is optimized for writes and subsequent analysis.

### Document Fields

| Field Name         | Type       | Description                                                               |
| :----------------- | :--------- | :------------------------------------------------------------------------ |
| `eventId`          | `string`   | The unique ID for the scan event (this is the document ID).               |
| `qrCodeId`         | `string`   | A reference to the `qrCodeId` in the `qrcodes` collection.                |
| `requestId`        | `string`   | The ID of the bulk request this QR code belongs to (if applicable).       |
| `campaignId`       | `string`   | The campaign associated with the scan.                                    |
| `retailerId`       | `string`   | A reference to the `retailerId` in the `retailers` collection.            |
| `timestamp`        | `timestamp`| The exact time the scan occurred.                                         |
| `userAgent`        | `string`   | The user agent of the scanning device.                                    |
| `ip`               | `string`   | The IP address of the scanner.                                            |
| `referrer`         | `string`   | The referrer URL from the request headers (if available).                 |

### Sample Document

```json
// Document ID: scan_xyz789
{
  "eventId": "scan_xyz789",
  "qrCodeId": "qr_abc123",
  "requestId": "req_12345",
  "campaignId": "summer-sale-2024",
  "retailerId": "retailer_abc123",
  "timestamp": "2024-05-28T14:00:00Z",
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1...)",
  "ip": "192.168.1.100",
  "referrer": "https://www.google.com/"
}
```
