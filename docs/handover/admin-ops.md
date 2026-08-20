# iNteract Pilot Operations Guide (Admin)

## 1. Retailer Provisioning
1. **Navigate** to `Network Control > Retailers`.
2. **Add Retailer**: Enter the canonical group name (e.g., "Woolworths").
3. **Setup User**: Create the Firebase Auth account for the Retailer Admin.
4. **Verified Access Manager**: 
   - Enter the User's UID.
   - Select the corresponding Retailer and Role.
   - Click "Provision Trusted Access".

**CRITICAL**: The user MUST sign out and back in after claims are provisioned to refresh their security token.

## 2. Platform Monitoring
- **Platform Health**: Monitor baseline infrastructure latency. Note: Current telemetry is simulation benchmarks.
- **Portfolio ROI**: View aggregate impact across all pilot tenants (SIM).

## 3. Operational Support
- **Claim Issues**: If a user sees "Access Denied", verify the `retailerId` claim in the Verified Access Manager.
- **QR Failures**: If a QR resolves to the wrong product, first check the Product Catalog mapping before regenerating.
