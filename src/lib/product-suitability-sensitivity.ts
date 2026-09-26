import type {
  ProductSuitabilitySensitivity,
} from '@/lib/product-suitability';

const MEDICAL_PATTERNS = [
  /\bmedical\b/i,
  /\bcondition\b/i,
  /\bdiagnos(?:e|ed|is|tic)\b/i,
  /\btreat(?:ment|ing)?\b/i,
  /\bmedication\b/i,
  /\bmedicine\b/i,
  /\bpregnan(?:t|cy)\b/i,
  /\ballerg(?:y|ic|ies)\b/i,
  /\bsymptom\b/i,
  /\bdoctor\b/i,
  /\bhealthcare\b/i,
];

const SAFETY_PATTERNS = [
  /\bsafe(?:ty)?\b/i,
  /\bhazard(?:ous)?\b/i,
  /\btoxic(?:ity)?\b/i,
  /\bflammable\b/i,
  /\belectrical\b/i,
  /\bvoltage\b/i,
  /\bload[- ]?bearing\b/i,
  /\bweight limit\b/i,
  /\bprotective\b/i,
  /\bemergency\b/i,
];

export function classifyProductSuitabilitySensitivity(
  requirement: string,
): ProductSuitabilitySensitivity {
  if (
    MEDICAL_PATTERNS.some((pattern) =>
      pattern.test(requirement),
    )
  ) {
    return 'MEDICAL';
  }

  if (
    SAFETY_PATTERNS.some((pattern) =>
      pattern.test(requirement),
    )
  ) {
    return 'SAFETY_SENSITIVE';
  }

  return 'STANDARD';
}
