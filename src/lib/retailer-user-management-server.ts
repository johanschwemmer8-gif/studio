import {
  type AuthorizationScope,
  type AuthorizedContext,
  type CanonicalRole,
  type UserAuthorizationProfile,
} from './auth-types';
import { canManageUser } from './authorization';
import { verifyAuth } from './auth-server';
import { admin, getDb } from './firebase-admin';
import {
  createUserAuthorizationProfile,
  getDefaultPermissions,
  isPermissionsValid,
} from './user-profile';
import {
  isSidebarAccess,
  type SidebarAccess,
} from './retailer-navigation';

export type ProposedRetailerUserAuthorization = {
  uid: string;
  retailerId: string;
  displayName: string;
  email: string;
  role: CanonicalRole;
  scope: AuthorizationScope;
  sidebarAccess?: SidebarAccess;
  isActive?: boolean;
  createdBy?: string;
  updatedBy?: string;
};

export function requireRetailerUserManager(
  actor: AuthorizedContext
): void {
  if (!actor.isActive) {
    throw new Error('USER_MANAGEMENT_FORBIDDEN: Actor account is inactive.');
  }

  if (!actor.retailerId) {
    throw new Error(
      'USER_MANAGEMENT_FORBIDDEN: Actor has no authoritative retailer.'
    );
  }

  if (!actor.permissions.manageUsers) {
    throw new Error(
      'USER_MANAGEMENT_FORBIDDEN: Actor does not have user-management permission.'
    );
  }
}

export function buildRetailerManagedUserProfile(
  actor: AuthorizedContext,
  input: ProposedRetailerUserAuthorization
): UserAuthorizationProfile {
  requireRetailerUserManager(actor);

  if (input.retailerId !== actor.retailerId) {
    throw new Error(
      'USER_MANAGEMENT_FORBIDDEN: Target retailer must match the authenticated actor.'
    );
  }

  if (
    input.sidebarAccess !== undefined &&
    !isSidebarAccess(input.sidebarAccess)
  ) {
    throw new Error(
      'USER_MANAGEMENT_INVALID: Invalid sidebar access assignment.'
    );
  }

  const profile = createUserAuthorizationProfile({
    uid: input.uid,
    retailerId: actor.retailerId,
    displayName: input.displayName,
    email: input.email,
    role: input.role,
    scope: input.scope,
    permissions: getDefaultPermissions(input.role),
    sidebarAccess: input.sidebarAccess,
    isActive: input.isActive,
    createdBy: input.createdBy,
    updatedBy: input.updatedBy,
  });

  const decision = canManageUser(actor, profile);

  if (!decision.allowed) {
    throw new Error(
      `USER_MANAGEMENT_FORBIDDEN: ${decision.reason || 'Target user is outside management authority.'}`
    );
  }

  return profile;
}

export function requireRetailerTargetManagement(
  actor: AuthorizedContext,
  target: UserAuthorizationProfile
): void {
  requireRetailerUserManager(actor);

  const decision = canManageUser(actor, target);

  if (!decision.allowed) {
    throw new Error(
      `USER_MANAGEMENT_FORBIDDEN: ${decision.reason || 'Target user is outside management authority.'}`
    );
  }
}


export type RetailerManagedUserSummary = {
  uid: string;
  displayName: string;
  email: string;
  role: CanonicalRole;
  scope: AuthorizationScope;
  sidebarAccess?: SidebarAccess;
  isActive: boolean;
};

export type CreateRetailerUserInput = {
  idToken: string;
  displayName: string;
  email: string;
  password: string;
  role: CanonicalRole;
  scope: AuthorizationScope;
  sidebarAccess?: SidebarAccess;
};

function authFailureMessage(
  result: Awaited<ReturnType<typeof verifyAuth>>
): string | null {
  return 'error' in result && result.error
    ? result.error
    : null;
}

function storedUserProfile(
  uid: string,
  data: Record<string, unknown>
): UserAuthorizationProfile | null {
  if (!isPermissionsValid(data.permissions)) {
    return null;
  }

  try {
    return createUserAuthorizationProfile({
      uid,
      retailerId:
        typeof data.retailerId === 'string'
          ? data.retailerId
          : '',
      displayName:
        typeof data.displayName === 'string'
          ? data.displayName
          : '',
      email:
        typeof data.email === 'string'
          ? data.email
          : '',
      role: data.role as CanonicalRole,
      scope: data.scope as AuthorizationScope,
      permissions: data.permissions,
      sidebarAccess: data.sidebarAccess as SidebarAccess | undefined,
      isActive: data.isActive === true,
      createdBy:
        typeof data.createdBy === 'string'
          ? data.createdBy
          : undefined,
      updatedBy:
        typeof data.updatedBy === 'string'
          ? data.updatedBy
          : undefined,
    });
  } catch {
    return null;
  }
}

async function writeRetailerUserAudit(
  event: Record<string, unknown>
): Promise<void> {
  const db = getDb();

  if (!db) {
    console.error(
      '[RetailerUserManagement] Audit unavailable: Firestore is unavailable.',
      event
    );
    return;
  }

  try {
    await db.collection('auditLogs').add(event);
  } catch (error) {
    console.error(
      '[RetailerUserManagement] Audit persistence failed:',
      error
    );
  }
}

export async function listRetailerManagedUsers(input: {
  idToken: string;
}): Promise<RetailerManagedUserSummary[]> {
  const actor = await verifyAuth(input.idToken);
  const authError = authFailureMessage(actor);

  if (authError) {
    throw new Error(`USER_MANAGEMENT_AUTH_FAILED: ${authError}`);
  }

  if ('error' in actor) {
    throw new Error('USER_MANAGEMENT_AUTH_FAILED: Authentication failed.');
  }

  requireRetailerUserManager(actor);

  const retailerId = actor.retailerId;

  if (!retailerId) {
    throw new Error(
      'USER_MANAGEMENT_FORBIDDEN: Actor has no authoritative retailer.'
    );
  }

  const db = getDb();

  if (!db) {
    throw new Error(
      'USER_MANAGEMENT_UNAVAILABLE: Firestore is unavailable.'
    );
  }

  const snapshot = await db
    .collection('users')
    .where('retailerId', '==', retailerId)
    .get();

  const users: RetailerManagedUserSummary[] = [];

  for (const doc of snapshot.docs) {
    const profile = storedUserProfile(
      doc.id,
      doc.data() as Record<string, unknown>
    );

    if (!profile) {
      continue;
    }

    const decision = canManageUser(actor, profile);

    if (!decision.allowed) {
      continue;
    }

    users.push({
      uid: profile.uid,
      displayName: profile.displayName,
      email: profile.email,
      role: profile.role,
      scope: profile.scope,
      sidebarAccess: profile.sidebarAccess,
      isActive: profile.isActive,
    });
  }

  return users;
}

export async function createRetailerUser(
  input: CreateRetailerUserInput
): Promise<RetailerManagedUserSummary> {
  const actor = await verifyAuth(input.idToken);
  const authError = authFailureMessage(actor);

  if (authError) {
    throw new Error(`USER_MANAGEMENT_AUTH_FAILED: ${authError}`);
  }

  if ('error' in actor) {
    throw new Error('USER_MANAGEMENT_AUTH_FAILED: Authentication failed.');
  }

  requireRetailerUserManager(actor);

  const retailerId = actor.retailerId;

  if (!retailerId) {
    throw new Error(
      'USER_MANAGEMENT_FORBIDDEN: Actor has no authoritative retailer.'
    );
  }

  const provisionalProfile = buildRetailerManagedUserProfile(actor, {
    uid: '__proposed_retailer_user__',
    retailerId,
    displayName: input.displayName,
    email: input.email,
    role: input.role,
    scope: input.scope,
    sidebarAccess: input.sidebarAccess,
    isActive: true,
    createdBy: actor.uid,
    updatedBy: actor.uid,
  });

  const db = getDb();

  if (!db) {
    throw new Error(
      'USER_MANAGEMENT_UNAVAILABLE: Firestore is unavailable.'
    );
  }

  const auth = admin.auth();
  let createdUid: string | null = null;
  let profilePersisted = false;

  try {
    const userRecord = await auth.createUser({
      email: provisionalProfile.email,
      password: input.password,
      displayName: provisionalProfile.displayName,
      disabled: false,
    });

    createdUid = userRecord.uid;

    const finalProfile = buildRetailerManagedUserProfile(actor, {
      uid: createdUid,
      retailerId,
      displayName: provisionalProfile.displayName,
      email: provisionalProfile.email,
      role: provisionalProfile.role,
      scope: provisionalProfile.scope,
      sidebarAccess: provisionalProfile.sidebarAccess,
      isActive: true,
      createdBy: actor.uid,
      updatedBy: actor.uid,
    });

    const now = admin.firestore.Timestamp.now();

    await db
      .collection('users')
      .doc(createdUid)
      .set({
        ...finalProfile,
        createdAt: now,
        updatedAt: now,
      });

    profilePersisted = true;

    await writeRetailerUserAudit({
      type: 'RETAILER_USER_CREATED',
      retailerId,
      targetUid: createdUid,
      actorUid: actor.uid,
      role: finalProfile.role,
      scope: finalProfile.scope,
      sidebarAccess: finalProfile.sidebarAccess ?? null,
      timestamp: now,
    });

    return {
      uid: finalProfile.uid,
      displayName: finalProfile.displayName,
      email: finalProfile.email,
      role: finalProfile.role,
      scope: finalProfile.scope,
      sidebarAccess: finalProfile.sidebarAccess,
      isActive: finalProfile.isActive,
    };
  } catch (error) {
    if (createdUid && !profilePersisted) {
      try {
        await auth.deleteUser(createdUid);
      } catch (rollbackError) {
        console.error(
          '[RetailerUserManagement] Firebase Auth rollback failed:',
          rollbackError
        );
      }
    }

    throw error;
  }
}


export type UpdateRetailerUserAuthorizationInput = {
  idToken: string;
  targetUid: string;
  role: CanonicalRole;
  scope: AuthorizationScope;
  sidebarAccess?: SidebarAccess;
};

async function authenticatedRetailerUserManager(idToken: string) {
  const actor = await verifyAuth(idToken);
  const authError = authFailureMessage(actor);

  if (authError) {
    throw new Error(`USER_MANAGEMENT_AUTH_FAILED: ${authError}`);
  }

  if ('error' in actor) {
    throw new Error(
      'USER_MANAGEMENT_AUTH_FAILED: Authentication failed.'
    );
  }

  requireRetailerUserManager(actor);

  if (!actor.retailerId) {
    throw new Error(
      'USER_MANAGEMENT_FORBIDDEN: Actor has no authoritative retailer.'
    );
  }

  return actor;
}

async function loadAuthoritativeRetailerTarget(
  actor: AuthorizedContext,
  targetUid: string
): Promise<UserAuthorizationProfile> {
  if (!targetUid.trim()) {
    throw new Error(
      'USER_MANAGEMENT_INVALID: Target UID is required.'
    );
  }

  const db = getDb();

  if (!db) {
    throw new Error(
      'USER_MANAGEMENT_UNAVAILABLE: Firestore is unavailable.'
    );
  }

  const snapshot = await db
    .collection('users')
    .doc(targetUid)
    .get();

  if (!snapshot.exists) {
    throw new Error(
      'USER_MANAGEMENT_NOT_FOUND: Target user does not exist.'
    );
  }

  const profile = storedUserProfile(
    snapshot.id,
    snapshot.data() as Record<string, unknown>
  );

  if (!profile) {
    throw new Error(
      'USER_MANAGEMENT_INVALID: Target authorization profile is invalid.'
    );
  }

  requireRetailerTargetManagement(actor, profile);

  return profile;
}

export async function updateRetailerUserAuthorization(
  input: UpdateRetailerUserAuthorizationInput
): Promise<RetailerManagedUserSummary> {
  const actor = await authenticatedRetailerUserManager(
    input.idToken
  );

  const current = await loadAuthoritativeRetailerTarget(
    actor,
    input.targetUid
  );

  /*
   * The current target has already passed canManageUser().
   * Now independently authorize the proposed state so a manageable
   * user cannot be promoted or moved outside the actor's authority.
   */
  const proposed = buildRetailerManagedUserProfile(actor, {
    uid: current.uid,
    retailerId: current.retailerId,
    displayName: current.displayName,
    email: current.email,
    role: input.role,
    scope: input.scope,
    sidebarAccess: input.sidebarAccess,
    isActive: current.isActive,
    createdBy: current.createdBy,
    updatedBy: actor.uid,
  });

  const db = getDb();

  if (!db) {
    throw new Error(
      'USER_MANAGEMENT_UNAVAILABLE: Firestore is unavailable.'
    );
  }

  const now = admin.firestore.Timestamp.now();

  await db
    .collection('users')
    .doc(current.uid)
    .update({
      role: proposed.role,
      scope: proposed.scope,
      permissions: proposed.permissions,
      sidebarAccess: proposed.sidebarAccess ?? null,
      updatedAt: now,
      updatedBy: actor.uid,
    });

  await writeRetailerUserAudit({
    type: 'RETAILER_USER_AUTHORIZATION_UPDATED',
    retailerId: actor.retailerId,
    targetUid: current.uid,
    actorUid: actor.uid,
    previous: {
      role: current.role,
      scope: current.scope,
      sidebarAccess: current.sidebarAccess ?? null,
    },
    current: {
      role: proposed.role,
      scope: proposed.scope,
      sidebarAccess: proposed.sidebarAccess ?? null,
    },
    timestamp: now,
  });

  return {
    uid: proposed.uid,
    displayName: proposed.displayName,
    email: proposed.email,
    role: proposed.role,
    scope: proposed.scope,
    sidebarAccess: proposed.sidebarAccess,
    isActive: proposed.isActive,
  };
}

async function setRetailerUserActiveState(input: {
  idToken: string;
  targetUid: string;
  isActive: boolean;
}): Promise<RetailerManagedUserSummary> {
  const actor = await authenticatedRetailerUserManager(
    input.idToken
  );

  const current = await loadAuthoritativeRetailerTarget(
    actor,
    input.targetUid
  );

  const db = getDb();

  if (!db) {
    throw new Error(
      'USER_MANAGEMENT_UNAVAILABLE: Firestore is unavailable.'
    );
  }

  const now = admin.firestore.Timestamp.now();
  const auth = admin.auth();
  const authUser = await auth.getUser(current.uid);
  const previousAuthDisabled = authUser.disabled;
  const nextAuthDisabled = !input.isActive;

  await auth.updateUser(current.uid, {
    disabled: nextAuthDisabled,
  });

  try {
    await db
      .collection('users')
      .doc(current.uid)
      .update({
        isActive: input.isActive,
        updatedAt: now,
        updatedBy: actor.uid,
      });
  } catch (error) {
    try {
      await auth.updateUser(current.uid, {
        disabled: previousAuthDisabled,
      });
    } catch (compensationError) {
      console.error(
        '[RetailerUserManagement] Failed to restore Firebase Auth state after profile update failure:',
        compensationError
      );
    }

    throw error;
  }

  await writeRetailerUserAudit({
    type: input.isActive
      ? 'RETAILER_USER_REACTIVATED'
      : 'RETAILER_USER_SUSPENDED',
    retailerId: actor.retailerId,
    targetUid: current.uid,
    actorUid: actor.uid,
    previousIsActive: current.isActive,
    currentIsActive: input.isActive,
    timestamp: now,
  });

  return {
    uid: current.uid,
    displayName: current.displayName,
    email: current.email,
    role: current.role,
    scope: current.scope,
    sidebarAccess: current.sidebarAccess,
    isActive: input.isActive,
  };
}

export async function suspendRetailerUser(input: {
  idToken: string;
  targetUid: string;
}): Promise<RetailerManagedUserSummary> {
  return setRetailerUserActiveState({
    ...input,
    isActive: false,
  });
}

export async function reactivateRetailerUser(input: {
  idToken: string;
  targetUid: string;
}): Promise<RetailerManagedUserSummary> {
  return setRetailerUserActiveState({
    ...input,
    isActive: true,
  });
}
