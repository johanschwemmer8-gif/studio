# Live vs. Simulation Register

This register defines the operational truth for the iNteract Pilot.

### LIVE (Factual Evidence)
- **Shopper Scans**: Every unique scan is an atomic record.
- **Shopper Sessions**: Anchored to the specific tenant and product.
- **Ari Interactions**: Live conversations with Gemini 2.5 Flash.
- **Behavioural Signals**: Extracted intent (Interests, Consideration).
- **Product Catalog**: Canonical product facts.

### SIMULATION (Benchmarks)
- **Associated Sales**: Calculated by mock join until ERP integration.
- **ROI Metrics**: Benchmarks based on pilot uplift targets.
- **POS Handshake**: Terminal sync is a conceptual simulation.
- **Platform Health**: Latency metrics are infrastructure benchmarks.

**Designation**: All simulated metrics MUST be labeled with **(SIM)** in the UI.
