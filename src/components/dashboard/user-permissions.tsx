
'use client';

import { Badge } from "@/components/ui/badge";

type Permissions = {
  dashboard: boolean;
  roi: boolean;
  visualsReporting: boolean;
  realTime: boolean;
  abTesting: boolean;
  systemIntegration: boolean;
  retailMediaNetwork: boolean;
};

type PermissionLabel = {
  id: keyof Permissions;
  label: string;
};

type UserPermissionsProps = {
  permissions: Permissions;
  labels: PermissionLabel[];
};

export default function UserPermissions({ permissions, labels }: UserPermissionsProps) {
  const grantedPermissions = labels.filter(label => permissions[label.id]);

  if (grantedPermissions.length === 0) {
    return <span className="text-sm text-muted-foreground">No permissions granted</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {grantedPermissions.map(p => (
        <Badge key={p.id} variant="secondary" className="font-normal">
          {p.label}
        </Badge>
      ))}
    </div>
  );
}
