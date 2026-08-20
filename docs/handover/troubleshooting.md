# Pilot Troubleshooting Guide

| Problem | Detection | Immediate Action | Owner |
| :--- | :--- | :--- | :--- |
| **Access Denied** | User cannot login | Re-provision claims in Admin Panel | Admin |
| **Wrong Product** | Verification scan fails | Edit Product Catalog & Refresh Page | Retailer |
| **QR Doesn't Scan** | Camera won't focus | Check print quality or regenerate | Store Manager |
| **Ari won't respond** | Interaction hangs | Check Product Context in Catalog | Retailer |
| **Analytics at "0"** | No activity shown | Verify event capture in Firestore | Admin |

## Recovery Hierarchy
1. **Retailer Level**: Fixes names, descriptions, and branding.
2. **Admin Level**: Fixes user access and QR generation issues.
3. **Platform Level**: Fixes Firestore, Auth, and AI logic defects.
