# Pilot Rollback & Decommissioning Procedure

## 1. Digital Rollback
If a digital activation must be disabled:
1. **Deactivate QR**: Set the status to `inactive` in the `qrcodes` collection. The resolver will return a "Product Unavailable" message.
2. **Remove Product**: Delete or unpublish the item in the Product Catalog.
3. **Revoke Access**: Set the `isActive` flag to `false` in the `PlatformUser` record.

## 2. Physical Rollback
If a physical pilot must be stopped:
1. **Remove Labels**: Physically remove all 40mm stickers from the shelf-edge.
2. **Staff Notice**: Instruct store staff to remove any customer-facing "Scan for Guidance" marketing materials.

## 3. Retailer Decommissioning
1. **Data Preservation**: Export the pilot `events` and `sessions` data for the Final Pilot Review.
2. **Operational Wipe**: Use the **Full Reset** capability in the Admin Panel to clear the tenant's operational data.
3. **Registry Update**: Mark the tenant as `inactive` or `archived` in the `/tenants` registry.
4. **Identify Retention**: Keep the `retailerId` and core identity for audit purposes unless deletion is legally required.

## 4. Emergency Kill-Switch
In the event of a critical security or performance issue:
1. **Global Resolver**: Temporary redirection of the `/resolve` route to a "Maintenance" landing page.
2. **Auth Suspension**: Use Firebase Admin to disable the `retailerAdmin` user account.
