
'use server';
/**
 * @fileOverview A Genkit flow to process subscription payments with Stripe.
 *
 * - processSubscriptionPayment - Creates a Stripe Checkout session for a subscription.
 * - ProcessSubscriptionPaymentInput - The input type for the flow.
 * - ProcessSubscriptionPaymentOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Stripe from 'stripe';

const ProcessSubscriptionPaymentInputSchema = z.object({
  planId: z.string().describe("The ID of the plan the user is subscribing to (e.g., 'pro_plan')."),
  retailerId: z.string().describe('The ID of the retailer making the purchase.'),
});
export type ProcessSubscriptionPaymentInput = z.infer<typeof ProcessSubscriptionPaymentInputSchema>;

const ProcessSubscriptionPaymentOutputSchema = z.object({
  sessionId: z.string().describe('The ID of the Stripe Checkout session.'),
});
export type ProcessSubscriptionPaymentOutput = z.infer<typeof ProcessSubscriptionPaymentOutputSchema>;

export async function processSubscriptionPayment(input: ProcessSubscriptionPaymentInput): Promise<ProcessSubscriptionPaymentOutput> {
  // In a real environment, you'd add auth/permission checks here to ensure
  // the authenticated user matches the retailerId.
  return processSubscriptionPaymentFlow(input);
}


const processSubscriptionPaymentFlow = ai.defineFlow(
  {
    name: 'processSubscriptionPaymentFlow',
    inputSchema: ProcessSubscriptionPaymentInputSchema,
    outputSchema: ProcessSubscriptionPaymentOutputSchema,
  },
  async ({ planId, retailerId }) => {
    
    // Ensure the Stripe Secret Key is set in your environment variables.
    // Do NOT hardcode it here.
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
        throw new Error('Stripe secret key is not configured. Please set STRIPE_SECRET_KEY in your environment variables.');
    }
    
    try {
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2024-06-20',
        });

        // Map your internal planId to your Stripe Price IDs.
        // These are example IDs. Replace them with your actual Price IDs from your Stripe dashboard.
        const priceIds: { [key: string]: string } = {
            'basic': 'price_basic_plan_id_from_stripe',
            'pro': 'price_pro_plan_id_from_stripe',
            'enterprise': 'price_enterprise_plan_id_from_stripe'
        };

        const priceId = priceIds[planId];

        if (!priceId) {
            throw new Error(`Invalid planId: ${planId}. No matching Price ID found.`);
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/retailer-mvp/billing?payment_success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/retailer-mvp/billing?payment_canceled=true`,
            // Pass retailerId in metadata to identify the customer in webhook events
            metadata: {
                retailerId: retailerId,
            }
        });

        if (!session.id) {
            throw new Error('Failed to create a Stripe session.');
        }

        return { sessionId: session.id };
        
    } catch (error: any) {
        console.error('Stripe session creation failed:', error);
        // It's crucial to throw the error so the flow fails and the client can handle it.
        throw new Error(`Failed to create payment session: ${error.message}`);
    }
  }
);
