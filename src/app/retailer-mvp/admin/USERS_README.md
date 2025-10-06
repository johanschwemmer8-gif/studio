# Users Collection Firestore Schema

This document outlines the Firestore schema for managing users associated with retailers on the iNteract-AOE platform.

## `users` Collection

-   **Collection Path**: `/users`
-   **Document ID**: Auto-generated unique ID (`userId`).

Each document in this collection represents a single user with access to the platform.

### Document Fields

| Field Name      | Type      | Description                                                                    |
| :-------------- | :-------- | :----------------------------------------------------------------------------- |
| `userId`        | `string`  | The user's unique ID from Firebase Authentication (this is the document ID).   |
| `email`         | `string`  | The user's email address, used for login.                                      |
| `role`          | `string`  | The user's assigned role (e.g., 'admin', 'retailer', 'store_manager').         |
| `companyId`     | `string`  | A reference to the document ID in the `retailers` collection.                  |
| `createdAt`     | `timestamp`| The timestamp of when the user account was created.                            |
| `lastLogin`     | `timestamp`| The timestamp of the user's last login.                                        |
| `permissions`   | `array`   | An array of strings defining granular permissions (e.g., ['view_dashboard']).  |

### Sample Document

```json
// Document ID: auto-generated-uid
{
  "userId": "auto-generated-uid",
  "email": "jane.doe@exampleretail.com",
  "role": "retailer",
  "companyId": "retailer_abc123",
  "createdAt": "2024-05-28T10:00:00Z",
  "lastLogin": "2024-05-28T12:30:00Z",
  "permissions": [
    "view_dashboard",
    "manage_qr_codes"
  ]
}
```