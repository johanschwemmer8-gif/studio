
# QR Management Feature

This document outlines the Firestore and Firebase Storage structure for the Bulk QR Code Generator feature.

## Firestore Collections

### 1. `qr_jobs`

This collection stores the metadata for each bulk generation job initiated by a user.

- **Collection Path**: `/qr_jobs`
- **Document ID**: Auto-generated unique ID for the job.

**Document Fields:**

| Field Name      | Type        | Description                                                                 |
|-----------------|-------------|-----------------------------------------------------------------------------|
| `jobId`         | `string`    | The unique ID of the job (same as document ID).                             |
| `retailerId`    | `string`    | The ID of the retailer who initiated the job. (Indexed)                     |
| `userId`        | `string`    | The ID of the user who initiated the job.                                   |
| `campaignName`  | `string`    | A user-defined name for the campaign/batch.                                 |
| `status`        | `string`    | The current status of the job (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`). |
| `totalCount`    | `number`    | The total number of QR codes requested in this job.                         |
| `completedCount`| `number`    | The number of QR codes successfully generated.                              |
| `errorCount`    | `number`    | The number of QR codes that failed to generate.                             |
| `createdAt`     | `timestamp` | Timestamp when the job was created.                                         |
| `completedAt`   | `timestamp` | Timestamp when the job finished (successfully or not).                      |
| `zipPath`       | `string`    | The path in Firebase Storage to the generated ZIP archive.                  |
| `style`         | `map`       | A map containing the styling options used for this batch.                   |

### 2. `qr_codes`

A subcollection under each `qr_jobs` document, containing the details for each individual QR code.

- **Collection Path**: `/qr_jobs/{jobId}/qr_codes`
- **Document ID**: Auto-generated unique ID.

**Document Fields:**

| Field Name        | Type     | Description                                                          |
|-------------------|----------|----------------------------------------------------------------------|
| `qrId`            | `string` | The unique identifier for this specific QR code.                     |
| `destinationUrl`  | `string` | The URL the QR code will redirect to.                                |
| `filename`        | `string` | The intended filename for this QR code image.                        |
| `status`          | `string` | The generation status of this code (`PENDING`, `DONE`, `ERROR`).     |
| `storagePath`     | `string` | The path in Firebase Storage where the generated QR image is stored. |
| `errorMessage`    | `string` | An error message if generation failed for this specific code.        |
| `aiProfileId`     | `string` | (Optional) The ID of an AI profile to associate with this code.      |
| `styleOverride`   | `map`    | (Optional) A map of style properties to override the job's defaults. |

## Firebase Storage Paths

### 1. Logos

User-uploaded logos for branding QR codes are stored in a dedicated path per retailer.

- **Path**: `logos/{retailerId}/{logoFileName}`
- **Example**: `logos/ret_123abc/summer-sale-logo.png`
- **Permissions**: Public read access is required for the QR generation service to fetch the logo. Writes should be restricted to authenticated users of that retailer.

### 2. Generated QR Codes

Individual QR code images are stored organized by retailer and job ID.

- **Path**: `qrcodes/{retailerId}/{jobId}/{filename}.{format}`
- **Example**: `qrcodes/ret_123abc/job_xyz789/qr-001.svg`

### 3. ZIP Archives

The final ZIP archive containing all QR codes for a completed job.

- **Path**: `archives/{retailerId}/{jobId}.zip`
- **Example**: `archives/ret_123abc/job_xyz789.zip`
- **Permissions**: Reads should be restricted to authenticated users of that retailer.
