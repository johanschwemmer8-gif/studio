# Data Ownership & Responsibility Framework

*NOTE: This document provides the technical and operational boundaries for data. LEGAL REVIEW REQUIRED for final contract terms.*

## 1. Retailer Data Ownership
- **Catalog**: The Retailer owns all product names, descriptions, and pricing data uploaded to the platform.
- **Branding**: The Retailer owns all logos, brand colors, and experience configurations.
- **Network**: The Retailer owns the definition of their store hierarchy and store codes.

## 2. iNteract Platform Data
- **Aggregated Analytics**: iNteract AOE owns the anonymized, aggregated behavioral trends derived from the platform.
- **AI Models**: iNteract AOE owns the weights, training data, and system prompts that drive the Ari assistant.
- **Infrastructure**: iNteract AOE owns the software, Digital Link resolver logic, and tracking identifiers.

## 3. Shopper Interaction Data
- **Behavioral Events**: Interaction signals (e.g., "Product Interest") are captured at the session level.
- **Anonymity**: Shoppers remain anonymous by default. Persistent identity is only established if the shopper explicitly opts-in to the "Smart Shopping Profile".
- **Consent**: Ari interactions and behavioral analysis require shopper consent, managed at the point of interaction.

## 4. Responsibility Boundaries
- **iNteract**: Responsible for system uptime, resolution reliability, and AI grounding logic.
- **Retailer**: Responsible for the accuracy of product facts and the physical security of labels in-store.
- **Compliance**: Both parties are responsible for adhering to POPIA (South Africa) regarding the handling of any identifiable shopper data.
