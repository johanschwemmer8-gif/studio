# User Management Firestore Schema

This document outlines the Firestore schema for managing users associated with retailers on the iNteract-AOE platform.

## `users` Collection

-   **Collection Path**: `/users`
-   **Document ID**: The user's unique ID (`uid`) from Firebase Authentication.

Each document in this collection represents a single user with access to the platform.

### Document Fields

| Field Name   | Type      | Description                                                                 |
| :----------- | :-------- | :-------------------------------------------------------------------------- |
| `uid`        | `string`  | The user's unique ID from Firebase Authentication. (This is the document ID).|
| `retailerId` | `string`  | The ID of the retailer the user belongs to. (Indexed)                       |
| `name`       | `string`  | The user's full name.                                                       |
| `email`      | `string`  | The user's email address. Used for login.                                   |
| `role`       | `string`  | The user's assigned role (e.g., 'retailerAdmin', 'storeManager', 'analyst').|
| `isActive`   | `boolean` | A flag to indicate if the user's account is active or disabled.             |
| `lastLogin`  | `timestamp`| The timestamp of the user's last login.                                     |

### Sample Document

Here is an example of what a document in the `users` collection might look like:

```json
// Document ID: UidF3r0mF1r3bA53
{
  "uid": "UidF3r0mF1r3bA53",
  "retailerId": "ret_123abc",
  "name": "Jane Doe",
  "email": "jane.doe@exampleretail.com",
  "role": "retailerAdmin",
  "isActive": true,
  "lastLogin": "2024-05-21T10:00:00Z"
}
```
