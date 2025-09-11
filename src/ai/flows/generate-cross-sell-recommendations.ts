'use server';
/**
 * @fileOverview Generates cross-sell product recommendations based on a scanned product.
 *
 * - generateCrossSellRecommendations - A function that generates cross-sell recommendations.
 * - GenerateCrossSellRecommendationsInput - The input type for the generateCrossSellRecommendations function.
 * - GenerateCrossSellRecommendationsOutput - The return type for the generateCrossSellRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { retryWithBackoff } from '../utils';

const GenerateCrossSellRecommendationsInputSchema = z.object({
  productName: z.string().describe('The name of the product scanned.'),
  productDescription: z.string().describe('The description of the product scanned.'),
  productCategory: z.string().describe('The category of the product scanned.'),
  productPrice: z.number().describe('The price of the product scanned.'),
});
export type GenerateCrossSellRecommendationsInput = z.infer<typeof GenerateCrossSellRecommendationsInputSchema>;

const GenerateCrossSellRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      name: z.string().describe('The name of the recommended product.'),
      description: z.string().describe('The description of the recommended product.'),
      category: z.string().describe('The category of the recommended product.'),
      price: z.number().describe('The price of the recommended product.'),
      reason: z.string().describe('The reason for recommending this product.'),
    })
  ).describe('An array of product recommendations.'),
});
export type GenerateCrossSellRecommendationsOutput = z.infer<typeof GenerateCrossSellRecommendationsOutputSchema>;

export async function generateCrossSellRecommendations(input: GenerateCrossSellRecommendationsInput): Promise<GenerateCrossSellRecommendationsOutput> {
  return generateCrossSellRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCrossSellRecommendationsPrompt',
  input: {schema: GenerateCrossSellRecommendationsInputSchema},
  output: {schema: GenerateCrossSellRecommendationsOutputSchema},
  prompt: `You are an expert retail sales assistant. A customer has scanned a product.

  Based on the details of the scanned product, recommend other products that the customer may be interested in purchasing in addition to the scanned product.  Explain why you are recommending each product.

  Product Name: {{{productName}}}
  Product Description: {{{productDescription}}}
  Product Category: {{{productCategory}}}
  Product Price: {{{productPrice}}}

  Format your response as a JSON array of product recommendations.
  `,
});

const generateCrossSellRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateCrossSellRecommendationsFlow',
    inputSchema: GenerateCrossSellRecommendationsInputSchema,
    outputSchema: GenerateCrossSellRecommendationsOutputSchema,
  },
  async input => {
    return retryWithBackoff(async () => {
        const {output} = await prompt(input);
        if (!output) {
            throw new Error("No output from prompt.");
        }
        return output;
    });
  }
);
