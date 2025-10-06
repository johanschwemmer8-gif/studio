# Stores Collection Firestore Schema

This document outlines the Firestore schema for managing individual retail store locations.

## `stores` Collection

-   **Collection Path**: `/stores`
-   **Document ID**: Auto-generated unique ID (`storeId`).

Each document in this collection represents a single physical store location belonging to a retailer.

### Document Fields

| Field Name       | Type      | Description                                                                 |
| :--------------- | :-------- | :-------------------------------------------------------------------------- |
| `storeId`        | `string`  | The unique ID for the store (this is the document ID).                      |
| `retailerId`     | `string`  | A reference to the `retailerId` in the `retailers` collection.              |
| `storeName`      | `string`  | The name of the store (e.g., 'Sandton City Branch').                        |
| `location`       | `geopoint`| The geographical coordinates of the store for mapping and location services.|
| `address`        | `map`     | An object containing the physical address of the store.                     |
| `storeManager`   | `string`  | A reference to the `userId` in the `users` collection for the store manager.|
| `status`         | `string`  | The operational status of the store (e.g., 'active', 'inactive').         |
| `qrCodesCount`   | `number`  | An aggregate count of QR codes assigned to this store.                      |
| `monthlyScans`   | `number`  | An aggregate count of total scans per month for this store.                 |
| `createdAt`      | `timestamp`| The timestamp of when the store was added to the platform.                  |

### Sample Document

```json
// Document ID: store_xyz789
{
  "storeId": "store_xyz789",
  "retailerId": "retailer_abc123",
  "storeName": "Sandton City Branch",
  "location": {
    "latitude": -26.107567,
    "longitude": 28.056702
  },
  "address": {
    "street": "83 Rivonia Rd",
    "city": "Sandton",
    "postalCode": "2196",
    "country": "ZA"
  },
  "storeManager": "user_manager_456",
  "status": "active",
  "qrCodesCount": 520,
  "monthlyScans": 12500,
  "createdAt": "2024-02-10T11:00:00Z"
}
```