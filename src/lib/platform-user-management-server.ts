import {
  type AuthorizationScope,
  type CanonicalRole,
  type UserAuthorizationProfile,
} from './auth-types';
import { verifyPlatformOperator } from './auth-server';
import {
  createUserAuthorizationProfile,
  getDefaultPermissions,
} from './user-profile';
import {
  isSidebarAccess,
  type SidebarAccess,
} from './retailer-navigation';
import { admin, getDb } from './firebase-admin';
import { isTenantActive } from './schemas/tenant';

export type ProposedPlatformRetailerUserAuthorization = {
  uid: string;
  retailerId: string;
  displayName: string;
  email: string;
  role: CanonicalRole;
  scope: AuthorizationScope;
  sidebarAccess?: SidebarAccess;
};

export type PlatformRetailerContext = {
  retailerId: string;
  retailerName?: string;
};

export async function requirePlatformUserAdministrator(
  idToken: string
) {
  if (!idToken.trim()) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_AUTH_FAILED: ID token is required.'
    );
  }

  try {
    return await verifyPlatformOperator(idToken);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Platform Operator authentication failed.';

    throw new Error(
      `PLATFORM_USER_MANAGEMENT_AUTH_FAILED: ${message}`
    );
  }
}

export async function requireActivePlatformRetailer(
  retailerId: string
): Promise<PlatformRetailerContext> {
  if (!retailerId.trim()) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_INVALID: Retailer ID is required.'
    );
  }

  const db = getDb();

  if (!db) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_UNAVAILABLE: Firestore is unavailable.'
    );
  }

  const snapshot = await db
    .collection('tenants')
    .doc(retailerId)
    .get();

  if (!snapshot.exists) {
    throw new Error(
      `PLATFORM_USER_MANAGEMENT_NOT_FOUND: Retailer '${retailerId}' does not exist.`
    );
  }

  const data = snapshot.data() as Record<string, unknown>;

  if (
    !isTenantActive(
      data.lifecycleStatus,
      data.status
    )
  ) {
    throw new Error(
      `PLATFORM_USER_MANAGEMENT_FORBIDDEN: Retailer '${retailerId}' is not active.`
    );
  }

  return {
    retailerId,
    retailerName:
      typeof data.name === 'string' && data.name.trim()
        ? data.name
        : undefined,
  };
}

export function buildPlatformManagedUserProfile(
  input: ProposedPlatformRetailerUserAuthorization
): UserAuthorizationProfile {
  if (!input.retailerId.trim()) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_INVALID: Retailer ID is required.'
    );
  }

  if (
    input.sidebarAccess !== undefined &&
    !isSidebarAccess(input.sidebarAccess)
  ) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_INVALID: Sidebar access is invalid.'
    );
  }

  if (
    input.scope.level === 'network' &&
    input.scope.networkId !== input.retailerId
  ) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_INVALID: Network scope does not belong to the selected retailer.'
    );
  }

  if (
    'networkId' in input.scope &&
    input.scope.networkId !== input.retailerId
  ) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_INVALID: Authorization scope does not belong to the selected retailer.'
    );
  }

  try {
    return createUserAuthorizationProfile({
      uid: input.uid,
      retailerId: input.retailerId,
      displayName: input.displayName,
      email: input.email,
      role: input.role,
      scope: input.scope,
      permissions: getDefaultPermissions(input.role),
      sidebarAccess: input.sidebarAccess,
      isActive: true,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Invalid retailer user authorization profile.';

    throw new Error(
      `PLATFORM_USER_MANAGEMENT_INVALID: ${message}`
    );
  }
}


export type PlatformManagedUserSummary = {
  uid: string;
  displayName: string;
  email: string;
  retailerId: string;
  role: CanonicalRole;
  scope: AuthorizationScope;
  sidebarAccess?: SidebarAccess;
  isActive: boolean;
};

export type CreatePlatformManagedRetailerUserInput = {
  idToken: string;
  retailerId: string;
  displayName: string;
  email: string;
  password: string;
  role: CanonicalRole;
  scope: AuthorizationScope;
  sidebarAccess?: SidebarAccess;
};

type PlatformAuditEvent = {
  type: string;
  actorUid: string;
  retailerId: string;
  targetUid: string;
  timestamp: unknown;
  [key: string]: unknown;
};

async function writePlatformUserAudit(
  event: PlatformAuditEvent
): Promise<void> {
  const db = getDb();

  if (!db) {
    console.error(
      '[Platform User Management] Audit unavailable: Firestore.'
    );
    return;
  }

  try {
    await db.collection('auditLogs').add(event);
  } catch (error) {
    console.error(
      '[Platform User Management] Audit write failed:',
      error instanceof Error ? error.message : error
    );
  }
}

export async function listPlatformRetailerUsers(
  idToken: string,
  retailerId: string
): Promise<PlatformManagedUserSummary[]> {
  await requirePlatformUserAdministrator(idToken);
  await requireActivePlatformRetailer(retailerId);

  const db = getDb();

  if (!db) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_UNAVAILABLE: Firestore is unavailable.'
    );
  }

  const snapshot = await db
    .collection('users')
    .where('retailerId', '==', retailerId)
    .get();

  const users: PlatformManagedUserSummary[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as Record<string, unknown>;

    try {
      const profile = createUserAuthorizationProfile({
        uid:
          typeof data.uid === 'string' && data.uid.trim()
            ? data.uid
            : doc.id,
        displayName:
          typeof data.displayName === 'string'
            ? data.displayName
            : '',
        email:
          typeof data.email === 'string'
            ? data.email
            : '',
        retailerId:
          typeof data.retailerId === 'string'
            ? data.retailerId
            : '',
        role: data.role as CanonicalRole,
        scope: data.scope as AuthorizationScope,
        permissions:
          data.permissions as UserAuthorizationProfile['permissions'],
        sidebarAccess:
          data.sidebarAccess as SidebarAccess | undefined,
        isActive: data.isActive === true,
      });

      if (profile.retailerId !== retailerId) {
        continue;
      }

      users.push({
        uid: profile.uid,
        displayName: profile.displayName,
        email: profile.email,
        retailerId: profile.retailerId,
        role: profile.role,
        scope: profile.scope,
        sidebarAccess: profile.sidebarAccess,
        isActive: profile.isActive,
      });
    } catch (error) {
      console.error(
        `[Platform User Management] Invalid user profile '${doc.id}' skipped:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return users.sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
}

export async function createPlatformRetailerUser(
  input: CreatePlatformManagedRetailerUserInput
): Promise<PlatformManagedUserSummary> {
  const operator = await requirePlatformUserAdministrator(
    input.idToken
  );

  await requireActivePlatformRetailer(input.retailerId);

  const db = getDb();

  if (!db) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_UNAVAILABLE: Firestore is unavailable.'
    );
  }

  if (!input.email.trim()) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_INVALID: Email is required.'
    );
  }

  if (!input.password) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_INVALID: Provisioning password is required.'
    );
  }

  /*
   * Validate the complete authorization proposal BEFORE creating
   * the Firebase Authentication identity.
   *
   * The temporary UID is used only for structural validation.
   * The authoritative UID comes from Firebase Auth below.
   */
  buildPlatformManagedUserProfile({
    uid: 'pending-auth-identity',
    retailerId: input.retailerId,
    displayName: input.displayName,
    email: input.email,
    role: input.role,
    scope: input.scope,
    sidebarAccess: input.sidebarAccess,
  });

  let createdUid: string | null = null;

  try {
    const auth = admin.auth();

    const userRecord = await auth.createUser({
      email: input.email,
      password: input.password,
      displayName: input.displayName,
      emailVerified: false,
    });

    createdUid = userRecord.uid;

    const profile = buildPlatformManagedUserProfile({
      uid: createdUid,
      retailerId: input.retailerId,
      displayName: input.displayName,
      email: input.email,
      role: input.role,
      scope: input.scope,
      sidebarAccess: input.sidebarAccess,
    });

    await db.collection('users').doc(createdUid).set({
      ...profile,
      provisionedAt:
        admin.firestore.FieldValue.serverTimestamp(),
      provisionedBy: operator.uid,
      updatedAt:
        admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: operator.uid,
      dataStatus: 'VERIFIED',
    });

    await writePlatformUserAudit({
      type: 'PLATFORM_RETAILER_USER_CREATED',
      actorUid: operator.uid,
      retailerId: input.retailerId,
      targetUid: createdUid,
      timestamp:
        admin.firestore.FieldValue.serverTimestamp(),
      role: profile.role,
      scope: profile.scope,
      sidebarAccess: profile.sidebarAccess,
    });

    return {
      uid: profile.uid,
      displayName: profile.displayName,
      email: profile.email,
      retailerId: profile.retailerId,
      role: profile.role,
      scope: profile.scope,
      sidebarAccess: profile.sidebarAccess,
      isActive: profile.isActive,
    };
  } catch (error) {
    if (createdUid) {
      try {
        await admin.auth().deleteUser(createdUid);

        console.warn(
          `[Platform User Management] Compensating Auth delete executed for ${createdUid}`
        );
      } catch (deleteError) {
        console.error(
          '[Platform User Management] Failed to delete orphaned Auth user:',
          deleteError instanceof Error
            ? deleteError.message
            : deleteError
        );
      }
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Platform retailer user creation failed.';

    throw new Error(
      `PLATFORM_USER_MANAGEMENT_CREATE_FAILED: ${message}`
    );
  }
}


export type UpdatePlatformRetailerUserAuthorizationInput = {
  idToken: string;
  retailerId: string;
  targetUid: string;
  role: CanonicalRole;
  scope: AuthorizationScope;
  sidebarAccess?: SidebarAccess;
};

type SetPlatformRetailerUserActiveStateInput = {
  idToken: string;
  retailerId: string;
  targetUid: string;
  isActive: boolean;
};

function platformManagedUserSummary(
  profile: UserAuthorizationProfile
): PlatformManagedUserSummary {
  return {
    uid: profile.uid,
    displayName: profile.displayName,
    email: profile.email,
    retailerId: profile.retailerId,
    role: profile.role,
    scope: profile.scope,
    sidebarAccess: profile.sidebarAccess,
    isActive: profile.isActive,
  };
}

async function loadAuthoritativePlatformRetailerTarget(
  retailerId: string,
  targetUid: string
): Promise<UserAuthorizationProfile> {
  if (!targetUid.trim()) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_INVALID: Target UID is required.'
    );
  }

  const db = getDb();

  if (!db) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_UNAVAILABLE: Firestore is unavailable.'
    );
  }

  const snapshot = await db
    .collection('users')
    .doc(targetUid)
    .get();

  if (!snapshot.exists) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_NOT_FOUND: Target user does not exist.'
    );
  }

  const data = snapshot.data() as Record<string, unknown>;

  let profile: UserAuthorizationProfile;

  try {
    profile = createUserAuthorizationProfile({
      uid:
        typeof data.uid === 'string' && data.uid.trim()
          ? data.uid
          : snapshot.id,
      displayName:
        typeof data.displayName === 'string'
          ? data.displayName
          : '',
      email:
        typeof data.email === 'string'
          ? data.email
          : '',
      retailerId:
        typeof data.retailerId === 'string'
          ? data.retailerId
          : '',
      role: data.role as CanonicalRole,
      scope: data.scope as AuthorizationScope,
      permissions:
        data.permissions as UserAuthorizationProfile['permissions'],
      sidebarAccess:
        data.sidebarAccess as SidebarAccess | undefined,
      isActive: data.isActive === true,
    });
  } catch {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_INVALID: Target authorization profile is invalid.'
    );
  }

  if (profile.retailerId !== retailerId) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_FORBIDDEN: Target user does not belong to the selected retailer.'
    );
  }

  return profile;
}

export async function updatePlatformRetailerUserAuthorization(
  input: UpdatePlatformRetailerUserAuthorizationInput
): Promise<PlatformManagedUserSummary> {
  const operator = await requirePlatformUserAdministrator(
    input.idToken
  );

  await requireActivePlatformRetailer(input.retailerId);

  const current =
    await loadAuthoritativePlatformRetailerTarget(
      input.retailerId,
      input.targetUid
    );

  /*
   * Platform Operator is a separate authority domain.
   * The proposed retailer authorization still has to satisfy the
   * canonical role/scope/sidebar contract and remain bound to the
   * explicitly selected retailer.
   */
  const proposed = buildPlatformManagedUserProfile({
    uid: current.uid,
    retailerId: current.retailerId,
    displayName: current.displayName,
    email: current.email,
    role: input.role,
    scope: input.scope,
    sidebarAccess: input.sidebarAccess,
  });

  const db = getDb();

  if (!db) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_UNAVAILABLE: Firestore is unavailable.'
    );
  }

  const now =
    admin.firestore.FieldValue.serverTimestamp();

  await db
    .collection('users')
    .doc(current.uid)
    .update({
      role: proposed.role,
      scope: proposed.scope,
      permissions: proposed.permissions,
      sidebarAccess: proposed.sidebarAccess ?? null,
      updatedAt: now,
      updatedBy: operator.uid,
    });

  await writePlatformUserAudit({
    type: 'PLATFORM_RETAILER_USER_AUTHORIZATION_UPDATED',
    actorUid: operator.uid,
    retailerId: input.retailerId,
    targetUid: current.uid,
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

  return platformManagedUserSummary({
    ...proposed,
    isActive: current.isActive,
  });
}

async function setPlatformRetailerUserActiveState(
  input: SetPlatformRetailerUserActiveStateInput
): Promise<PlatformManagedUserSummary> {
  const operator = await requirePlatformUserAdministrator(
    input.idToken
  );

  await requireActivePlatformRetailer(input.retailerId);

  const current =
    await loadAuthoritativePlatformRetailerTarget(
      input.retailerId,
      input.targetUid
    );

  const db = getDb();

  if (!db) {
    throw new Error(
      'PLATFORM_USER_MANAGEMENT_UNAVAILABLE: Firestore is unavailable.'
    );
  }

  const now =
    admin.firestore.FieldValue.serverTimestamp();

  await db
    .collection('users')
    .doc(current.uid)
    .update({
      isActive: input.isActive,
      updatedAt: now,
      updatedBy: operator.uid,
    });

  await writePlatformUserAudit({
    type: input.isActive
      ? 'PLATFORM_RETAILER_USER_REACTIVATED'
      : 'PLATFORM_RETAILER_USER_SUSPENDED',
    actorUid: operator.uid,
    retailerId: input.retailerId,
    targetUid: current.uid,
    previousIsActive: current.isActive,
    currentIsActive: input.isActive,
    timestamp: now,
  });

  return platformManagedUserSummary({
    ...current,
    isActive: input.isActive,
  });
}

export async function suspendPlatformRetailerUser(input: {
  idToken: string;
  retailerId: string;
  targetUid: string;
}): Promise<PlatformManagedUserSummary> {
  return setPlatformRetailerUserActiveState({
    ...input,
    isActive: false,
  });
}

export async function reactivatePlatformRetailerUser(input: {
  idToken: string;
  retailerId: string;
  targetUid: string;
}): Promise<PlatformManagedUserSummary> {
  return setPlatformRetailerUserActiveState({
    ...input,
    isActive: true,
  });
}
