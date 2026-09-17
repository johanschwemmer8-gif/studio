import { z } from 'zod';

/**
 * Canonical physical QR presentation template contract.
 *
 * QR Presentation Templates control only how a QR artifact is rendered.
 * They must never define or mutate Campaign, Activation, Deployment,
 * product/GTIN, tracking URL, shopper-session, or QR identity.
 */

const HexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Expected a six-digit hexadecimal colour.');

export const QrTemplateGradientSchema = z.object({
  enabled: z.boolean().default(false),
  from: HexColorSchema.default('#000000'),
  to: HexColorSchema.default('#000000'),
  angle: z.number().min(0).max(360).default(0),
});

export const QrTemplateEyeColorsSchema = z.object({
  outer: HexColorSchema.default('#000000'),
  inner: HexColorSchema.default('#000000'),
});

export const QrTemplateBackgroundLogoSchema = z.object({
  enabled: z.boolean().default(false),
  logoPath: z.string().url().optional(),
  opacity: z.number().min(0.05).max(0.35).default(0.2),
});

export const QrTemplateDefaultsSchema = z.object({
  colorHex: HexColorSchema.default('#000000'),
  bgColorHex: HexColorSchema.default('#FFFFFF'),

  errorCorrection: z.enum(['L', 'M', 'Q', 'H']).default('M'),

  moduleStyle: z
    .enum([
      'square',
      'rounded',
      'dots',
      'classy',
      'classy-rounded',
      'extra-rounded',
    ])
    .default('square'),

  gradient: QrTemplateGradientSchema.default({
    enabled: false,
    from: '#000000',
    to: '#000000',
    angle: 0,
  }),

  eyeStyle: z.enum(['square', 'rounded', 'leaf']).default('square'),

  eyeColors: QrTemplateEyeColorsSchema.default({
    outer: '#000000',
    inner: '#000000',
  }),

  /**
   * Optional logo rendered as part of the QR presentation.
   * This is separate from backgroundLogo so both branding strategies
   * remain explicit in the canonical contract.
   */
  logoPath: z.string().url().optional(),

  logoSizeRatio: z.number().min(0.1).max(0.3).default(0.2),

  /**
   * Optional retailer branding rendered behind the QR modules.
   * Opacity is intentionally constrained to a conservative safety envelope.
   */
  backgroundLogo: QrTemplateBackgroundLogoSchema.default({
    enabled: false,
    opacity: 0.2,
  }),

  /**
   * Renderer margin / quiet-zone control.
   * A value below 4 is intentionally rejected.
   */
  quietZone: z.number().int().min(4).max(20).default(4),
});

export type QrTemplateDefaults = z.infer<typeof QrTemplateDefaultsSchema>;

export const QrTemplateSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  defaults: QrTemplateDefaultsSchema,
  retailerId: z.string().min(1),
});

export type QrTemplate = z.infer<typeof QrTemplateSchema>;

export const GetQrTemplatesInputSchema = z.object({
  idToken: z
    .string()
    .optional()
    .describe('Firebase ID token for authorization.'),
  retailerId: z.string().min(1),
});

export type GetQrTemplatesInput = z.infer<typeof GetQrTemplatesInputSchema>;

export const SaveQrTemplateInputSchema = z.object({
  idToken: z
    .string()
    .optional()
    .describe('Firebase ID token for authorization.'),

  retailerId: z.string().min(1),

  /**
   * Omit templateId to create a template.
   * Supply templateId to update an existing retailer-owned template.
   */
  templateId: z.string().min(1).optional(),

  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  defaults: QrTemplateDefaultsSchema,
});

export type SaveQrTemplateInput = z.infer<typeof SaveQrTemplateInputSchema>;

export const SaveQrTemplateOutputSchema = z.object({
  success: z.boolean(),
  templateId: z.string(),
});

export type SaveQrTemplateOutput = z.infer<
  typeof SaveQrTemplateOutputSchema
>;
