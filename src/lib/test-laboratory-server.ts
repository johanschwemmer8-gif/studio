'use server';

import { verifyPlatformOperator } from '@/lib/auth-server';
import { getDb } from '@/lib/firebase-admin';

export type DiagnosticStatus = 'PASS' | 'FAIL' | 'UNAVAILABLE';

export type DiagnosticResult = {
  diagnosticId: string;
  name: string;
  status: DiagnosticStatus;
  executedAt: string;
  evidence: string;
};

export type TestLaboratorySnapshot = {
  calculatedAt: string;
  diagnostics: {
    id: string;
    name: string;
    description: string;
  }[];
  evidenceBoundary: string;
};

const diagnosticCatalogue = [
  {
    id: 'platform-authorization',
    name: 'Platform Authorization',
    description:
      'Verify that the current request is authenticated as an active iNteract Platform Operator.',
  },
  {
    id: 'firestore-connectivity',
    name: 'Firestore Connectivity',
    description:
      'Execute a controlled read against Firestore from the application server without modifying production data.',
  },
  {
    id: 'runtime-configuration',
    name: 'Runtime Configuration',
    description:
      'Verify that required production runtime configuration is present without exposing secret values.',
  },
] as const;

export async function getTestLaboratorySnapshot(
  idToken: string
): Promise<TestLaboratorySnapshot> {
  await verifyPlatformOperator(idToken);

  return {
    calculatedAt: new Date().toISOString(),
    diagnostics: [...diagnosticCatalogue],
    evidenceBoundary:
      'A PASS proves only that the defined diagnostic succeeded when executed. It does not establish continuous production health, historical availability, performance, security assurance or ISO compliance.',
  };
}

export async function runTestLaboratoryDiagnostic(
  idToken: string,
  diagnosticId: string
): Promise<DiagnosticResult> {
  const executedAt = new Date().toISOString();

  try {
    await verifyPlatformOperator(idToken);

    if (diagnosticId === 'platform-authorization') {
      return {
        diagnosticId,
        name: 'Platform Authorization',
        status: 'PASS',
        executedAt,
        evidence:
          'The server verified the current session against the authoritative Platform Operator record.',
      };
    }

    if (diagnosticId === 'firestore-connectivity') {
      const db = getDb();

      if (!db) {
        return {
          diagnosticId,
          name: 'Firestore Connectivity',
          status: 'UNAVAILABLE',
          executedAt,
          evidence:
            'Firestore is unavailable to the application server for this diagnostic execution.',
        };
      }

      await db.collection('tenants').limit(1).get();

      return {
        diagnosticId,
        name: 'Firestore Connectivity',
        status: 'PASS',
        executedAt,
        evidence:
          'The application server successfully completed a controlled read from Firestore. No production data was modified.',
      };
    }

    if (diagnosticId === 'runtime-configuration') {
      const resolverBaseUrl = process.env.QR_RESOLVER_BASE_URL;
      const storageBucket = process.env.QR_TEMPLATE_STORAGE_BUCKET;
      const geminiKeyPresent = Boolean(process.env.GEMINI_API_KEY);

      const missing: string[] = [];

      if (!resolverBaseUrl) {
        missing.push('QR_RESOLVER_BASE_URL');
      } else {
        try {
          const url = new URL(resolverBaseUrl);
          if (
            url.protocol !== 'https:' ||
            url.pathname !== '/' ||
            url.search ||
            url.hash ||
            url.username ||
            url.password
          ) {
            missing.push('QR_RESOLVER_BASE_URL (invalid)');
          }
        } catch {
          missing.push('QR_RESOLVER_BASE_URL (invalid)');
        }
      }

      if (!storageBucket) {
        missing.push('QR_TEMPLATE_STORAGE_BUCKET');
      }

      if (!geminiKeyPresent) {
        missing.push('GEMINI_API_KEY');
      }

      if (missing.length > 0) {
        return {
          diagnosticId,
          name: 'Runtime Configuration',
          status: 'FAIL',
          executedAt,
          evidence: `Required runtime configuration is missing or invalid: ${missing.join(', ')}. Secret values were not returned.`,
        };
      }

      return {
        diagnosticId,
        name: 'Runtime Configuration',
        status: 'PASS',
        executedAt,
        evidence:
          'Required production runtime configuration is present. Secret values were not returned or exposed.',
      };
    }

    return {
      diagnosticId,
      name: 'Unknown Diagnostic',
      status: 'UNAVAILABLE',
      executedAt,
      evidence:
        'The requested diagnostic is not registered in the Test Laboratory.',
    };
  } catch (error) {
    return {
      diagnosticId,
      name:
        diagnosticCatalogue.find(item => item.id === diagnosticId)?.name ??
        'Diagnostic',
      status: 'FAIL',
      executedAt,
      evidence:
        error instanceof Error
          ? `Diagnostic execution failed: ${error.message}`
          : 'Diagnostic execution failed.',
    };
  }
}
