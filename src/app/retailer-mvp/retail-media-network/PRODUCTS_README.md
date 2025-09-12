# `products` Collection Firestore Schema

This document outlines the Firestore schema for managing a retailer's product catalog.

## `products` Collection

-   **Collection Path**: `/products`
-   **Document ID**: Can be the product SKU for easy lookup or an auto-generated unique ID.

Each document in this collection represents a single product available from a retailer.

### Document Fields

| Field Name    | Type      | Description                                                    |
| :------------ | :-------- | :------------------------------------------------------------- |
| `retailerId`  | `string`  | The unique ID for the retailer this product belongs to. (Indexed) |
| `sku`         | `string`  | The product's Stock Keeping Unit or other unique identifier.   |
| `name`        | `string`  | The full name of the product.                                  |
| `description` | `string`  | A brief description of the product.                            |
| `price`       | `number`  | The current price of the product.                              |
| `imageUrl`    | `string`  | A public URL to an image of the product.                       |
| `isAvailable` | `boolean` | A flag indicating if the product is currently in stock.        |

### Sample Document

Here is an example of what a document in the `products` collection might look like:

```json
{
  "retailerId": "ret_123abc",
  "sku": "ECO-BOTTLE-GRN-500",
  "name": "Eco-Friendly Water Bottle",
  "description": "A 500ml reusable water bottle made from recycled materials.",
  "price": 29.99,
  "imageUrl": "https://example.com/images/eco-bottle-green.jpg",
  "isAvailable": true
}
```
