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
import {
  getRetailerUserScopeChildrenAction,
  getRetailerUserScopeContextAction,
} from '@/ai/flows/get-retailer-user-scope-options';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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

  const [eligibleRoles, setEligibleRoles] = React.useState<CanonicalRole[]>([]);
  const [actorScope, setActorScope] = React.useState<AuthorizationScope | null>(null);

  const [role, setRole] = React.useState<CanonicalRole | null>(null);
  const [analystLevel, setAnalystLevel] = React.useState<ScopeLevel | null>(null);

  const [scopePath, setScopePath] = React.useState<ScopeOption[]>([]);
  const [children, setChildren] = React.useState<ScopeOption[]>([]);

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

        if (cancelled) return;

        setEligibleRoles(context.eligibleRoles);
        setActorScope(context.actorScope);
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
            onValueChange={value =>
              setRole(value as CanonicalRole)
            }
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
    </div>
  );
}
