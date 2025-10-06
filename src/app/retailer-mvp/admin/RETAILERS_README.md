# Retailers Collection Firestore Schema

This document outlines the Firestore schema for storing information about each retailer on the platform.

## `retailers` Collection

-   **Collection Path**: `/retailers`
-   **Document ID**: Auto-generated unique ID (`retailerId`).

Each document in this collection represents a single retail company or organization.

### Document Fields

| Field Name           | Type      | Description                                                                     |
| :------------------- | :-------- | :------------------------------------------------------------------------------ |
| `retailerId`         | `string`  | The unique ID for the retailer (this is the document ID).                       |
| `companyName`        | `string`  | The official name of the retail company.                                        |
| `contactPerson`      | `string`  | The name of the primary contact person at the company.                          |
| `email`              | `string`  | The primary contact email for the company.                                      |
| `phone`              | `string`  | The primary contact phone number for the company.                               |
| `address`            | `map`     | An object containing the company's head office address details.                 |
| `subscriptionPlan`   | `string`  | The current subscription plan (e.g., 'basic', 'professional', 'enterprise').    |
| `subscriptionStatus` | `string`  | The status of their subscription (e.g., 'active', 'inactive', 'trial').         |
| `totalStores`        | `number`  | An aggregate count of the total number of stores associated with this retailer. |
| `monthlyRevenue`     | `number`  | The monthly revenue of the retailer (for classification/analytics).             |
| `createdAt`          | `timestamp`| The timestamp of when the retailer was onboarded.                               |
| `billingInfo`        | `map`     | An object containing billing details, like payment method references.           |

### Sample Document

```json
// Document ID: retailer_abc123
{
  "retailerId": "retailer_abc123",
  "companyName": "Example Retail Group",
  "contactPerson": "John Doe",
  "email": "contact@exampleretail.com",
  "phone": "+1234567890",
  "address": {
    "street": "123 Market St",
    "city": "Metropolis",
    "postalCode": "10101",
    "country": "USA"
  },
  "subscriptionPlan": "professional",
  "subscriptionStatus": "active",
  "totalStores": 25,
  "monthlyRevenue": 500000,
  "createdAt": "2024-01-15T09:00:00Z",
  "billingInfo": {
    "stripeCustomerId": "cus_xyz789"
  }
}
```