# aiInteractions Collection Firestore Schema

This document outlines the Firestore schema for logging detailed AI conversation transcripts for performance analysis and monitoring.

## `aiInteractions` Collection

-   **Collection Path**: `/aiInteractions`
-   **Document ID**: Auto-generated unique ID (`interactionId`).

Each document contains the full history and outcome of a single AI-customer conversation.

### Document Fields

| Field Name             | Type      | Description                                                                       |
| :--------------------- | :-------- | :-------------------------------------------------------------------------------- |
| `interactionId`        | `string`  | The unique ID for the interaction (this is the document ID).                      |
| `scanId`               | `string`  | A reference to the `scanId` in the `scans` collection that triggered this interaction. |
| `conversationHistory`  | `array`   | An array of message objects, each with a `role` ('user' or 'model') and `content`.|
| `recommendations`      | `array`   | An array of product recommendations that were shown to the user.                  |
| `sentiment`            | `string`  | The overall sentiment of the conversation (e.g., 'Positive', 'Neutral', 'Negative').|
| `customerSatisfaction` | `number`  | A customer-provided rating for the interaction, typically on a scale of 1-5.      |
| `conversionOutcome`    | `boolean` | A flag indicating if the interaction resulted in a successful conversion.         |
| `duration`             | `number`  | The total duration of the interaction in seconds.                                 |

### Sample Document

```json
// Document ID: interaction_123
{
  "interactionId": "interaction_123",
  "scanId": "scan_xyz789",
  "conversationHistory": [
    { "role": "model", "content": "Hello! How can I help with this product?" },
    { "role": "user", "content": "Is it waterproof?" },
    { "role": "model", "content": "Yes, it is fully waterproof and ideal for outdoor activities." }
  ],
  "recommendations": [
    { "productId": "SKU999-HAT", "reason": "Pairs well with the jacket." }
  ],
  "sentiment": "Positive",
  "customerSatisfaction": 5,
  "conversionOutcome": true,
  "duration": 45
}
```