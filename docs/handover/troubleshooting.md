# Pilot Troubleshooting Guide

| Problem | Root Cause | Action |
| :--- | :--- | :--- |
| **"Access Denied" on login** | Claims not provisioned or token stale. | Admin: Re-provision claims. User: Sign out/in. |
| **QR opens unbranded page** | Brand config not published. | Retailer: Save "Brand & Experience" settings. |
| **Scan not in analytics** | Wrong retailer context in event. | Admin: Verify QR `retailerId` matches Token ID. |
| **Ari won't respond** | Knowledge context missing. | Retailer: Ensure product description is provided. |
| **Dashboard shows "0"** | Zero live events recorded. | Shopper: Perform a real scan to initialize stream. |