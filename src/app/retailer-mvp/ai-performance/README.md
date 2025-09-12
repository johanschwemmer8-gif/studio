# AI Conversation Logs Firestore Schema

This document outlines the Firestore schema for logging AI interactions to monitor performance and analyze conversations.

## `aiConversations` Collection

-   **Collection Path**: `/aiConversations`
-   **Document ID**: Auto-generated unique ID for each conversation session.

Each document represents a full conversation between a customer and the AI assistant.

### Document Fields

| Field Name           | Type        | Description                                                                                             |
| :------------------- | :---------- | :------------------------------------------------------------------------------------------------------ |
| `conversationId`     | `string`    | The unique ID of the conversation (same as document ID).                                                |
| `retailerId`         | `string`    | The ID of the retailer where the conversation occurred. (Indexed)                                       |
| `productId`          | `string`    | The ID of the product the conversation was about.                                                       |
| `startTime`          | `timestamp` | The timestamp when the conversation was initiated.                                                      |
| `endTime`            | `timestamp` | The timestamp when the conversation was concluded.                                                      |
| `customerSatisfaction`| `number`    | A rating (e.g., 1-5) provided by the customer at the end of the conversation.                           |
| `outcome`            | `string`    | The result of the conversation (e.g., 'Resolved', 'Escalated', 'Abandoned').                            |
| `transcript`         | `array`     | An array of message objects, each containing the role ('user' or 'ai') and the content of the message.  |
| `upsellAchieved`     | `boolean`   | A flag indicating whether a recommended product was added to the cart or purchased.                     |
| `aiModel`            | `string`    | The name of the AI model used for the conversation (e.g., 'Gemini 2.5 Flash').                           |
| `totalTokens`        | `number`    | The total number of tokens used in the conversation for cost tracking.                                  |

### Sample Document

Here is an example of what a document in the `aiConversations` collection might look like:

```json
{
  "conversationId": "convo_xyz123",
  "retailerId": "ret_abc456",
  "productId": "prod_789",
  "startTime": "2024-05-23T14:30:00Z",
  "endTime": "2024-05-23T14:32:15Z",
  "customerSatisfaction": 5,
  "outcome": "Resolved",
  "transcript": [
    { "role": "ai", "content": "Hi there! How can I help you today?" },
    { "role": "user", "content": "Is this jacket waterproof?" },
    { "role": "ai", "content": "Yes, it is fully waterproof with sealed seams, perfect for rainy weather!" }
  ],
  "upsellAchieved": false,
  "aiModel": "Gemini 2.5 Flash",
  "totalTokens": 128
}
```
