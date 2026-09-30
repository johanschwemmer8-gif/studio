import {
  ACTIVE_AI_GOVERNANCE_POINTER_COLLECTION,
  ACTIVE_AI_GOVERNANCE_POINTER_DOCUMENT,
  governanceControlDocumentId,
  governancePolicyDocumentId,
} from './governance-document-ids';

describe('AI governance document identities', () => {
  test('builds a version-safe policy document ID', () => {
    expect(
      governancePolicyDocumentId(
        'INTERACT-AI-GOVERNANCE-V1',
        '1.0.0'
      )
    ).toBe('INTERACT-AI-GOVERNANCE-V1__1.0.0');
  });

  test('builds a version-safe control document ID', () => {
    expect(
      governanceControlDocumentId(
        'INTERACT-AI-GOVERNANCE-V1',
        '1.0.0',
        'GOV-14-003'
      )
    ).toBe(
      'INTERACT-AI-GOVERNANCE-V1__1.0.0__GOV-14-003'
    );
  });

  test('defines the canonical active governance pointer location', () => {
    expect(
      ACTIVE_AI_GOVERNANCE_POINTER_COLLECTION
    ).toBe('platformConfiguration');

    expect(
      ACTIVE_AI_GOVERNANCE_POINTER_DOCUMENT
    ).toBe('aiGovernance');
  });

  test.each([
    ['', '1.0.0'],
    ['   ', '1.0.0'],
    ['bad/id', '1.0.0'],
    ['INTERACT-AI-GOVERNANCE-V1', ''],
    ['INTERACT-AI-GOVERNANCE-V1', 'bad/version'],
  ])(
    'rejects invalid policy identity parts',
    (governanceId, governanceVersion) => {
      expect(() =>
        governancePolicyDocumentId(
          governanceId,
          governanceVersion
        )
      ).toThrow('AI_GOVERNANCE_INVALID_DOCUMENT_ID_PART');
    }
  );

  test('rejects an invalid control ID', () => {
    expect(() =>
      governanceControlDocumentId(
        'INTERACT-AI-GOVERNANCE-V1',
        '1.0.0',
        'bad/control'
      )
    ).toThrow(
      'AI_GOVERNANCE_INVALID_DOCUMENT_ID_PART:controlId'
    );
  });
});
