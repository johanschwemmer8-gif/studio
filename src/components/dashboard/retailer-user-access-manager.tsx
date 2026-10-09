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
  authorizationScopesEqual,
  initialSidebarAccessForEdit,
} from '@/lib/retailer-user-edit-state';
import {
  getRetailerUserScopeChildrenAction,
  getRetailerUserScopeContextAction,
} from '@/ai/flows/get-retailer-user-scope-options';
import {
  createRetailerUserAction,
  listRetailerManagedUserDisplaySummariesAction,
  reactivateRetailerUserAction,
  suspendRetailerUserAction,
  updateRetailerUserAuthorizationAction,
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

  const [editingUser, setEditingUser] =
    React.useState<RetailerManagedUserDisplaySummary | null>(null);
  const [creatingUser, setCreatingUser] = React.useState(false);
  const [newDisplayName, setNewDisplayName] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [editInitializing, setEditInitializing] = React.useState(false);
  const [lifecycleUser, setLifecycleUser] =
    React.useState<RetailerManagedUserDisplaySummary | null>(null);
  const [lifecyclePending, setLifecyclePending] = React.useState(false);
  const skipRoleResetRef = React.useRef(false);

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

  async function fetchChildren(
    parentScope: AuthorizationScope
  ): Promise<ScopeOption[]> {
    if (!user) return [];

    const idToken = await user.getIdToken();

    return getRetailerUserScopeChildrenAction({
      idToken,
      parentScope,
    });
  }

  async function loadChildren(parentScope: AuthorizationScope) {
    try {
      setLoadingChildren(true);
      setError(null);

      const result = await fetchChildren(parentScope);
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
    if (skipRoleResetRef.current) {
      skipRoleResetRef.current = false;
      return;
    }

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

  function scopeId(scope: AuthorizationScope): string | undefined {
    switch (scope.level) {
      case 'network':
        return scope.networkId;
      case 'brand':
        return scope.brandId;
      case 'division':
        return scope.divisionId;
      case 'region':
        return scope.regionId;
      case 'area':
        return scope.areaId;
      case 'store':
        return scope.storeId;
    }
  }

  function scopeIsOnTargetPath(
    candidate: AuthorizationScope,
    target: AuthorizationScope
  ): boolean {
    switch (candidate.level) {
      case 'network':
        return candidate.networkId === target.networkId;
      case 'brand':
        return candidate.brandId === target.brandId;
      case 'division':
        return candidate.divisionId === target.divisionId;
      case 'region':
        return candidate.regionId === target.regionId;
      case 'area':
        return candidate.areaId === target.areaId;
      case 'store':
        return candidate.storeId === target.storeId;
    }
  }

  async function buildScopePath(
    targetScope: AuthorizationScope
  ): Promise<ScopeOption[]> {
    if (!actorScope) {
      return [];
    }

    if (actorScope.level === targetScope.level) {
      if (!authorizationScopesEqual(actorScope, targetScope)) {
        throw new Error(
          'This user is outside your organisational scope.'
        );
      }

      return [];
    }

    const path: ScopeOption[] = [];
    let parent = actorScope;

    while (parent.level !== targetScope.level) {
      const options = await fetchChildren(parent);
      const next = options.find(option =>
        scopeIsOnTargetPath(option.scope, targetScope)
      );

      if (!next) {
        throw new Error(
          'Unable to reconstruct this user\'s organisational scope.'
        );
      }

      path.push(next);
      parent = next.scope;
    }

    return path;
  }

  function beginCreate() {
    setEditingUser(null);
    setCreatingUser(true);
    setNewDisplayName('');
    setNewEmail('');
    setNewPassword('');
    setRole(null);
    setAnalystLevel(null);
    setScopePath([]);
    setChildren([]);
    setSidebarAccess([]);
    setError(null);
  }

  function cancelCreate() {
    setCreatingUser(false);
    setNewDisplayName('');
    setNewEmail('');
    setNewPassword('');
    setRole(null);
    setAnalystLevel(null);
    setScopePath([]);
    setChildren([]);
    setSidebarAccess([]);
    setError(null);
  }

  async function beginEdit(
    managedUser: RetailerManagedUserDisplaySummary
  ) {
    if (!actorScope) return;

    try {
      setEditInitializing(true);
      setError(null);
      setCreatingUser(false);

      const path = await buildScopePath(managedUser.scope);

      skipRoleResetRef.current = true;
      setEditingUser(managedUser);
      setRole(managedUser.role);
      setAnalystLevel(
        managedUser.role === 'analyst'
          ? managedUser.scope.level
          : null
      );
      setScopePath(path);
      setChildren([]);

      setSidebarAccess(
        initialSidebarAccessForEdit(
          managedUser.role,
          managedUser.sidebarAccess
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to prepare this user for editing.'
      );
    } finally {
      setEditInitializing(false);
    }
  }

  function cancelEdit() {
    setEditingUser(null);
    setRole(null);
    setAnalystLevel(null);
    setScopePath([]);
    setChildren([]);
    setSidebarAccess([]);
    setError(null);
  }

  async function saveEdit() {
    if (
      !user ||
      !editingUser ||
      !role ||
      !selectedScope ||
      !assignmentComplete
    ) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const idToken = await user.getIdToken();

      await updateRetailerUserAuthorizationAction({
        idToken,
        targetUid: editingUser.uid,
        role,
        scope: selectedScope,
        sidebarAccess,
      });

      const users =
        await listRetailerManagedUserDisplaySummariesAction({
          idToken,
        });

      setManagedUsers(users);
      cancelEdit();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save user authorization.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function createUser() {
    if (
      !user ||
      !creatingUser ||
      !role ||
      !selectedScope ||
      !assignmentComplete ||
      !newDisplayName.trim() ||
      !newEmail.trim() ||
      !newPassword
    ) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const idToken = await user.getIdToken();

      const createResult = await createRetailerUserAction({
        idToken,
        displayName: newDisplayName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role,
        scope: selectedScope,
        sidebarAccess,
      });

      if (!createResult.success) {
        setError(createResult.message);
        return;
      }

      const users =
        await listRetailerManagedUserDisplaySummariesAction({
          idToken,
        });

      setManagedUsers(users);
      cancelCreate();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create retailer user.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmLifecycleChange() {
    if (!user || !lifecycleUser) {
      return;
    }

    const target = lifecycleUser;

    try {
      setLifecyclePending(true);
      setError(null);

      const idToken = await user.getIdToken();

      if (target.isActive) {
        await suspendRetailerUserAction({
          idToken,
          targetUid: target.uid,
        });
      } else {
        await reactivateRetailerUserAction({
          idToken,
          targetUid: target.uid,
        });
      }

      const users =
        await listRetailerManagedUserDisplaySummariesAction({
          idToken,
        });

      setManagedUsers(users);

      if (editingUser?.uid === target.uid) {
        setEditingUser(null);
        setRole(null);
        setAnalystLevel(null);
        setScopePath([]);
        setChildren([]);
        setSidebarAccess([]);
      }

      setLifecycleUser(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : target.isActive
            ? 'Unable to suspend this user.'
            : 'Unable to reactivate this user.'
      );
    } finally {
      setLifecyclePending(false);
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
      {creatingUser && (
        <section className="space-y-4 rounded-md border p-4">
          <div>
            <h3 className="text-xl font-bold">Add User</h3>
            <p className="text-sm text-muted-foreground">
              Create a retailer user, then assign their role,
              organisational scope and sidebar access.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-user-name">Name &amp; Surname</Label>
              <Input
                id="new-user-name"
                value={newDisplayName}
                disabled={saving}
                onChange={event => setNewDisplayName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                type="email"
                value={newEmail}
                disabled={saving}
                onChange={event => setNewEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2 md:max-w-md">
              <Label htmlFor="new-user-password">
                Temporary Password
              </Label>
              <Input
                id="new-user-password"
                type="password"
                value={newPassword}
                disabled={saving}
                autoComplete="new-password"
                onChange={event => setNewPassword(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Set an initial password for this account. First-login
                credential handling will be governed separately.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Role</h4>
              <p className="text-sm text-muted-foreground">
                Choose the responsibility level for this retailer user.
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
          </div>
        </section>
      )}

      {editingUser && (
        <section className="space-y-4 rounded-md border p-4">
          <div>
            <h3 className="text-xl font-bold">Edit User Access</h3>
            <p className="text-sm text-muted-foreground">
              {editingUser.displayName} · {editingUser.email}
            </p>
          </div>

          {editingUser.sidebarAccess === undefined && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              This user currently has legacy sidebar access. Saving changes
              will convert that access to an explicit governed assignment.
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Role</h4>
              <p className="text-sm text-muted-foreground">
                Choose the responsibility level for this retailer user.
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
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold">Managed Users</h3>
            <p className="text-sm text-muted-foreground">
              Users within your retailer and organisational authority.
            </p>
          </div>

          <Button
            type="button"
            disabled={
              creatingUser ||
              editInitializing ||
              saving ||
              lifecyclePending
            }
            onClick={beginCreate}
          >
            Add User
          </Button>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managedUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            editInitializing ||
                            saving ||
                            lifecyclePending
                          }
                          onClick={() => {
                            void beginEdit(managedUser);
                          }}
                        >
                          Edit Access
                        </Button>

                        <Button
                          type="button"
                          variant={
                            managedUser.isActive
                              ? 'destructive'
                              : 'outline'
                          }
                          size="sm"
                          disabled={
                            editInitializing ||
                            saving ||
                            lifecyclePending
                          }
                          onClick={() => {
                            setError(null);
                            setLifecycleUser(managedUser);
                          }}
                        >
                          {managedUser.isActive
                            ? 'Suspend'
                            : 'Reactivate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <AlertDialog
        open={lifecycleUser !== null}
        onOpenChange={open => {
          if (!open && !lifecyclePending) {
            setLifecycleUser(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lifecycleUser?.isActive
                ? 'Suspend user?'
                : 'Reactivate user?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lifecycleUser?.isActive
                ? `Suspend ${lifecycleUser?.displayName ?? 'this user'}? They will no longer be able to sign in or access the retailer workspace until reactivated.`
                : `Reactivate ${lifecycleUser?.displayName ?? 'this user'}? Their sign-in and assigned retailer access will be restored.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={lifecyclePending}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={lifecyclePending}
              onClick={event => {
                event.preventDefault();
                void confirmLifecycleChange();
              }}
            >
              {lifecyclePending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {lifecycleUser?.isActive
                ? 'Suspend User'
                : 'Reactivate User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {(editingUser || creatingUser) && role && actorScope && (
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

      {(editingUser || creatingUser) && role && assignmentComplete && (
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

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={
                saving ||
                !assignmentComplete ||
                (creatingUser &&
                  (
                    !newDisplayName.trim() ||
                    !newEmail.trim() ||
                    !newPassword
                  ))
              }
              onClick={() => {
                if (creatingUser) {
                  void createUser();
                } else {
                  void saveEdit();
                }
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {creatingUser ? 'Creating…' : 'Saving…'}
                </>
              ) : creatingUser ? (
                'Create User'
              ) : (
                'Save Changes'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={creatingUser ? cancelCreate : cancelEdit}
            >
              Cancel
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
