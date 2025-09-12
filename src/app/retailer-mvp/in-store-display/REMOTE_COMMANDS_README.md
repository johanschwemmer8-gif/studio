
# Remote Commands Firestore Subcollection Schema

This document outlines the schema for the `remoteCommands` subcollection, which functions as a command queue for individual display devices.

## `remoteCommands` Subcollection

This is a subcollection nested under a specific display document.

-   **Collection Path**: `/displays/{displayId}/remoteCommands`
-   **Document ID**: Auto-generated unique ID for each command.

Each document represents a single command issued to the display device. The in-store display client will listen for new documents in this subcollection.

### Document Fields

| Field Name | Type      | Description                                                                                         |
| :--------- | :-------- | :-------------------------------------------------------------------------------------------------- |
| `command`  | `string`  | The command to be executed by the device (e.g., 'RESTART', 'REFRESH_CONTENT', 'SET_BRIGHTNESS').      |
| `issuedAt` | `timestamp`| The timestamp when the command was created and added to the queue.                                  |
| `status`   | `string`  | The status of the command, managed by the device (e.g., 'PENDING', 'ACKNOWLEDGED', 'COMPLETED', 'FAILED'). |
| `details`  | `map`     | (Optional) A map of additional parameters for the command (e.g., `{ "brightness": 80 }`).             |

### Sample Document

Here is an example of what a command document might look like:

```json
// Path: /displays/display_sandton_001/remoteCommands/CmdAutoId12345
{
  "command": "RESTART",
  "issuedAt": "2024-05-23T11:00:00Z",
  "status": "PENDING"
}
```

### Workflow

1.  The backend (e.g., a Cloud Function or Genkit flow) adds a new document to this subcollection.
2.  The client application running on the physical display listens for `onSnapshot` changes to this subcollection, ordered by `issuedAt`.
3.  When a new 'PENDING' command is detected, the client executes the command.
4.  Upon execution, the client updates the command document's status to 'ACKNOWLEDGED', 'COMPLETED', or 'FAILED'.
5.  A separate cleanup process (e.g., a TTL policy or a scheduled function) can be used to remove old, completed commands from the queue.
