# In-Store Configurations Firestore Schema

This document outlines the Firestore schema for managing dynamic content on in-store display screens.

## `inStoreConfigs` Collection

-   **Collection Path**: `/inStoreConfigs`
-   **Document ID**: Auto-generated unique ID.

Each document in this collection represents a single content configuration that can be assigned to one or more displays.

### Document Fields

| Field Name      | Type      | Description                                                                 |
| :-------------- | :-------- | :-------------------------------------------------------------------------- |
| `retailerId`    | `string`  | The ID of the retailer this configuration belongs to. (Indexed)             |
| `configId`      | `string`  | A unique ID for this configuration.                                         |
| `configName`    | `string`  | A user-friendly name for the configuration (e.g., 'Summer Sale Welcome').   |
| `contentSlot`   | `map`     | An object containing the configuration for a specific content slot.         |
| `contentSlot.type` | `string` | The type of content, e.g., 'dynamic_ai_prompt', 'static_image'.            |
| `contentSlot.promptText` | `string` | The prompt for an AI-driven display.                                      |
| `contentSlot.imageUrl` | `string` | A URL to a static image to display.                                       |
| `isActive`      | `boolean` | A flag to quickly activate or deactivate this content across all displays.  |
| `lastUpdated`   | `timestamp`| The timestamp of when this configuration was last saved.                      |

### Sample Document

Here is an example of what a document in the `inStoreConfigs` collection might look like:

```json
{
  "retailerId": "ret_123abc",
  "configId": "config_1716386400000",
  "configName": "Summer Sale Welcome",
  "contentSlot": {
    "type": "dynamic_ai_prompt",
    "promptText": "Show a vibrant summer theme and highlight beachwear products."
  },
  "isActive": true,
  "lastUpdated": "2024-05-22T14:00:00Z"
}
```

```json
{
  "retailerId": "ret_123abc",
  "configId": "config_1716386400001",
  "configName": "Winter Boots Poster",
  "contentSlot": {
    "type": "static_image",
    "imageUrl": "https://example.com/images/winter-boots.jpg"
  },
  "isActive": false,
  "lastUpdated": "2024-05-21T11:00:00Z"
}
```
