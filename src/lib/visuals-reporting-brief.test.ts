import {
  buildUnavailableVisualsReportingBrief,
  validateVisualsReportingBrief,
} from './visuals-reporting-brief';

const proposal = {
  executiveSummary: 'Verified reporting evidence shows measurable activity.',
  factualObservations: [
    {
      statement: 'QR exposure activity was measured.',
      evidenceRefs: ['network:qrExposures'],
    },
  ],
  notablePatterns: [
    {
      statement: 'Qualifying sessions are present in the reporting period.',
      evidenceRefs: ['network:qualifyingShopperSessions'],
    },
  ],
  reportingLimitations: [
    'Missing evidence must not be interpreted as zero.',
  ],
};

describe('visuals-reporting-brief', () => {
  it('accepts statements grounded only in admissible evidence references', () => {
    const result = validateVisualsReportingBrief(
      {
        evidenceRefs: [
          'network:qrExposures',
          'network:qualifyingShopperSessions',
        ],
      },
      proposal,
    );

    expect(result.status).toBe('AVAILABLE');
    expect(result.factualObservations).toEqual(
      proposal.factualObservations,
    );
    expect(result.notablePatterns).toEqual(
      proposal.notablePatterns,
    );
  });

  it('returns insufficient evidence when no admissible evidence exists', () => {
    const result = validateVisualsReportingBrief(
      { evidenceRefs: [] },
      proposal,
    );

    expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.factualObservations).toEqual([]);
    expect(result.notablePatterns).toEqual([]);
  });

  it('rejects an interpretation that cites evidence outside the boundary', () => {
    const result = validateVisualsReportingBrief(
      {
        evidenceRefs: [
          'network:qrExposures',
          'network:qualifyingShopperSessions',
        ],
      },
      {
        ...proposal,
        factualObservations: [
          {
            statement: 'Invented revenue was measured.',
            evidenceRefs: ['invented:revenue'],
          },
        ],
      },
    );

    expect(result.status).toBe('INSUFFICIENT_EVIDENCE');
    expect(result.factualObservations).toEqual([]);
    expect(result.notablePatterns).toEqual([]);
    expect(result.reportingLimitations).toContain(
      'The AI Reporting Brief referenced evidence outside the verified reporting evidence boundary.',
    );
  });

  it('keeps Verified Reporting Evidence available when AI is unavailable', () => {
    const result = buildUnavailableVisualsReportingBrief(
      'AI governance did not authorize model execution.',
    );

    expect(result.status).toBe('AI_UNAVAILABLE');
    expect(result.executiveSummary).toContain(
      'Verified Reporting Evidence remains available',
    );
    expect(result.factualObservations).toEqual([]);
    expect(result.notablePatterns).toEqual([]);
  });
});
