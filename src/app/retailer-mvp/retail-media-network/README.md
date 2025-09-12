# Retail Media Network Firestore Schema

This document outlines the Firestore schema for managing ad campaigns within the Retail Media Network feature.

## `adCampaigns` Collection

-   **Collection Path**: `/adCampaigns`
-   **Document ID**: Auto-generated unique ID for each campaign.

### Document Fields

| Field Name          | Type        | Description                                                              |
| :------------------ | :---------- | :----------------------------------------------------------------------- |
| `campaignName`      | `string`    | A user-friendly name for the campaign (e.g., 'Summer Sale Campaign').      |
| `status`            | `string`    | The current status of the campaign (e.g., 'Running', 'Paused', 'Completed'). |
| `budget`            | `number`    | The total budget allocated for the campaign.                             |
| `startDate`         | `timestamp` | The date and time when the campaign is scheduled to start.               |
| `endDate`           | `timestamp` | The date and time when the campaign is scheduled to end.                 |
| `impressions`       | `number`    | The total number of times the ad has been displayed.                     |
| `clicks`            | `number`    | The total number of clicks the ad has received.                          |
| `conversions`       | `number`    | The total number of purchases attributed to this campaign.               |
| `totalRevenue`      | `number`    | The total revenue generated from conversions.                            |
| `sponsoredProducts` | `array`     | An array of product SKU strings that are being sponsored in this campaign. |

### Sample Document

Here is an example of what a document in the `adCampaigns` collection might look like:

```json
{
  "campaignName": "Summer Sale Campaign",
  "status": "Running",
  "budget": 500,
  "startDate": "2024-07-01T00:00:00Z",
  "endDate": "2024-07-31T23:59:59Z",
  "impressions": 10000,
  "clicks": 500,
  "conversions": 25,
  "totalRevenue": 1250.75,
  "sponsoredProducts": [
    "product_SKU_123",
    "product_SKU_456"
  ]
}
```
