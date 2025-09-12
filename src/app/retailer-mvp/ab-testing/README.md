# A/B Testing Firestore Schema

This document outlines the Firestore schema for managing A/B tests and experiments.

## `experiments` Collection

-   **Collection Path**: `/experiments`
-   **Document ID**: Auto-generated unique ID for each experiment.

Each document in this collection represents a single A/B test.

### Document Fields

| Field Name             | Type      | Description                                                                                               |
| :--------------------- | :-------- | :-------------------------------------------------------------------------------------------------------- |
| `name`                 | `string`  | A user-friendly name for the experiment.                                                                  |
| `description`          | `string`  | A more detailed description of the experiment's hypothesis.                                               |
| `status`               | `string`  | The current status of the experiment (e.g., 'Draft', 'Running', 'Paused', 'Completed').                    |
| `startDate`            | `timestamp`| The date and time when the experiment was started.                                                       |
| `endDate`              | `timestamp`| The date and time when the experiment was concluded (optional).                                           |
| `keyMetric`            | `string`  | The primary metric being measured to determine the winner (e.g., 'Click-Through Rate', 'Conversion Rate'). |
| `results`              | `map`     | An object containing the performance data for each variable.                                              |
| `results.control_conversions`   | `number`  | The number of conversions for the control group (Variable A).                                     |
| `results.variant_conversions`   | `number`  | The number of conversions for the variant group (Variable B).                                     |
| `results.control_participants`| `number`  | The total number of participants in the control group.                                            |
| `results.variant_participants`| `number`  | The total number of participants in the variant group.                                            |
| `variables`            | `map`     | An object defining the variables being tested.                                                            |
| `variables.A`          | `string`  | A description of the control variable.                                                                    |
| `variables.B`          | `string`  | A description of the variant being tested against the control.                                            |

### Sample Document

Here is an example of what a document in the `experiments` collection might look like:

```json
{
  "name": "Homepage UI Test",
  "description": "Testing a new homepage layout to see if it improves user engagement.",
  "status": "Running",
  "startDate": "2025-09-12T10:00:00Z",
  "endDate": null,
  "keyMetric": "Click-Through Rate",
  "results": {
    "control_conversions": 100,
    "variant_conversions": 120,
    "control_participants": 1000,
    "variant_participants": 980
  },
  "variables": {
    "A": "Old UI Layout with single CTA button",
    "B": "New UI Layout with dual CTA buttons"
  }
}
```
