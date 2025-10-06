# qrCodes Collection Firestore Schema

This document outlines the Firestore schema for managing individual QR codes generated on the platform.

## `qrCodes` Collection

-   **Collection Path**: `/qrCodes`
-   **Document ID**: Auto-generated unique ID (`qrCodeId`).

Each document represents a single, unique QR code.

### Document Fields

| Field Name     | Type      | Description                                                                 |
| :------------- | :-------- | :-------------------------------------------------------------------------- |
| `qrCodeId`     | `string`  | The unique ID for the QR code (this is the document ID).                      |
| `retailerId`   | `string`  | A reference to the `retailerId` in the `retailers` collection.              |
| `storeId`      | `string`  | A reference to the `storeId` in the `stores` collection.                      |
| `productId`    | `string`  | The retailer's internal product identifier (e.g., SKU).                     |
| `productName`  | `string`  | The name of the product associated with the code.                             |
| `category`     | `string`  | The product category.                                                       |
| `price`        | `number`  | The price of the product.                                                   |
| `qrImageUrl`   | `string`  | The URL to the generated QR code image file (e.g., in Google Cloud Storage).|
| `qrData`       | `map`     | An object containing the raw data encoded in the QR code, including the target URL. |
| `scansCount`   | `number`  | A counter for the total number of times this code has been scanned.           |
| `lastScanned`  | `timestamp`| The timestamp of the most recent scan.                                      |
| `aiConfig`     | `map`     | An object containing configuration details for the AI interaction on scan.  |
| `status`       | `string`  | The status of the QR code (e.g., 'active', 'inactive').                     |
| `createdAt`    | `timestamp`| The timestamp of when the QR code was created.                                |

### Sample Document

```json
// Document ID: qr_abc123
{
  "qrCodeId": "qr_abc123",
  "retailerId": "retailer_abc123",
  "storeId": "store_xyz789",
  "productId": "SKU500-BTL",
  "productName": "Eco-Friendly Water Bottle",
  "category": "Lifestyle",
  "price": 25.00,
  "qrImageUrl": "https://storage.googleapis.com/your-bucket/qrcodes/qr_abc123.png",
  "qrData": {
    "url": "https://your-app.com/track/qr_abc123"
  },
  "scansCount": 150,
  "lastScanned": "2024-05-28T14:00:00Z",
  "aiConfig": {
    "profileId": "ai_profile_summer",
    "welcomeMessage": "Stay hydrated this summer!"
  },
  "status": "active",
  "createdAt": "2024-03-01T09:00:00Z"
}
```