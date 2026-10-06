import type {
  VisualsReportingMetric,
  VisualsReportingResponse,
} from '@/lib/schemas/visuals-reporting';
import { scopeKey } from '@/lib/visuals-reporting';

export type VisualsReportingBriefEvidenceEntry = {
  ref: string;
  domain: string;
  fact: string;
};

export type VisualsReportingBriefEvidencePackage = {
  context: {
    scope: string;
    reportingPeriod: {
      startAt: string;
      endAt: string;
      granularity: string;
      timezone: string | null;
    };
  };
  evidence: VisualsReportingBriefEvidenceEntry[];
  limitations: string[];
};

function addEvidence(
  evidence: VisualsReportingBriefEvidenceEntry[],
  ref: string,
  domain: string,
  fact: string,
): void {
  evidence.push({ ref, domain, fact });
}

function addMetric(
  evidence: VisualsReportingBriefEvidenceEntry[],
  limitations: string[],
  ref: string,
  domain: string,
  label: string,
  metric: VisualsReportingMetric,
): void {
  if (
    (metric.status === 'MEASURED' ||
      metric.status === 'NO_ACTIVITY') &&
    metric.value !== null
  ) {
    addEvidence(
      evidence,
      ref,
      domain,
      `${label} = ${metric.value} ${metric.unit}; status ${metric.status}; evidence level ${metric.evidenceLevel}; evidence count ${metric.evidenceCount}.`,
    );
    return;
  }

  limitations.push(
    `${label}: status ${metric.status}; value unavailable; evidence level ${metric.evidenceLevel}; evidence count ${metric.evidenceCount}${
      metric.statusDetail ? `; ${metric.statusDetail}` : ''
    }.`,
  );
}

export function buildVisualsReportingBriefEvidence(
  report: VisualsReportingResponse,
): VisualsReportingBriefEvidencePackage {
  const evidence: VisualsReportingBriefEvidenceEntry[] = [];
  const limitations: string[] = [];

  addMetric(
    evidence,
    limitations,
    'network:qrExposures',
    'NETWORK_PERFORMANCE',
    'QR exposures',
    report.networkPerformance.qrExposures,
  );

  addMetric(
    evidence,
    limitations,
    'network:qualifyingShopperSessions',
    'NETWORK_PERFORMANCE',
    'Qualifying shopper sessions',
    report.networkPerformance.qualifyingShopperSessions,
  );

  addMetric(
    evidence,
    limitations,
    'network:exposureToSessionRatePercent',
    'NETWORK_PERFORMANCE',
    'Exposure-to-session rate',
    report.networkPerformance.exposureToSessionRatePercent,
  );

  addMetric(
    evidence,
    limitations,
    'network:ariInteractions',
    'NETWORK_PERFORMANCE',
    'ARI interactions',
    report.networkPerformance.ariInteractions,
  );

  addMetric(
    evidence,
    limitations,
    'network:decisionSignals',
    'NETWORK_PERFORMANCE',
    'Decision signals',
    report.networkPerformance.decisionSignals,
  );

  for (const organization of report.organizationalPerformance) {
    const organizationKey = scopeKey(organization.scope);
    const domain = 'ORGANISATIONAL_PERFORMANCE';
    const prefix = `organization:${organizationKey}`;

    addMetric(
      evidence,
      limitations,
      `${prefix}:qrExposures`,
      domain,
      `${organization.displayName} QR exposures`,
      organization.qrExposures,
    );

    addMetric(
      evidence,
      limitations,
      `${prefix}:qualifyingShopperSessions`,
      domain,
      `${organization.displayName} qualifying shopper sessions`,
      organization.qualifyingShopperSessions,
    );

    addMetric(
      evidence,
      limitations,
      `${prefix}:exposureToSessionRatePercent`,
      domain,
      `${organization.displayName} exposure-to-session rate`,
      organization.exposureToSessionRatePercent,
    );

    addMetric(
      evidence,
      limitations,
      `${prefix}:ariInteractions`,
      domain,
      `${organization.displayName} ARI interactions`,
      organization.ariInteractions,
    );

    addMetric(
      evidence,
      limitations,
      `${prefix}:decisionSignals`,
      domain,
      `${organization.displayName} decision signals`,
      organization.decisionSignals,
    );
  }

  if (
    report.pointOfDecisionPerformance.status === 'AVAILABLE' ||
    report.pointOfDecisionPerformance.status === 'NO_ACTIVITY'
  ) {
    for (const stage of report.pointOfDecisionPerformance.funnel) {
      addEvidence(
        evidence,
        `pod:funnel:${stage.stage}`,
        'POINT_OF_DECISION',
        `${stage.stage}: ${stage.uniqueSessions} unique sessions; numerator ${stage.numerator}; denominator ${stage.denominator}; rate ${stage.rate}%; denominator basis ${stage.denominatorName}.`,
      );
    }

    for (const [index, reason] of report.pointOfDecisionPerformance.rejectionReasons.entries()) {
      addEvidence(
        evidence,
        `pod:rejection:${index}`,
        'POINT_OF_DECISION',
        `Rejection reason ${reason.label}: count ${reason.count}; share ${reason.sharePercent}%.`,
      );
    }

    for (const [index, barrier] of report.pointOfDecisionPerformance.purchaseBarriers.entries()) {
      addEvidence(
        evidence,
        `pod:barrier:${index}`,
        'POINT_OF_DECISION',
        `Purchase barrier ${barrier.label}: count ${barrier.count}; share ${barrier.sharePercent}%.`,
      );
    }

    for (const movement of report.pointOfDecisionPerformance.alternativeProductMovement) {
      addEvidence(
        evidence,
        `pod:alternative-product:${movement.gtin}`,
        'POINT_OF_DECISION',
        `Alternative GTIN ${movement.gtin}: ${movement.uniqueSessions} unique sessions; movement rate ${movement.movementRatePercent}%; verified purchase count ${movement.verifiedPurchaseCount}.`,
      );
    }
  } else {
    limitations.push(
      `Point-of-Decision performance status ${report.pointOfDecisionPerformance.status}${
        report.pointOfDecisionPerformance.statusDetail
          ? `; ${report.pointOfDecisionPerformance.statusDetail}`
          : ''
      }.`,
    );
  }

  for (const activation of report.campaignActivationPerformance) {
    addEvidence(
      evidence,
      `activation:${activation.activationId}:deployment:${activation.deploymentId}:qr:${activation.qrCodeId}`,
      'CAMPAIGN_ACTIVATION',
      `Store ${activation.storeName}; campaign ${activation.campaignId}; activation ${activation.activationId}; deployment ${activation.deploymentId}; QR ${activation.qrCodeId}; QR exposures ${activation.qrExposures}; qualifying shopper sessions ${activation.qualifyingShopperSessions}; exposure-to-session rate ${
        activation.exposureToSessionRatePercent === null
          ? 'unavailable'
          : `${activation.exposureToSessionRatePercent}%`
      }; latest exposure ${
        activation.latestExposureAt ?? 'unavailable'
      }.`,
    );
  }

  addMetric(
    evidence,
    limitations,
    'commerce:verifiedPurchases',
    'COMMERCE_OUTCOMES',
    'Verified purchases',
    report.commerceOutcomes.verifiedPurchases,
  );

  addMetric(
    evidence,
    limitations,
    'commerce:associatedRevenue',
    'COMMERCE_OUTCOMES',
    'Associated revenue',
    report.commerceOutcomes.associatedRevenue,
  );

  addMetric(
    evidence,
    limitations,
    'commerce:conversionRatePercent',
    'COMMERCE_OUTCOMES',
    'Conversion rate',
    report.commerceOutcomes.conversionRatePercent,
  );

  addMetric(
    evidence,
    limitations,
    'commerce:averageBasketValue',
    'COMMERCE_OUTCOMES',
    'Average basket value',
    report.commerceOutcomes.averageBasketValue,
  );

  limitations.push(
    'Missing, unavailable, insufficient or limited evidence must not be interpreted as zero.',
    'Observed associations do not by themselves establish causality.',
    'Anonymous shopper-session evidence must not be interpreted as identified shopper identity, loyalty status or demographic attributes.',
    'Inventory, stock-on-hand and product availability must not be inferred unless authoritative inventory evidence is explicitly present.',
  );

  return {
    context: {
      scope: scopeKey(report.scope),
      reportingPeriod: {
        startAt: report.reportingPeriod.startAt,
        endAt: report.reportingPeriod.endAt,
        granularity: report.reportingPeriod.granularity,
        timezone: report.reportingPeriod.timezone ?? null,
      },
    },
    evidence,
    limitations: Array.from(new Set(limitations)),
  };
}
