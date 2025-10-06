# Scans Collection Firestore Schema

This document outlines the Firestore schema for logging every individual QR code scan event.

## `scans` Collection

-   **Collection Path**: `/scans`
-   **Document ID**: Auto-generated unique ID (`scanId`).

Each document is an immutable record of a single scan event. This collection is optimized for writes and subsequent analysis.

### Document Fields

| Field Name         | Type       | Description                                                               |
| :----------------- | :--------- | :------------------------------------------------------------------------ |
| `scanId`           | `string`   | The unique ID for the scan event (this is the document ID).               |
| `qrCodeId`         | `string`   | A reference to the `qrCodeId` in the `qrCodes` collection.                |
| `storeId`          | `string`   | A reference to the `storeId` in the `stores` collection.                  |
| `retailerId`       | `string`   | A reference to the `retailerId` in the `retailers` collection.            |
| `customerId`       | `string`   | (Optional) An anonymous identifier for the customer, if available.        |
| `timestamp`        | `timestamp`| The exact time the scan occurred.                                         |
| `location`         | `geopoint` | The geographical coordinates where the scan happened.                     |
| `deviceInfo`       | `map`      | An object containing information about the scanning device (e.g., user agent). |
| `aiInteraction`    | `map`      | A summary of the AI interaction that followed the scan.                   |
| `conversionResult` | `boolean`  | A flag indicating if the scan led to a desired conversion event.          |
| `basketValue`      | `number`   | The value of the customer's basket if a purchase was made post-scan.      |

### Sample Document

```json
// Document ID: scan_xyz789
{
  "scanId": "scan_xyz789",
  "qrCodeId": "qr_abc123",
  "storeId": "store_xyz789",
  "retailerId": "retailer_abc123",
  "customerId": "anon_customer_456",
  "timestamp": "2024-05-28T14:00:00Z",
  "location": {
    "latitude": -26.107567,
    "longitude": 28.056702
  },
  "deviceInfo": {
    "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1...)"
  },
  "aiInteraction": {
    "interactionId": "interaction_123",
    "messagesCount": 3,
    "userClickedContinue": true
  },
  "conversionResult": true,
  "basketValue": 25.00
}
```