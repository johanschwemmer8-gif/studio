# iNteract — Step 8D.1 Live Retailer Pilot Deployment Plan

## 1. Executive Summary
This document defines the authoritative architecture and operational procedure for deploying iNteract into the first physical pilot store. The system leverages a **Trusted Identity Model** to ensure that all digital interactions are securely anchored to the retailer while remaining frictionless for the shopper.

## 2. Onboarding Workflow
### Phase 1: Provisioning (Admin)
- **Tenant Creation**: Admin registers the retailer in the global `/tenants` collection.
- **Identity Issuance**: Admin provisions the `retailerAdmin` user with verified `retailerId` custom claims.

### Phase 2: Configuration (Retailer)
- **Network Setup**: Retailer defines the specific Pilot Store and internal areas.
- **Branding**: Retailer publishes the logo and experience template.
- **Catalog**: Retailer adds pilot products using standard barcodes (EAN-13/UPC). System normalizes to GTIN-14.

### Phase 3: Activation (Retailer)
- **QR Job**: Retailer generates unique traceable QR codes for the pilot products.
- **Package**: Retailer downloads the ZIP containing images and the `deployment_manifest.csv`.

## 3. Physical Deployment (Store Team)
### The 100% Verification Rule
1. **Print**: Labels are printed on 40mm x 40mm adhesive stock.
2. **Place**: Labels are applied to the shelf-edge (SEL) to the right of the price.
3. **Verify**: A store staff member MUST scan 100% of labels to confirm the correct experience loads.
4. **Sign-off**: Pilot is declared live only after verification is complete.

## 4. Live Operations & Analytics
- **Live Metrics**: Scans, Sessions, Ari Interactions, Behavioral Signals.
- **Simulated Metrics (SIM)**: ROI projections, Basket Uplift %, POS Handshake concepts.
- **Factual Guard**: All simulated data must carry the `(SIM)` badge.

## 5. Failure & Recovery Hierarchy
- **Wrong Product**: Correct the record in the Product Catalog. QR remains valid.
- **Unreadable QR**: Identify QR ID from the manifest and regenerate via "Fix Code" in the dashboard.
- **Stale Session**: Application gracefully ignores session IDs from previous pilot cycles.

## 6. Pilot Acceptance Gate
| Criterion | Required |
| :--- | :--- |
| Retailer Identity Verified | YES |
| 100% Verification Scans | YES |
| Ari Product Context Grounded | YES |
| Live Analytics Triggered | YES |
| SIM/Live Disclosure Clear | YES |

**Final Verdict: PASS — PILOT ARCHITECTURE READY**