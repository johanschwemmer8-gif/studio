'use server';
/**
 * @fileOverview A conversational AI flow for answering product-related questions.
 *
 * - productChat - A function that handles the conversational chat about a product.
 * - ProductChatInput - The input type for the productChat function.
 * - ProductChatOutput - The return type for the productChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductSchema = z.object({
    name: z.string().describe('The name of the product.'),
    description: z.string().describe('The description of the product.'),
    category: z.string().describe('The category of the product.'),
    price: z.number().describe('The price of the product.'),
});

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});

const ProductChatInputSchema = z.object({
  product: ProductSchema,
  history: z.array(ChatMessageSchema).describe("The chat history between the user and the model."),
});
export type ProductChatInput = z.infer<typeof ProductChatInputSchema>;

const ProductChatOutputSchema = z.object({
  message: z.string().describe("The model's response to the user."),
});
export type ProductChatOutput = z.infer<typeof ProductChatOutputSchema>;


export async function productChat(input: ProductChatInput): Promise<ProductChatOutput> {
    // In a real Firebase environment, you would check for App Check token here.
    // Example for a callable function:
    // if (context.app == undefined) {
    //   throw new functions.https.HttpsError(
    //     'failed-precondition',
    //     'The function must be called from an App Check verified app.'
    //   );
    // }

    // The entire conversation history, including the latest user message.
    const conversationHistory = input.history.map((msg) => ({
        role: msg.role,
        content: [{text: msg.content}],
    }));

    const llmResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        system: `You are a friendly and helpful in-store sales assistant. Your goal is to answer the customer's questions about the product they are looking at. Keep your answers concise and conversational.

        Here is the product information:
        - Name: ${input.product.name}
        - Description: ${input.product.description}
        - Category: ${input.product.category}
        - Price: R${input.product.price.toFixed(2)}
        `,
        messages: conversationHistory,
    });

    return { message: llmResponse.text };
}
