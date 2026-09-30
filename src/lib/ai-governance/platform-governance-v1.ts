/**
 * Canonical iNteract Platform AI Governance v1 control identity catalogue.
 *
 * This catalogue establishes stable governance domain and control identity.
 * It deliberately does NOT claim implementation, verification, effectiveness,
 * standards conformity or evidence merely because a control is listed here.
 *
 * Detailed control definitions and implementation/evidence mappings are
 * separate governance concerns.
 */

export const PLATFORM_AI_GOVERNANCE_V1_ID = 'INTERACT-AI-GOVERNANCE-V1';
export const PLATFORM_AI_GOVERNANCE_V1_VERSION = '1.0.0';

export type PlatformAiGovernanceControlIdentity = {
  controlId: string;
  title: string;
};

export type PlatformAiGovernanceDomainIdentity = {
  domainId: string;
  title: string;
  expectedControlCount: number;
  controls: readonly PlatformAiGovernanceControlIdentity[];
};

export const PLATFORM_AI_GOVERNANCE_V1_DOMAINS = [
  {
    domainId: 'GOV-01',
    title: 'Governance & Accountability',
    expectedControlCount: 9,
    controls: [
      { controlId: 'GOV-01-001', title: 'Platform AI Governance Authority' },
      { controlId: 'GOV-01-002', title: 'Defined Governance Accountability' },
      { controlId: 'GOV-01-003', title: 'AI Governance Approval Authority' },
      { controlId: 'GOV-01-004', title: 'Separation of Governance Requirement, Implementation, Verification & Effectiveness' },
      { controlId: 'GOV-01-005', title: 'Governance Change Accountability' },
      { controlId: 'GOV-01-006', title: 'Governance Review & Reassessment' },
      { controlId: 'GOV-01-007', title: 'Governance Nonconformity Accountability' },
      { controlId: 'GOV-01-008', title: 'Governance Transparency & Downstream Responsibility' },
      { controlId: 'GOV-01-009', title: 'AI Governance Competence & Awareness' },
    ],
  },
  {
    domainId: 'GOV-02',
    title: 'AI System & Capability Inventory',
    expectedControlCount: 8,
    controls: [
      { controlId: 'GOV-02-001', title: 'Complete Governed AI Capability Inventory' },
      { controlId: 'GOV-02-002', title: 'Stable Capability Identity' },
      { controlId: 'GOV-02-003', title: 'Defined Intended Use & Prohibited Use' },
      { controlId: 'GOV-02-004', title: 'Capability Ownership & Accountability' },
      { controlId: 'GOV-02-005', title: 'Capability Lifecycle, Suspension, Decommissioning & Retirement Governance' },
      { controlId: 'GOV-02-006', title: 'Model, Provider & Dependency Mapping' },
      { controlId: 'GOV-02-007', title: 'Applicable Governance & Risk Mapping' },
      { controlId: 'GOV-02-008', title: 'No Unregistered Production AI' },
    ],
  },
  {
    domainId: 'GOV-03',
    title: 'AI Risk Management',
    expectedControlCount: 9,
    controls: [
      { controlId: 'GOV-03-001', title: 'Proportionate AI Risk Assessment Coverage' },
      { controlId: 'GOV-03-002', title: 'Defined AI Risk Taxonomy' },
      { controlId: 'GOV-03-003', title: 'Evidence-Based Risk Evaluation' },
      { controlId: 'GOV-03-004', title: 'Inherent & Residual Risk Separation' },
      { controlId: 'GOV-03-005', title: 'Risk Treatment & Control Traceability' },
      { controlId: 'GOV-03-006', title: 'Residual Risk Acceptance Authority' },
      { controlId: 'GOV-03-007', title: 'Risk-Based Capability Authorization' },
      { controlId: 'GOV-03-008', title: 'Continuous Risk Reassessment' },
      { controlId: 'GOV-03-009', title: 'Explicit Uncertainty & Unknown Risk' },
    ],
  },
  {
    domainId: 'GOV-04',
    title: 'Intended Use & Boundaries',
    expectedControlCount: 8,
    controls: [
      { controlId: 'GOV-04-001', title: 'Explicit Intended Use' },
      { controlId: 'GOV-04-002', title: 'Explicit Prohibited Use' },
      { controlId: 'GOV-04-003', title: 'Capability Scope Boundary' },
      { controlId: 'GOV-04-004', title: 'Configuration Cannot Redefine Capability Authority' },
      { controlId: 'GOV-04-005', title: 'Out-of-Scope Request Handling' },
      { controlId: 'GOV-04-006', title: 'Material Scope Expansion Requires Reassessment' },
      { controlId: 'GOV-04-007', title: 'No Unauthorized Capability Chaining' },
      { controlId: 'GOV-04-008', title: 'Boundary Provenance & Runtime Traceability' },
    ],
  },
  {
    domainId: 'GOV-05',
    title: 'Evidence Integrity & Grounding',
    expectedControlCount: 5,
    controls: [
      { controlId: 'GOV-05-001', title: 'No Manufacturing of Facts' },
      { controlId: 'GOV-05-002', title: 'Authoritative Evidence Grounding' },
      { controlId: 'GOV-05-003', title: 'Explicit Insufficient-Evidence Behaviour' },
      { controlId: 'GOV-05-004', title: 'Evidence Provenance & Traceability' },
      { controlId: 'GOV-05-005', title: 'Evidence Failure Must Fail Safely' },
    ],
  },
  {
    domainId: 'GOV-06',
    title: 'Data Governance & Quality',
    expectedControlCount: 9,
    controls: [
      { controlId: 'GOV-06-001', title: 'Authoritative Data Source Identification' },
      { controlId: 'GOV-06-002', title: 'Data Provenance & Lineage' },
      { controlId: 'GOV-06-003', title: 'Data Quality & Suitability Validation' },
      { controlId: 'GOV-06-004', title: 'Data Completeness Must Not Be Assumed' },
      { controlId: 'GOV-06-005', title: 'Data Freshness & Temporal Validity' },
      { controlId: 'GOV-06-006', title: 'Conflicting Data Resolution' },
      { controlId: 'GOV-06-007', title: 'Data Transformation Integrity' },
      { controlId: 'GOV-06-008', title: 'Permitted Data Use Boundary' },
      { controlId: 'GOV-06-009', title: 'Data Quality Failure Must Propagate Safely' },
    ],
  },
  {
    domainId: 'GOV-07',
    title: 'Privacy & PII',
    expectedControlCount: 7,
    controls: [
      { controlId: 'GOV-07-001', title: 'Data Minimisation & Purpose Limitation' },
      { controlId: 'GOV-07-002', title: 'PII Protection & Exclusion' },
      { controlId: 'GOV-07-003', title: 'Lawful-Basis & Consent-Aware Processing' },
      { controlId: 'GOV-07-004', title: 'No Unauthorized Sensitive Inference' },
      { controlId: 'GOV-07-005', title: 'Anonymous/Pseudonymous/Unauthenticated Identity Separation' },
      { controlId: 'GOV-07-006', title: 'Controlled Retention & Deletion' },
      { controlId: 'GOV-07-007', title: 'AI Data Use & Model-Training Boundary' },
    ],
  },
  {
    domainId: 'GOV-08',
    title: 'Fairness & Harm Prevention',
    expectedControlCount: 9,
    controls: [
      { controlId: 'GOV-08-001', title: 'Fairness & Harm Risk Assessment' },
      { controlId: 'GOV-08-002', title: 'No Unjustified Differential Treatment' },
      { controlId: 'GOV-08-003', title: 'Protected & Sensitive Attribute Boundary' },
      { controlId: 'GOV-08-004', title: 'No Proxy Discrimination' },
      { controlId: 'GOV-08-005', title: 'Fairness Measurement Requires Valid Evidence' },
      { controlId: 'GOV-08-006', title: 'Synthetic Fairness Evidence Prohibited' },
      { controlId: 'GOV-08-007', title: 'Harm Prevention Overrides Commercial Optimization' },
      { controlId: 'GOV-08-008', title: 'Proportionate Evidence-Based Fairness & Harm Monitoring' },
      { controlId: 'GOV-08-009', title: 'Fairness Findings Require Investigation & Remediation' },
    ],
  },
  {
    domainId: 'GOV-09',
    title: 'Shopper Autonomy & Non-Manipulation',
    expectedControlCount: 6,
    controls: [
      { controlId: 'GOV-09-001', title: 'Shopper Decision Autonomy' },
      { controlId: 'GOV-09-002', title: 'Non-Manipulative AI Engagement' },
      { controlId: 'GOV-09-003', title: 'No Fabricated Urgency, Scarcity or Social Proof' },
      { controlId: 'GOV-09-004', title: 'Commercial Objective Subordination' },
      { controlId: 'GOV-09-005', title: 'Transparent Sponsored Influence' },
      { controlId: 'GOV-09-006', title: 'No Exploitation of Vulnerability or Behavioural Signals' },
    ],
  },
  {
    domainId: 'GOV-10',
    title: 'Recommendation Integrity & Neutrality',
    expectedControlCount: 7,
    controls: [
      { controlId: 'GOV-10-001', title: 'Evidence-Grounded Recommendations' },
      { controlId: 'GOV-10-002', title: 'Recommendation Criteria Integrity' },
      { controlId: 'GOV-10-003', title: 'Commercial Preference Independence' },
      { controlId: 'GOV-10-004', title: 'Comparison Integrity' },
      { controlId: 'GOV-10-005', title: 'Cross-Sell Recommendation Integrity' },
      { controlId: 'GOV-10-006', title: 'Recommendation Uncertainty & Alternatives' },
      { controlId: 'GOV-10-007', title: 'Recommendation Provenance & Explainability' },
    ],
  },
  {
    domainId: 'GOV-11',
    title: 'Safety & Suitability',
    expectedControlCount: 7,
    controls: [
      { controlId: 'GOV-11-001', title: 'Evidence-Grounded Suitability Assessment' },
      { controlId: 'GOV-11-002', title: 'Safety-Sensitive Context Recognition' },
      { controlId: 'GOV-11-003', title: 'No Unsupported Individualized Safety Declaration' },
      { controlId: 'GOV-11-004', title: 'Appropriate Escalation for Professional Judgment' },
      { controlId: 'GOV-11-005', title: 'Contraindication, Warning & Limitation Integrity' },
      { controlId: 'GOV-11-006', title: 'Uncertainty & Insufficient Safety Evidence' },
      { controlId: 'GOV-11-007', title: 'Safety Controls Override Commercial Configuration' },
    ],
  },
  {
    domainId: 'GOV-12',
    title: 'Transparency & Explainability',
    expectedControlCount: 9,
    controls: [
      { controlId: 'GOV-12-001', title: 'AI Interaction Transparency' },
      { controlId: 'GOV-12-002', title: 'Capability Purpose Transparency' },
      { controlId: 'GOV-12-003', title: 'Material Recommendation Explanation' },
      { controlId: 'GOV-12-004', title: 'Evidence & Source Transparency' },
      { controlId: 'GOV-12-005', title: 'Uncertainty & Limitation Transparency' },
      { controlId: 'GOV-12-006', title: 'Commercial Influence & Sponsorship Transparency' },
      { controlId: 'GOV-12-007', title: 'Governance Transparency to Retailers' },
      { controlId: 'GOV-12-008', title: 'No False Explainability' },
      { controlId: 'GOV-12-009', title: 'Protected Internal Reasoning & Security Boundary' },
    ],
  },
  {
    domainId: 'GOV-13',
    title: 'Human Oversight & Escalation',
    expectedControlCount: 9,
    controls: [
      { controlId: 'GOV-13-001', title: 'Defined Human Oversight Model' },
      { controlId: 'GOV-13-002', title: 'Human Authority Must Be Real' },
      { controlId: 'GOV-13-003', title: 'Defined Escalation Triggers' },
      { controlId: 'GOV-13-004', title: 'Qualified Escalation for Professional Judgment' },
      { controlId: 'GOV-13-005', title: 'No Fake Human Handoff' },
      { controlId: 'GOV-13-006', title: 'Human Intervention Must Not Weaken Mandatory Governance' },
      { controlId: 'GOV-13-007', title: 'Disputed AI Outcome, Complaint & Recourse' },
      { controlId: 'GOV-13-008', title: 'Emergency Restriction & Suspension Authority' },
      { controlId: 'GOV-13-009', title: 'Human Oversight Actions Must Be Auditable' },
    ],
  },
  {
    domainId: 'GOV-14',
    title: 'Security, Authorization & Tenant Isolation',
    expectedControlCount: 8,
    controls: [
      { controlId: 'GOV-14-001', title: 'Tenant Isolation' },
      { controlId: 'GOV-14-002', title: 'Server-Side Authorization Authority' },
      { controlId: 'GOV-14-003', title: 'Authoritative AI Execution Context' },
      { controlId: 'GOV-14-004', title: 'Privilege & Role Separation' },
      { controlId: 'GOV-14-005', title: 'Governance Configuration Integrity' },
      { controlId: 'GOV-14-006', title: 'Secure AI Configuration Precedence' },
      { controlId: 'GOV-14-007', title: 'Secrets, Credentials & AI Provider Boundary' },
      { controlId: 'GOV-14-008', title: 'Security & Governance Failure Must Fail Safely' },
    ],
  },
  {
    domainId: 'GOV-15',
    title: 'Monitoring, Logging & Auditability',
    expectedControlCount: 8,
    controls: [
      { controlId: 'GOV-15-001', title: 'Proportionate Authoritative AI Execution Logging' },
      { controlId: 'GOV-15-002', title: 'Governance Version & Control Provenance' },
      { controlId: 'GOV-15-003', title: 'Audit Record Integrity' },
      { controlId: 'GOV-15-004', title: 'Real Metrics Only' },
      { controlId: 'GOV-15-005', title: 'Synthetic/Test Data Identification' },
      { controlId: 'GOV-15-006', title: 'Monitoring Coverage & Failure Visibility' },
      { controlId: 'GOV-15-007', title: 'Evidence-Based Control Verification' },
      { controlId: 'GOV-15-008', title: 'Monitoring & Evidence Freshness' },
    ],
  },
  {
    domainId: 'GOV-16',
    title: 'AI Incident, Change & Supplier Governance',
    expectedControlCount: 12,
    controls: [
      { controlId: 'GOV-16-001', title: 'Defined AI Incident Classification' },
      { controlId: 'GOV-16-002', title: 'Risk-Based AI Incident Severity & Triage' },
      { controlId: 'GOV-16-003', title: 'AI Incident Containment & Safe State' },
      { controlId: 'GOV-16-004', title: 'Investigation, Remediation & Learning' },
      { controlId: 'GOV-16-005', title: 'Material AI Change Classification' },
      { controlId: 'GOV-16-006', title: 'Change Impact Assessment' },
      { controlId: 'GOV-16-007', title: 'AI Change Testing & Reverification' },
      { controlId: 'GOV-16-008', title: 'Change Provenance & Rollback' },
      { controlId: 'GOV-16-009', title: 'AI Supplier & Dependency Inventory' },
      { controlId: 'GOV-16-010', title: 'Proportionate Supplier Risk & Responsibility Assessment' },
      { controlId: 'GOV-16-011', title: 'Supplier Cannot Override iNteract Governance' },
      { controlId: 'GOV-16-012', title: 'Supplier Change, Failure & Exit Resilience' },
    ],
  },
  {
    domainId: 'GOV-17',
    title: 'Performance Evaluation & Continual Improvement',
    expectedControlCount: 10,
    controls: [
      { controlId: 'GOV-17-001', title: 'Risk-Appropriate AI Performance Framework' },
      { controlId: 'GOV-17-002', title: 'Governance Performance Distinct from Commercial Performance' },
      { controlId: 'GOV-17-003', title: 'Production Performance Claims Require Real Production Evidence' },
      { controlId: 'GOV-17-004', title: 'Metric Definition & Interpretation Integrity' },
      { controlId: 'GOV-17-005', title: 'Control Effectiveness Evaluation' },
      { controlId: 'GOV-17-006', title: 'Material Performance Degradation Detection' },
      { controlId: 'GOV-17-007', title: 'Controlled Continual Improvement' },
      { controlId: 'GOV-17-008', title: 'Improvement Cannot Optimize Around Governance' },
      { controlId: 'GOV-17-009', title: 'Performance Findings Drive Accountable Action' },
      { controlId: 'GOV-17-010', title: 'Periodic AI Management Review' },
    ],
  },
] as const satisfies readonly PlatformAiGovernanceDomainIdentity[];

export const PLATFORM_AI_GOVERNANCE_V1_CONTROLS =
  PLATFORM_AI_GOVERNANCE_V1_DOMAINS.flatMap((domain) =>
    domain.controls.map((control) => ({
      ...control,
      domainId: domain.domainId,
      domainTitle: domain.title,
    })),
  );

export const PLATFORM_AI_GOVERNANCE_V1_DOMAIN_COUNT =
  PLATFORM_AI_GOVERNANCE_V1_DOMAINS.length;

export const PLATFORM_AI_GOVERNANCE_V1_CONTROL_COUNT =
  PLATFORM_AI_GOVERNANCE_V1_CONTROLS.length;
