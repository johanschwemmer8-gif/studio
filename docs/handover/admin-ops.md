# iNteract Pilot Operations Guide (Admin)

## 1. Retailer Onboarding
1. **Navigate** to `Network Control > Retailers`.
2. **Add Retailer**: Enter the group name (e.g., "Woolworths").
3. **Setup User**: Create the Firebase Auth account for the Retailer Admin.
4. **Verified Access Manager**: 
   - Copy the newly created UID.
   - Paste into "Firebase User UID".
   - Select the corresponding Tenant and Role.
   - Click "Provision Trusted Access".

**CRITICAL**: The user MUST sign out and back in after claims are provisioned to refresh their identity token.

## 2. Platform Monitoring
- Use **Platform Health** to monitor baseline infrastructure. Note: Current telemetry is simulated for the pilot phase.
- Use **Portfolio ROI** to view aggregate impact across all pilot tenants.

## 3. Deployment Updates
Use the **Update Manager** to push UI changes or new Ari capabilities to all active pilot instances simultaneously.