# Displays Firestore Schema

This document outlines the Firestore schema for managing physical in-store display devices.

## `displays` Collection

-   **Collection Path**: `/displays`
-   **Document ID**: The `displayId`, which is the unique ID for the physical device.

Each document in this collection represents a single physical display screen.

### Document Fields

| Field Name        | Type      | Description                                                                 |
| :---------------- | :-------- | :-------------------------------------------------------------------------- |
| `displayId`       | `string`  | A unique ID for the physical device. This is the key identifier.            |
| `retailerId`      | `string`  | The ID of the retailer this device belongs to.                              |
| `storeId`         | `string`  | The ID of the store where this device is located.                           |
| `contentConfigId` | `string`  | A reference to the 'inStoreConfigs' document that this display should show. |
| `status`          | `string`  | The current status of the device (e.g., 'online', 'offline', 'error').      |
| `lastPing`        | `timestamp`| The timestamp of when the device last checked in with the server.           |

### Sample Document

Here is an example of what a document in the `displays` collection might look like:

```json
// Document ID: display_sandton_001
{
  "displayId": "display_sandton_001",
  "retailerId": "ret_123abc",
  "storeId": "sandton-city-01",
  "contentConfigId": "config_summer_sale",
  "status": "online",
  "lastPing": "2024-05-22T14:10:00Z"
}
```
