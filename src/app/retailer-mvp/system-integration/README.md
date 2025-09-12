# Retailer Integrations Firestore Schema

This document outlines the Firestore schema for managing a retailer's external API integrations.

## `retailerIntegrations` Collection

This collection stores the status and references for each external service a retailer integrates with.

-   **Collection Path**: `/retailerIntegrations`
-   **Document ID**: The unique `retailerId`.

### Document Fields

The document for each retailer is a map where each key is the `serviceName` (e.g., 'Lightspeed POS', 'Salesforce Commerce Cloud').

| Field Name        | Type      | Description                                                                                                    |
| :---------------- | :-------- | :------------------------------------------------------------------------------------------------------------- |
| `[serviceName]`   | `map`     | An object containing the integration details for that specific service.                                        |
| `status`          | `string`  | The current status of the connection (e.g., 'connected', 'disconnected', 'error').                             |
| `secretName`      | `string`  | The full resource name of the secret in Google Cloud Secret Manager where the API key is stored.                 |
| `lastUpdated`     | `timestamp`| The timestamp of the last status update for this integration.                                                  |

### Sample Document

Here is an example of what a document for `retailer_123` in the `retailerIntegrations` collection might look like:

```json
// Document ID: retailer_123
{
  "Lightspeed POS": {
    "status": "connected",
    "secretName": "projects/your-gcp-project-id/secrets/api-key-retailer_123-lightspeed-pos",
    "lastUpdated": "2024-05-21T10:30:00Z"
  },
  "Salesforce Commerce Cloud": {
    "status": "disconnected",
    "secretName": "projects/your-gcp-project-id/secrets/api-key-retailer_123-salesforce-commerce-cloud",
    "lastUpdated": "2024-05-20T18:00:00Z"
  }
}
```
