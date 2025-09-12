# Scan Interaction Flow

This document outlines the user and data flow when a customer scans an iNteract-AOE QR code.

## User Flow

1.  **Scan QR Code**: The customer uses their mobile device's camera to scan a QR code found on a product in-store.

2.  **Initial Redirect**: The QR code's encoded URL points to `https://<your-app-domain>/track/{qrId}`.

3.  **Tracking Endpoint**: The Next.js API route at `/app/track/[qrCodeId]/route.ts` is triggered.
    -   It atomically logs the scan event (device, timestamp, etc.) and increments the scan counter in Firestore.
    -   Crucially, it **redirects** the user's browser to `/scan/{qrId}`.

4.  **Interaction Screen**: The user's browser loads the page at `/app/scan/[qrCodeId]/page.tsx`.
    -   This page renders the `QrScanInteraction` component.
    -   A loading spinner is immediately displayed to the user.

5.  **Data Fetching**: The `QrScanInteraction` component mounts and calls the `/api/flows/getScanInteraction` Genkit flow.
    -   The backend flow fetches the QR code's data, its linked AI Profile, and any other relevant context (like product info).
    -   It constructs a prompt and calls a Generative AI model (e.g., Gemini).
    -   The AI generates a set of engaging messages based on its configured personality and intent.
    -   The flow returns the AI messages and the final product destination URL to the component.

6.  **Display AI Messages**:
    -   The loading spinner is replaced with a chat-bubble UI.
    -   The AI messages are displayed one by one with a "typing" animation to feel more interactive.
    -   A prominent "Continue to Product" button is shown.

7.  **Final Redirect**: The user reads the messages and clicks the "Continue to Product" button.
    -   The browser navigates to the final `destination_url` (e.g., the product page on the retailer's e-commerce site).

8.  **Interaction Logging**: The click event on the "Continue" button is logged to Firestore in the `qr_interactions` collection to track engagement with the AI-powered screen.

## Fallback

-   If the `/api/flows/getScanInteraction` API call fails for any reason (e.g., AI model timeout, server error), the `QrScanInteraction` component will automatically and immediately redirect the user to the final `destination_url` to ensure a seamless user experience.
-   If a QR code is scanned that does not have an `ai_profile_id` linked to it, the tracking endpoint at `/track/{qrId}` will skip the interaction screen and redirect the user directly to the final destination URL.
