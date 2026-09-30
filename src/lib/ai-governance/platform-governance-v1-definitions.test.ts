import { PLATFORM_AI_GOVERNANCE_V1_CONTROLS } from './platform-governance-v1';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_01 } from './platform-governance-v1-gov-01';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_02 } from './platform-governance-v1-gov-02';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_03 } from './platform-governance-v1-gov-03';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_04 } from './platform-governance-v1-gov-04';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_05 } from './platform-governance-v1-gov-05';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_06 } from './platform-governance-v1-gov-06';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_07 } from './platform-governance-v1-gov-07';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_08 } from './platform-governance-v1-gov-08';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_09 } from './platform-governance-v1-gov-09';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_10 } from './platform-governance-v1-gov-10';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_11 } from './platform-governance-v1-gov-11';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_12 } from './platform-governance-v1-gov-12';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_13 } from './platform-governance-v1-gov-13';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_14 } from './platform-governance-v1-gov-14';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_15 } from './platform-governance-v1-gov-15';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_16 } from './platform-governance-v1-gov-16';
import { PLATFORM_AI_GOVERNANCE_V1_GOV_17 } from './platform-governance-v1-gov-17';

describe('Platform AI Governance v1 substantive definitions', () => {
  it('GOV-01 through GOV-17 contain exactly 140 canonical definitions', () => {
    const definitions = [
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_01,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_02,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_03,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_04,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_05,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_06,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_07,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_08,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_09,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_10,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_11,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_12,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_13,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_14,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_15,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_16,
      ...PLATFORM_AI_GOVERNANCE_V1_GOV_17,
    ];

    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_01).toHaveLength(9);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_02).toHaveLength(8);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_03).toHaveLength(9);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_04).toHaveLength(8);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_05).toHaveLength(5);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_06).toHaveLength(9);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_07).toHaveLength(7);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_08).toHaveLength(9);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_09).toHaveLength(6);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_10).toHaveLength(7);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_11).toHaveLength(7);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_12).toHaveLength(9);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_13).toHaveLength(9);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_14).toHaveLength(8);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_15).toHaveLength(8);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_16).toHaveLength(12);
    expect(PLATFORM_AI_GOVERNANCE_V1_GOV_17).toHaveLength(10);

    expect(definitions).toHaveLength(140);

    const definitionIds = definitions.map((definition) => definition.controlId);
    const catalogueIds = PLATFORM_AI_GOVERNANCE_V1_CONTROLS.map(
      (control) => control.controlId,
    );

    expect(new Set(definitionIds).size).toBe(140);
    expect(new Set(catalogueIds).size).toBe(140);

    expect([...definitionIds].sort()).toEqual([...catalogueIds].sort());

    const definitionById = new Map(
      definitions.map((definition) => [definition.controlId, definition]),
    );

    for (const control of PLATFORM_AI_GOVERNANCE_V1_CONTROLS) {
      const definition = definitionById.get(control.controlId);

      expect(definition).toBeDefined();

      const expectedDomain = control.controlId.split('-').slice(0, 2).join('-');

      expect(definition?.domain).toBe(expectedDomain);
      expect(definition?.title).toBe(control.title);
    }
  });
});
