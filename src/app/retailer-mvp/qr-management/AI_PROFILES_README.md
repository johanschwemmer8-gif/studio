# AI Profiles Feature Firestore Schema

This document outlines the Firestore schema for the `ai_profiles` feature and how it links to QR codes.

## Firestore Collections

### 1. `ai_profiles`

This collection stores the definitions for different AI personalities and behaviors that can be assigned to QR codes. Each document represents a unique profile configured by the retailer.

-   **Collection Path**: `/ai_profiles`
-   **Document ID**: Auto-generated unique ID.

**Document Fields:**

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `ai_profile_id` | `string` | The unique ID of the profile (same as document ID). |
| `retailerId` | `string` | The ID of the retailer who owns this profile. (Indexed) |
| `profileName` | `string` | A user-friendly name for the profile (e.g., "Summer Sale Helper"). |
| `personality` | `string` | The tone of voice for the AI. (e.g., "Friendly", "Expert", "Humorous"). |
| `intent` | `array` | An array of strings defining the AI's goals. (e.g., `["Upsell", "Info-only"]`). |
| `constraints` | `map` | A map of rules for the AI, such as `{ max_suggestions: 3, banned_words: ["cheap", "tacky"] }`. |
| `integrationFlags`| `map` | Boolean flags to enable/disable integrations, like `{ use_ecommerce_feed: true, use_loyalty_api: false }`. |
| `samplePrompts` | `array` | An array of example interactions to guide the AI's responses. |
| `createdAt` | `timestamp` | Timestamp when the profile was created. |
| `updatedAt` | `timestamp` | Timestamp when the profile was last updated. |

### 2. Linking to `qr_codes`

To activate an AI behavior for a specific QR code, the `ai_profile_id` from an `ai_profiles` document is stored in the corresponding `qr_codes` document.

-   **Collection Path**: `/qr_codes/{qrId}`

**Linking Field in `qr_codes`:**

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `ai_profile_id` | `string` | The ID of the AI profile to use when this QR code is scanned. If null or empty, no AI interaction is triggered. |

When a QR code is scanned, the backend system will:
1.  Fetch the `qr_codes` document using the scanned `qrId`.
2.  Check for the presence of an `ai_profile_id`.
3.  If it exists, fetch the corresponding document from the `ai_profiles` collection.
4.  Use the profile's configuration (personality, intent, etc.) to construct a prompt for the Generative AI model.
5.  Return the AI-generated response to the customer's device.
