# iNteract — First Live Retailer Pilot Deployment Plan

## 1. Executive Summary
This document defines the authoritative architecture and operational procedure for deploying iNteract into the first physical pilot store. The system leverages a **Trusted Identity Model** and **GS1-aligned Digital Links** to ensure all digital interactions are securely anchored to the retailer while remaining frictionless for the shopper.

## 2. Onboarding Lifecycle
| Stage | Responsibility | Action | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **Provisioning** | iNteract Admin | Create tenant in registry; Assign custom claims. | `retailerId` claim verified in token. |
| **Network Setup** | Retailer Admin | Configure the specific Pilot Store and internal areas. | Store record exists in Firestore. |
| **Branding** | Retailer Admin | Upload logo; Select experience template. | Visual preview approved by Retailer. |
| **Catalog** | Retailer Admin | Add products using 13-digit EAN; Normalize to GTIN-14. | Canonical records exist in `/products`. |
| **Activation** | Retailer Admin | Select products; Generate batch; Process job. | Status: COMPLETED; Zip available. |
| **Deployment** | Store Manager | Print labels; Place on SEL; **Verify 100%**. | All labels resolved to correct product. |
| **Go-Live** | iNteract/Retailer | Declare pilot active; Open for shopper engagement. | First Live Shopper Scan recorded. |

## 3. The 100% Verification Rule
No physical QR label becomes production-live until it has passed digital verification.
1. **Match**: Use `deployment_manifest.csv` to match stickers to products.
2. **Place**: Labels applied to shelf-edge (SEL) to the right of the price.
3. **Scan**: A staff member MUST scan 100% of labels.
4. **Confirm**: Correct product info and branding appeared for every scan.

## 4. Live Operations & Analytics
- **Live Metrics**: Scans, Sessions, Ari Interactions, Behavioral Signals (Interest, Consideration).
- **Simulated Metrics (SIM)**: ROI projections, Basket Uplift %, POS Handshake concepts.
- **Factual Guard**: All simulated data MUST carry the `(SIM)` badge in the dashboard.

## 5. Failure & Recovery
- **Damaged Label**: Identify QR ID from manifest -> Regenerate single code -> Replace.
- **Wrong Product**: Correct the record in the Product Catalog. (QR remains valid).
- **Analytics Delay**: Verify event capture -> check Firestore listener -> refresh dashboard.

## 6. Pilot Acceptance Gate
The pilot is considered **LIVE** only when the following are signed off:
- [ ] Retailer Identity & Claims Verified
- [ ] Store & Branding Approved
- [ ] 100% Verification Scans Successful
- [ ] Ari Product Context Grounded & Verified
- [ ] (SIM) Disclosures clear to Retailer Admin
