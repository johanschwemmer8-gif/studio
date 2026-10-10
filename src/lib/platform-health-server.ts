'use server';

import { verifyPlatformOperator } from '@/lib/auth-server';
import { getDb } from '@/lib/firebase-admin';

export type PlatformHealthMonitoringCapability = {
  id: string;
  name: string;
  status: 'NOT_CONFIGURED';
  detail: string;
};

export type PlatformHealthSnapshot = {
  calculatedAt: string;
  runtime: {
    hosting: 'Firebase App Hosting';
    cloudPlatform: 'Google Cloud';
    deploymentModel: 'Platform-managed production runtime';
    healthAssertion: null;
    healthMessage: string;
  };
  monitoring: {
    authoritativeHealthFeedConfigured: false;
    capabilities: PlatformHealthMonitoringCapability[];
  };
  incidents: {
    authoritativeIncidentRegisterConfigured: false;
    message: string;
  };
  governanceEvidence: {
    auditLogArchitectureAvailable: boolean;
    message: string;
  };
};

export async function getPlatformHealthSnapshot(
  idToken: string
): Promise<PlatformHealthSnapshot> {
  await verifyPlatformOperator(idToken);

  const db = getDb();

  if (!db) {
    throw new Error(
      'PLATFORM_HEALTH_UNAVAILABLE: Firestore is unavailable.'
    );
  }

  /*
   * Deliberately do not manufacture a health state here.
   *
   * Firebase App Hosting / Google Cloud provide the managed production
   * runtime, but this application does not currently consume an
   * authoritative runtime-health, uptime, telemetry or incident feed.
   *
   * The existence of Firestore and the successful execution of this
   * server action are not sufficient evidence to assert that the whole
   * platform is healthy.
   */
  return {
    calculatedAt: new Date().toISOString(),
    runtime: {
      hosting: 'Firebase App Hosting',
      cloudPlatform: 'Google Cloud',
      deploymentModel: 'Platform-managed production runtime',
      healthAssertion: null,
      healthMessage:
        'No authoritative platform-wide health assertion is currently available.',
    },
    monitoring: {
      authoritativeHealthFeedConfigured: false,
      capabilities: [
        {
          id: 'availability',
          name: 'Application availability monitoring',
          status: 'NOT_CONFIGURED',
          detail:
            'No authoritative application availability feed is currently integrated into Platform Health.',
        },
        {
          id: 'runtime-errors',
          name: 'Runtime error monitoring',
          status: 'NOT_CONFIGURED',
          detail:
            'No authoritative runtime error feed is currently integrated into Platform Health.',
        },
        {
          id: 'dependency-health',
          name: 'Critical dependency monitoring',
          status: 'NOT_CONFIGURED',
          detail:
            'No authoritative dependency-health feed is currently integrated into Platform Health.',
        },
        {
          id: 'performance',
          name: 'Performance and latency monitoring',
          status: 'NOT_CONFIGURED',
          detail:
            'No authoritative production latency or performance telemetry is currently integrated into Platform Health.',
        },
      ],
    },
    incidents: {
      authoritativeIncidentRegisterConfigured: false,
      message:
        'No authoritative platform incident register is currently configured.',
    },
    governanceEvidence: {
      auditLogArchitectureAvailable: true,
      message:
        'Governance audit logging exists for defined administrative and lifecycle actions. Audit logs are evidence records and are not a substitute for operational health telemetry.',
    },
  };
}
