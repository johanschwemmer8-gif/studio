'use server';

import { ai } from '@/ai/genkit';
import { getOverviewIntelligence } from '@/ai/flows/get-overview-intelligence';
import { getScanStatistics } from '@/ai/flows/get-scan-statistics';
import { getDecisionJourneyIntelligence } from '@/ai/flows/decision-journey-intelligence';
import { resolveEffectiveAiGovernance } from '@/lib/ai-governance/resolve-effective-ai-governance';
import {
  buildUnavailableDecisionIntelligenceBrief,
  validateDecisionIntelligenceBrief,
} from '@/lib/decision-intelligence-brief';
import {
  DecisionIntelligenceBriefProposalSchema,
  type DecisionIntelligenceBrief,
} from '@/lib/schemas/decision-intelligence-brief';

const CAPABILITY_ID = 'RETAIL_AGGREGATE_INTELLIGENCE' as const;

type EvidenceEntry = {
  ref: string;
  domain: string;
  fact: string;
};

function addEvidence(
  entries: EvidenceEntry[],
  ref: string,
  domain: string,
  fact: string,
): void {
  entries.push({ ref, domain, fact });
}

export async function generateDecisionIntelligenceBrief(
  idToken: string | undefined,
): Promise<DecisionIntelligenceBrief> {
  if (!idToken) {
    return buildUnavailableDecisionIntelligenceBrief(
      'Authenticated retailer evidence is required before AI interpretation can run.',
    );
  }

  try {
    /*
     * These canonical intelligence functions independently authenticate the
     * caller and derive retailer authority server-side. The browser does not
     * supply trusted retailer, store, campaign or metric authority.
     */
    /*
     * Overview establishes the first canonical server-resolved retailer
     * boundary. Decision Journey independently authorizes that retailer ID
     * against the authenticated caller. Scan Statistics independently derives
     * its own retailer authority.
     */
    const overview = await getOverviewIntelligence(idToken);

    const [scans, journey] = await Promise.all([
      getScanStatistics(idToken),
      getDecisionJourneyIntelligence(
        idToken,
        overview.retailerId,
        30,
        undefined,
      ),
    ]);

    if (
      overview.retailerId !== scans.retailerId ||
      overview.retailerId !== journey.retailerId
    ) {
      return buildUnavailableDecisionIntelligenceBrief(
        'Authoritative intelligence sources did not resolve to one retailer boundary.',
      );
    }

    const retailerId = overview.retailerId;
    const evidence: EvidenceEntry[] = [];

    const overviewMetrics = [
      overview.pointOfDecisionActivity.qrExposures,
      overview.pointOfDecisionActivity.qualifyingShopperSessions,
      overview.pointOfDecisionActivity.ariInteractions,
      overview.pointOfDecisionActivity.decisionSignals,
      overview.activityIntelligence.informationRequests,
      overview.activityIntelligence.productComparisons,
      overview.activityIntelligence.purchaseBarriersConcerns,
      overview.activityIntelligence.productConsideration,
    ];

    for (const metric of overviewMetrics) {
      if (
        (metric.status === 'MEASURED' || metric.status === 'NO_ACTIVITY') &&
        metric.value !== null
      ) {
        addEvidence(
          evidence,
          `overview:${metric.metricId}`,
          'OVERVIEW',
          `${metric.metricId} = ${metric.value} ${metric.unit}; evidence level ${metric.evidenceLevel}; evidence count ${metric.evidenceCount}.`,
        );
      }
    }

    if (
      (scans.qrExposures.status === 'MEASURED' ||
        scans.qrExposures.status === 'NO_ACTIVITY') &&
      scans.qrExposures.value !== null
    ) {
      addEvidence(
        evidence,
        'scan-statistics:qr-exposures',
        'CAMPAIGN_POD',
        `QR exposures = ${scans.qrExposures.value}.`,
      );
    }

    if (
      (scans.qualifyingShopperSessions.status === 'MEASURED' ||
        scans.qualifyingShopperSessions.status === 'NO_ACTIVITY') &&
      scans.qualifyingShopperSessions.value !== null
    ) {
      addEvidence(
        evidence,
        'scan-statistics:qualifying-sessions',
        'CAMPAIGN_POD',
        `Qualifying shopper sessions = ${scans.qualifyingShopperSessions.value}.`,
      );
    }

    if (
      (scans.exposureToSessionRatePercent.status === 'MEASURED' ||
        scans.exposureToSessionRatePercent.status === 'NO_ACTIVITY') &&
      scans.exposureToSessionRatePercent.value !== null
    ) {
      addEvidence(
        evidence,
        'scan-statistics:exposure-session-rate',
        'CAMPAIGN_POD',
        `Exposure-to-session rate = ${scans.exposureToSessionRatePercent.value}%.`,
      );
    }

    for (const row of scans.activationPerformance) {
      addEvidence(
        evidence,
        `activation:${row.activationId}:deployment:${row.deploymentId}:qr:${row.qrCodeId}`,
        'CAMPAIGN_POD',
        `Store ${row.storeName}; campaign ${row.campaignId}; activation ${row.activationId}; deployment ${row.deploymentId}; QR ${row.qrCodeId}; exposures ${row.qrExposures}; qualifying sessions ${row.qualifyingShopperSessions}; exposure-to-session rate ${
          row.exposureToSessionRatePercent === null
            ? 'unavailable'
            : `${row.exposureToSessionRatePercent}%`
        }.`,
      );
    }

    for (const stage of journey.funnel) {
      addEvidence(
        evidence,
        `journey-stage:${stage.stage}`,
        'DECISION_JOURNEY',
        `${stage.stage}: ${stage.uniqueSessions} unique sessions; numerator ${stage.numerator}; denominator ${stage.denominator}; rate ${stage.rate}%; denominator ${stage.denominatorName}.`,
      );
    }

    for (const [index, rejection] of journey.rejectionBreakdown.entries()) {
      addEvidence(
        evidence,
        `rejection:${index}`,
        'SHOPPER_BEHAVIOR',
        `${rejection.reason}: count ${rejection.count}; share ${rejection.share}%.`,
      );
    }

    for (const [index, barrier] of journey.barrierBreakdown.entries()) {
      addEvidence(
        evidence,
        `barrier:${index}`,
        'SHOPPER_BEHAVIOR',
        `${barrier.barrier}: count ${barrier.count}; share ${barrier.share}%.`,
      );
    }

    for (const movement of journey.altProductBreakdown) {
      addEvidence(
        evidence,
        `alternative-product:${movement.gtin}`,
        'SHOPPER_BEHAVIOR',
        `Alternative GTIN ${movement.gtin}: ${movement.uniqueSessions} unique sessions; movement rate ${movement.rate}%; verified purchase count ${movement.purchaseCount}.`,
      );
    }

    /*
     * Inventory is intentionally represented as a limitation, not evidence.
     * Shopper demand must never be converted into stock availability.
     */
    const fixedLimitations = [
      'No authoritative inventory, stock-on-hand or product-availability evidence is present unless supplied by a retailer-approved external integration.',
      'Observed associations do not by themselves establish causality.',
      'Anonymous shopper-session evidence must not be interpreted as identified shopper identity or loyalty status.',
    ];

    if (evidence.length === 0) {
      return {
        status: 'INSUFFICIENT_EVIDENCE',
        executiveSummary:
          'The available authoritative evidence is not sufficient for an AI intelligence brief.',
        factualObservations: [],
        identifiedIndicators: [],
        suggestedActions: [],
        hypothesesToInvestigate: [],
        evidenceLimitations: fixedLimitations,
      };
    }

    const governance = await resolveEffectiveAiGovernance(
      CAPABILITY_ID,
      retailerId,
    );

    if (!governance.providerModelIdentifier) {
      return buildUnavailableDecisionIntelligenceBrief(
        'AI interpretation is not authorized by the effective governance policy.',
      );
    }

    const evidenceRefs = evidence.map(item => item.ref);

    const prompt = `
You are the governed Decision Intelligence interpretation layer for iNteract.

Your only evidence is the AUTHORITATIVE EVIDENCE PACKAGE below.

NON-NEGOTIABLE RULES:
- Do not invent, alter, estimate or complete any metric.
- Do not treat missing evidence as zero.
- Do not infer stock levels, stock availability or inventory movement.
- Do not infer identified shopper identity, loyalty status or demographic attributes.
- Do not claim causality from association.
- Factual observations must be directly supported by cited evidence.
- Indicators are interpretations, not facts.
- Suggested actions must be proportionate to the cited evidence.
- Hypotheses must remain explicitly investigatory.
- Every factual observation, indicator, suggested action and hypothesis must cite one or more evidenceRefs exactly as supplied.
- Never create an evidence reference.
- Evidence limitations must clearly state material constraints on interpretation.
- Prefer concise, retailer-useful language.

AUTHORITATIVE EVIDENCE PACKAGE:
${JSON.stringify(evidence, null, 2)}

MANDATORY EVIDENCE LIMITATIONS:
${JSON.stringify(fixedLimitations, null, 2)}
`.trim();

    const response = await ai.generate({
      model: governance.providerModelIdentifier,
      prompt,
      output: {
        schema: DecisionIntelligenceBriefProposalSchema,
      },
    });

    if (!response.output) {
      return buildUnavailableDecisionIntelligenceBrief(
        'The governed AI model did not return a structured intelligence interpretation.',
      );
    }

    const validated = validateDecisionIntelligenceBrief(
      { evidenceRefs },
      response.output,
    );

    if (validated.status !== 'AVAILABLE') {
      return validated;
    }

    return {
      ...validated,
      evidenceLimitations: Array.from(
        new Set([
          ...validated.evidenceLimitations,
          ...fixedLimitations,
        ]),
      ),
    };
  } catch (error) {
    console.error(
      'Governed Decision Intelligence brief generation failed:',
      error,
    );

    return buildUnavailableDecisionIntelligenceBrief(
      'Governed AI interpretation is currently unavailable. Authoritative intelligence remains available.',
    );
  }
}
