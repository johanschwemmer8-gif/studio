'use server';

import { ai } from '@/ai/genkit';
import { getVisualsReporting } from '@/ai/flows/get-visuals-reporting';
import { resolveEffectiveAiGovernance } from '@/lib/ai-governance/resolve-effective-ai-governance';
import {
  VisualsReportingBriefProposalSchema,
  type VisualsReportingBrief,
} from '@/lib/schemas/visuals-reporting-brief';
import {
  VisualsReportingRequestSchema,
  type VisualsReportingRequest,
} from '@/lib/schemas/visuals-reporting';
import {
  buildInsufficientVisualsReportingBrief,
  buildUnavailableVisualsReportingBrief,
  validateVisualsReportingBrief,
} from '@/lib/visuals-reporting-brief';
import {
  buildVisualsReportingBriefEvidence,
  type VisualsReportingBriefEvidencePackage,
} from '@/lib/visuals-reporting-brief-evidence';

const CAPABILITY_ID = 'RETAIL_AGGREGATE_INTELLIGENCE';

type GenerateVisualsReportingBriefInput = {
  idToken?: string;
  request: VisualsReportingRequest;
};

function buildPrompt(
  evidencePackage: VisualsReportingBriefEvidencePackage,
): string {
  return `
You are the governed AI Reporting Brief interpretation layer for iNteract Visuals & Reporting.

Your role is descriptive reporting interpretation only.

REPORTING CONTEXT:
${JSON.stringify(evidencePackage.context, null, 2)}

AUTHORITATIVE VERIFIED REPORTING EVIDENCE:
${JSON.stringify(evidencePackage.evidence, null, 2)}

MANDATORY REPORTING LIMITATIONS:
${JSON.stringify(evidencePackage.limitations, null, 2)}

NON-NEGOTIABLE RULES:
- Use only the authoritative verified reporting evidence supplied above.
- Reporting context defines scope and period but is not substantive evidence.
- Do not invent, alter, estimate, complete or recalculate any metric.
- Do not treat missing, unavailable, insufficient or limited evidence as zero.
- Do not infer inventory, stock-on-hand, product availability or stock movement.
- Do not infer identified shopper identity, loyalty status or demographic attributes.
- Do not claim causality from association.
- Do not expand beyond the supplied authorised reporting scope or reporting period.
- Factual observations must be directly supported by one or more evidenceRefs exactly as supplied.
- Notable patterns must be directly supported by one or more evidenceRefs exactly as supplied.
- Never create an evidence reference.
- Do not recommend actions.
- Do not propose hypotheses.
- Do not perform Decision Intelligence.
- Reporting limitations must clearly state material constraints on interpretation.
- Prefer concise, retailer-useful reporting language.
`.trim();
}

export async function generateVisualsReportingBrief(
  input: GenerateVisualsReportingBriefInput,
): Promise<VisualsReportingBrief> {
  const request = VisualsReportingRequestSchema.parse(
    input.request,
  );

  const report = await getVisualsReporting({
    idToken: input.idToken,
    request,
  });

  const evidencePackage =
    buildVisualsReportingBriefEvidence(report);

  if (evidencePackage.evidence.length === 0) {
    return buildInsufficientVisualsReportingBrief(
      'No substantive verified reporting evidence was available for AI interpretation.',
    );
  }

  try {
    const governance = await resolveEffectiveAiGovernance(
      CAPABILITY_ID,
      report.retailerId,
    );

    if (!governance.providerModelIdentifier) {
      return buildUnavailableVisualsReportingBrief(
        'AI reporting interpretation is not authorized by the effective governance policy.',
      );
    }

    const evidenceRefs = evidencePackage.evidence.map(
      item => item.ref,
    );

    const response = await ai.generate({
      model: governance.providerModelIdentifier,
      prompt: buildPrompt(evidencePackage),
      output: {
        schema: VisualsReportingBriefProposalSchema,
      },
    });

    if (!response.output) {
      return buildUnavailableVisualsReportingBrief(
        'The governed AI model did not return a structured reporting interpretation.',
      );
    }

    const validated = validateVisualsReportingBrief(
      { evidenceRefs },
      response.output,
    );

    if (validated.status !== 'AVAILABLE') {
      return validated;
    }

    return {
      ...validated,
      reportingLimitations: Array.from(
        new Set([
          ...validated.reportingLimitations,
          ...evidencePackage.limitations,
        ]),
      ),
    };
  } catch (error) {
    console.error(
      'Governed Visuals Reporting Brief generation failed:',
      error,
    );

    return buildUnavailableVisualsReportingBrief(
      'Governed AI reporting interpretation is currently unavailable. Verified Reporting Evidence remains available.',
    );
  }
}
