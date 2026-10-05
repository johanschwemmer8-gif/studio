# Retailer App Connections

## Current Operating Mode

App Connections currently operates in **Demo Configuration** mode.

Retailers may define integration metadata for POS / ERP, PIM / E-commerce,
and CRM / Loyalty systems. This configuration does not establish or imply a
live external-system connection or factual data synchronization.

Production synchronization requires a separate production infrastructure
handshake and retailer-approved credential provisioning.

## Firestore Authority

Collection:

`/retailerIntegrations`

Document ID:

`{retailerId}`

Each retailer document contains service-name keyed configuration records.

Current configuration fields:

- `integrationType`: `pos`, `pim`, or `crm`
- `endpoint`: intended external API endpoint
- `status`: `configuration_pending`
- `lastUpdated`: server timestamp

The authenticated retailer boundary is enforced server-side before
configuration is written or removed.

## Credential Boundary

Demo Configuration does **not** collect or persist API keys or API secrets.

Production credentials must be provisioned through a trusted server-side
infrastructure boundary when production integration is activated. A future
production implementation may use Google Cloud Secret Manager or another
approved secrets facility, but no Secret Manager provisioning is claimed by
the current Demo Configuration implementation.

## Status Semantics

Current:

- `configuration_pending` — configuration metadata exists, but no production
  connection has been established.

Future production infrastructure may introduce factual statuses such as:

- `connected`
- `synchronizing`
- `error`
- `disconnected`

Those statuses must only be produced from actual production infrastructure
state.

## Integration Pages

The POS / ERP, PIM / E-commerce, and CRM / Loyalty child pages are guidance
and status surfaces.

The App Connections landing page is the authoritative configuration surface.
It records the intended service, integration type, and endpoint.

No child page performs simulated connection testing or simulated
synchronization.
