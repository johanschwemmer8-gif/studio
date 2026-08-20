# iNteract Pilot Operations & Support (Admin)

## 1. Retailer Provisioning
1. **Tenant Registry**: Add the retailer canonical name to the `/tenants` collection.
2. **Auth Setup**: Create the Firebase Auth account.
3. **Claims Provisioning**: Use the **Verified Access Manager** to assign:
    - `retailerId`: The unique tenant ID.
    - `role`: `retailerAdmin`.
4. **Validation**: Log in as the retailer to confirm dashboard isolation.

## 2. Pilot Monitoring
- **Factual Analytics**: Monitor the `events` collection to verify behavioral signals are being captured.
- **Resolution Latency**: Monitor the `/resolve` route logs to ensure shoppers reach products in < 3 seconds.
- **Identity Integrity**: Audit the `sessions` collection to ensure no cross-tenant contamination exists.

## 3. Support & Incident Recovery
| Incident | Recovery Action |
| :--- | :--- |
| **Damaged QR** | Identify ID in manifest -> Admin regenerates single code -> Re-print. |
| **Stale Session** | Shopper refreshes page; Experience Layer handles 404 session gracefully. |
| **Wrong Product Facts**| Retailer updates Catalog; Change is instant for all future scans. |
| **Access Denied** | Re-verify custom claims in Admin Panel. User must re-login. |
| **Processing Hang** | Admin triggers "Resume Activation" to finish chunked generation. |

## 4. Operational Guardrails
- **No Manual GTINs**: Discourage manual GTIN entry; always use catalog-driven activation.
- **SIM Disclosure**: Ensure the `(SIM)` badge is visible on all ROI and POS simulation components.
- **Audit Logs**: Every reset or bulk generation is recorded in the `auditLogs` collection with the Admin's UID.
