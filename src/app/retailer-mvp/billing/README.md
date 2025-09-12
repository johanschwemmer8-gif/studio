# Subscriptions & Billing Firestore Schema

This document outlines the Firestore schema for managing retailer subscriptions and their invoice history.

## `subscriptions` Collection

This is a top-level collection where each document represents a single retailer's subscription.

-   **Collection Path**: `/subscriptions`
-   **Document ID**: Can be the `retailerId` for easy lookup.

### Document Fields

| Field Name         | Type      | Description                                                                 |
| :----------------- | :-------- | :-------------------------------------------------------------------------- |
| `retailerId`       | `string`  | The unique ID of the retailer. (Indexed)                                    |
| `planId`           | `string`  | The identifier for the subscription plan (e.g., 'pro_plan', 'basic_plan').  |
| `status`           | `string`  | The current status of the subscription (e.g., 'active', 'trial', 'canceled').|
| `nextBillingDate`  | `timestamp`| The timestamp for the next scheduled billing date.                          |
| `paymentMethod`    | `map`     | An object containing details of the payment method.                         |
| `stripeCustomerId` | `string`  | The customer ID from a payment provider like Stripe.                        |

### Sample Document (`/subscriptions/{retailerId}`)

```json
{
  "retailerId": "ret_123xyz",
  "planId": "pro_plan",
  "status": "active",
  "nextBillingDate": "2025-06-01T00:00:00Z",
  "paymentMethod": {
    "cardType": "Visa",
    "last4": "4242"
  },
  "stripeCustomerId": "cus_ABC123XYZ"
}
```

---

## `invoices` Subcollection

This is a subcollection under each subscription document, containing a history of all invoices for that retailer.

-   **Collection Path**: `/subscriptions/{subscriptionId}/invoices`
-   **Document ID**: Auto-generated unique ID for each invoice.

### Document Fields

| Field Name  | Type      | Description                                                    |
| :---------- | :-------- | :------------------------------------------------------------- |
| `invoiceId` | `string`  | A user-friendly invoice identifier (e.g., 'INV-2024-005').     |
| `date`      | `timestamp`| The date the invoice was issued.                               |
| `amount`    | `number`  | The total amount of the invoice.                               |
| `status`    | `string`  | The status of the invoice (e.g., 'paid', 'pending', 'failed'). |
| `pdfUrl`    | `string`  | A URL to the downloadable PDF version of the invoice.          |

### Sample Document (`/subscriptions/{subscriptionId}/invoices/{invoiceId}`)

```json
{
  "invoiceId": "INV-2024-005",
  "date": "2024-05-01T00:00:00Z",
  "amount": 1250.00,
  "status": "paid",
  "pdfUrl": "https://storage.googleapis.com/your-bucket/invoices/ret_123xyz/INV-2024-005.pdf"
}
```
