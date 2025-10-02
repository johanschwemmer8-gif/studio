
import { z } from 'zod';

export const QrTemplateDefaultsSchema = z.object({
  colorHex: z.string().optional(),
  bgColorHex: z.string().optional(),
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
  retailerId: z.string(),
});

export const SaveQrTemplateInputSchema = z.object({
  retailerId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  defaults: QrTemplateDefaultsSchema,
});

export const SaveQrTemplateOutputSchema = z.object({
  success: z.boolean(),
  templateId: z.string(),
});
