
import { z } from 'zod';

export const QrTemplateDefaultsSchema = z.object({
  colorHex: z.string().optional(),
  bgColorHex: z.string().optional(),
  logoPath: z.string().url().optional(),
  errorCorrection: z.enum(['L', 'M', 'Q', 'H']).optional(),
  aiTone: z.string().optional(),
  aiGoal: z.string().optional(),
});

export const QrTemplateSchema = z.object({
  templateId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  defaults: QrTemplateDefaultsSchema,
  retailerId: z.string(),
});
export type QrTemplate = z.infer<typeof QrTemplateSchema>;

export const GetQrTemplatesInputSchema = z.object({
  idToken: z.string().optional().describe("Firebase ID token for authorization."),
  retailerId: z.string(),
});
export type GetQrTemplatesInput = z.infer<typeof GetQrTemplatesInputSchema>;

export const SaveQrTemplateInputSchema = z.object({
  idToken: z.string().optional().describe("Firebase ID token for authorization."),
  retailerId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  defaults: QrTemplateDefaultsSchema,
});
export type SaveQrTemplateInput = z.infer<typeof SaveQrTemplateInputSchema>;

export const SaveQrTemplateOutputSchema = z.object({
  success: z.boolean(),
  templateId: z.string(),
});
export type SaveQrTemplateOutput = z.infer<typeof SaveQrTemplateOutputSchema>;
