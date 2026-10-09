'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import type {
  AuthorizationScope,
  CanonicalRole,
  ScopeLevel,
} from '@/lib/auth-types';
import { ROLE_SCOPE_LEVEL } from '@/lib/auth-types';
import type {
  RetailerFunctionalArea,
  SidebarAccess,
} from '@/lib/retailer-navigation';
import {
  constrainSidebarAccessForRole,
  getRetailerSidebarAccessGroups,
} from '@/lib/retailer-sidebar-access';
import {
  getRetailerUserScopeChildrenAction,
  getRetailerUserScopeContextAction,
} from '@/ai/flows/get-retailer-user-scope-options';
import {
  listRetailerManagedUserDisplaySummariesAction,
  type RetailerManagedUserDisplaySummary,
} from '@/ai/flows/manage-retailer-users';
import {
  retailerRoleLabel,
  retailerScopeLevelLabel,
  retailerSidebarAccessSummary,
  retailerUserStatusLabel,
} from '@/lib/retailer-managed-user-display';
import { RETAILER_FUNCTIONAL_AREA_IDS } from '@/lib/retailer-navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type ScopeOption = {
  scope: AuthorizationScope;
  displayName: string;
};

const ROLE_LABELS: Record<CanonicalRole, string> = {
  networkOwner: 'Network Owner',
  networkAdmin: 'Network Admin',
  brandManager: 'Brand Manager',
  divisionManager: 'Division Manager',
  regionalManager: 'Regional Manager',
  areaManager: 'Area Manager',
  storeManager: 'Store Manager',
  storeUser: 'Store User',
  analyst: 'Analyst',
};

const LEVEL_LABELS: Record<ScopeLevel, string> = {
  network: 'Network',
  brand: 'Brand',
  division: 'Division',
  region: 'Region',
  area: 'Area',
  store: 'Store',
};

const LEVEL_ORDER: readonly ScopeLevel[] = [
  'network',
  'brand',
  'division',
  'region',
  'area',
  'store',
];

function nextLevel(level: ScopeLevel): ScopeLevel | null {
  const index = LEVEL_ORDER.indexOf(level);
  return index >= 0 && index < LEVEL_ORDER.length - 1
    ? LEVEL_ORDER[index + 1]
    : null;
}

function isAtOrBelow(
  level: ScopeLevel,
  root: ScopeLevel
): boolean {
  return LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(root);
}

export default function RetailerUserAccessManager() {
  const { user } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [loadingChildren, setLoadingChildren] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [managedUsers, setManagedUsers] =
    React.useState<RetailerManagedUserDisplaySummary[]>([]);

  const [eligibleRoles, setEligibleRoles] = React.useState<CanonicalRole[]>([]);
  const [actorScope, setActorScope] = React.useState<AuthorizationScope | null>(null);

  const [role, setRole] = React.useState<CanonicalRole | null>(null);
  const [analystLevel, setAnalystLevel] = React.useState<ScopeLevel | null>(null);

  const [scopePath, setScopePath] = React.useState<ScopeOption[]>([]);
  const [children, setChildren] = React.useState<ScopeOption[]>([]);
  const [sidebarAccess, setSidebarAccess] =
    React.useState<SidebarAccess>([]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadContext() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const idToken = await user.getIdToken();
        const context = await getRetailerUserScopeContextAction({ idToken });
        const users =
          await listRetailerManagedUserDisplaySummariesAction({ idToken });

        if (cancelled) return;

        setEligibleRoles(context.eligibleRoles);
        setActorScope(context.actorScope);
        setManagedUsers(users);
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load user-management scope.'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadContext();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const selectedScope =
    scopePath.length > 0
      ? scopePath[scopePath.length - 1].scope
      : actorScope;

  const targetLevel: ScopeLevel | null =
    role === 'analyst'
      ? analystLevel
      : role
        ? ROLE_SCOPE_LEVEL[role] ?? null
        : null;

  const assignmentComplete =
    Boolean(selectedScope && targetLevel) &&
    selectedScope?.level === targetLevel;

  async function loadChildren(parentScope: AuthorizationScope) {
    if (!user) return;

    try {
      setLoadingChildren(true);
      setError(null);

      const idToken = await user.getIdToken();
      const result = await getRetailerUserScopeChildrenAction({
        idToken,
        parentScope,
      });

      setChildren(result);
    } catch (err) {
      setChildren([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load organisational units.'
      );
    } finally {
      setLoadingChildren(false);
    }
  }

  React.useEffect(() => {
    setScopePath([]);
    setChildren([]);
    setAnalystLevel(null);
  }, [role]);

  React.useEffect(() => {
    if (!actorScope || !targetLevel) {
      setChildren([]);
      return;
    }

    if (!isAtOrBelow(targetLevel, actorScope.level)) {
      setChildren([]);
      return;
    }

    if (actorScope.level === targetLevel) {
      setChildren([]);
      return;
    }

    void loadChildren(actorScope);
    // loadChildren intentionally uses the current authenticated user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorScope, targetLevel]);

  async function chooseChild(value: string) {
    const option = children.find(item => {
      const level = item.scope.level;
      const id =
        level === 'brand' ? item.scope.brandId :
        level === 'division' ? item.scope.divisionId :
        level === 'region' ? item.scope.regionId :
        level === 'area' ? item.scope.areaId :
        level === 'store' ? item.scope.storeId :
        item.scope.networkId;

      return id === value;
    });

    if (!option || !targetLevel) return;

    setScopePath(current => [...current, option]);

    if (option.scope.level === targetLevel) {
      setChildren([]);
      return;
    }

    await loadChildren(option.scope);
  }

  function resetToActorScope() {
    setScopePath([]);
    setChildren([]);

    if (
      actorScope &&
      targetLevel &&
      actorScope.level !== targetLevel
    ) {
      void loadChildren(actorScope);
    }
  }

  const analystLevels =
    actorScope
      ? LEVEL_ORDER.filter(level =>
          isAtOrBelow(level, actorScope.level)
        )
      : [];

  const sidebarGroups =
    role && assignmentComplete
      ? getRetailerSidebarAccessGroups(role)
      : [];

  function toggleSidebarArea(
    area: RetailerFunctionalArea,
    checked: boolean
  ) {
    if (!role) return;

    setSidebarAccess(current => {
      const next = checked
        ? current.includes(area)
          ? current
          : [...current, area]
        : current.filter(item => item !== area);

      return constrainSidebarAccessForRole(role, next);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading User Access…
      </div>
    );
  }

  if (error && !actorScope) {
    return (
      <div className="rounded-md border p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold">Role</h3>
          <p className="text-sm text-muted-foreground">
            Choose the responsibility level for the retailer user.
          </p>
        </div>

        <div className="max-w-md space-y-2">
          <Label>Role</Label>
          <Select
            value={role ?? undefined}
            onValueChange={value => {
              const nextRole = value as CanonicalRole;

              setSidebarAccess(current =>
                constrainSidebarAccessForRole(
                  nextRole,
                  current
                )
              );
              setRole(nextRole);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {eligibleRoles.map(item => (
                <SelectItem key={item} value={item}>
                  {ROLE_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold">Managed Users</h3>
          <p className="text-sm text-muted-foreground">
            Users within your retailer and organisational authority.
          </p>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organisational Scope</TableHead>
                <TableHead>Sidebar Access</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managedUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No manageable users found.
                  </TableCell>
                </TableRow>
              ) : (
                managedUsers.map(managedUser => (
                  <TableRow key={managedUser.uid}>
                    <TableCell>
                      <div className="font-medium">
                        {managedUser.displayName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {managedUser.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {retailerRoleLabel(managedUser.role)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {managedUser.scopeDisplayName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {retailerScopeLevelLabel(managedUser.scope)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {retailerSidebarAccessSummary(
                        managedUser.sidebarAccess,
                        RETAILER_FUNCTIONAL_AREA_IDS.length
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          managedUser.isActive
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {retailerUserStatusLabel(
                          managedUser.isActive
                        )}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {role && actorScope && (
        <section className="space-y-4">
          <div>
            <h3 className="text-xl font-bold">
              Organisational Scope
            </h3>
            <p className="text-sm text-muted-foreground">
              Choose where this user operates in your retail network.
            </p>
          </div>

          {role === 'analyst' && (
            <div className="max-w-md space-y-2">
              <Label>Scope Level</Label>
              <Select
                value={analystLevel ?? undefined}
                onValueChange={value => {
                  setScopePath([]);
                  setChildren([]);
                  setAnalystLevel(value as ScopeLevel);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a scope level" />
                </SelectTrigger>
                <SelectContent>
                  {analystLevels.map(level => (
                    <SelectItem key={level} value={level}>
                      {LEVEL_LABELS[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {targetLevel &&
            !isAtOrBelow(targetLevel, actorScope.level) && (
              <div className="rounded-md border p-4 text-sm text-destructive">
                This role cannot be assigned within your organisational scope.
              </div>
            )}

          {targetLevel &&
            isAtOrBelow(targetLevel, actorScope.level) && (
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <p className="text-sm font-medium">
                    Starting scope
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {LEVEL_LABELS[actorScope.level]}
                  </p>
                </div>

                {scopePath.map((item, index) => (
                  <div
                    key={`${item.scope.level}-${index}`}
                    className="rounded-md border p-4"
                  >
                    <p className="text-sm font-medium">
                      {LEVEL_LABELS[item.scope.level]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.displayName}
                    </p>
                  </div>
                ))}

                {!assignmentComplete && (
                  <div className="max-w-md space-y-2">
                    <Label>
                      {selectedScope
                        ? LEVEL_LABELS[
                            nextLevel(selectedScope.level) ?? targetLevel
                          ]
                        : 'Organisational Unit'}
                    </Label>

                    <Select
                      onValueChange={value => {
                        void chooseChild(value);
                      }}
                      disabled={loadingChildren || children.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingChildren
                              ? 'Loading…'
                              : children.length
                                ? 'Select organisational unit'
                                : 'No organisational units available'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {children.map(item => {
                          const level = item.scope.level;
                          const value =
                            level === 'brand' ? item.scope.brandId :
                            level === 'division' ? item.scope.divisionId :
                            level === 'region' ? item.scope.regionId :
                            level === 'area' ? item.scope.areaId :
                            level === 'store' ? item.scope.storeId :
                            item.scope.networkId;

                          return value ? (
                            <SelectItem
                              key={`${level}-${value}`}
                              value={value}
                            >
                              {item.displayName}
                            </SelectItem>
                          ) : null;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {scopePath.length > 0 && (
                  <button
                    type="button"
                    className="text-sm font-medium underline underline-offset-4"
                    onClick={resetToActorScope}
                  >
                    Change organisational selection
                  </button>
                )}

                {assignmentComplete && selectedScope && (
                  <div className="rounded-md border p-4">
                    <p className="font-medium">
                      Scope ready
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {ROLE_LABELS[role]} will be assigned at the{' '}
                      {LEVEL_LABELS[selectedScope.level]} level.
                    </p>
                  </div>
                )}
              </div>
            )}

          {error && (
            <div className="rounded-md border p-4 text-sm text-destructive">
              {error}
            </div>
          )}
        </section>

        )}

      {role && assignmentComplete && (
        <section className="space-y-4">
          <div>
            <h3 className="text-xl font-bold">
              Sidebar Access
            </h3>
            <p className="text-sm text-muted-foreground">
              Choose which iNteract areas are available to this user.
              This does not expand their role or organisational authority.
            </p>
          </div>

          <div className="space-y-6">
            {sidebarGroups.map(group => (
              <div key={group.group} className="space-y-3">
                <h4 className="text-sm font-semibold">
                  {group.group}
                </h4>

                <div className="grid gap-3 md:grid-cols-2">
                  {group.options.map(option => {
                    const checked =
                      sidebarAccess.includes(option.item.id);

                    return (
                      <div
                        key={option.item.id}
                        className="flex items-start gap-3 rounded-md border p-3"
                      >
                        <Checkbox
                          id={`sidebar-access-${option.item.id}`}
                          checked={checked}
                          disabled={!option.eligible}
                          onCheckedChange={value =>
                            toggleSidebarArea(
                              option.item.id,
                              value === true
                            )
                          }
                        />

                        <div className="space-y-1">
                          <Label
                            htmlFor={`sidebar-access-${option.item.id}`}
                            className={
                              option.eligible
                                ? 'cursor-pointer'
                                : 'cursor-not-allowed text-muted-foreground'
                            }
                          >
                            {option.item.label}
                          </Label>

                          {!option.eligible &&
                            option.unavailableReason && (
                              <p className="text-xs text-muted-foreground">
                                {option.unavailableReason}
                              </p>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-md border bg-muted/30 p-4 text-sm">
            <span className="font-medium">
              {sidebarAccess.length}
            </span>{' '}
            of 15 areas assigned.
          </div>
        </section>
      )}
    </div>
  );
}
