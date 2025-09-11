
import { z } from 'zod';

export const QrTemplateSchema = z.object({
  templateId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  defaults: z.any(),
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
  defaults: z.any(),
});

export const SaveQrTemplateOutputSchema = z.object({
  success: z.boolean(),
  templateId: z.string(),
});
