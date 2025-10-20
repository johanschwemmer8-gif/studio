
'use server';
/**
 * @fileOverview A Genkit flow to retrieve registered display devices.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const GetDisplaysInputSchema = z.object({
  retailerId: z.string(),
});

const DisplaySchema = z.object({
    displayId: z.string(),
    retailerId: z.string(),
    storeId: z.string(),
    contentConfigId: z.string().optional(),
    status: z.enum(['online', 'offline', 'error']),
    lastPing: z.string(),
});
export type Display = z.infer<typeof DisplaySchema>;

export const getDisplays = ai.defineFlow(
  {
    name: 'getDisplays',
    inputSchema: GetDisplaysInputSchema,
    outputSchema: z.array(DisplaySchema),
  },
  async ({ retailerId }) => {
    // In a real application, this would query Firestore.
    // We are returning mock data here to avoid backend authentication issues in the dev environment.

    const mockDisplays: Display[] = [
        {
            displayId: 'display_sandton_001',
            retailerId: retailerId,
            storeId: 'Sandton City',
            contentConfigId: 'config_1716386400002',
            status: 'online',
            lastPing: new Date().toISOString(),
        },
        {
            displayId: 'display_gateway_002',
            retailerId: retailerId,
            storeId: 'Gateway',
            contentConfigId: 'config_1716386400000',
            status: 'offline',
            lastPing: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        },
        {
            displayId: 'display_canalwalk_003',
            retailerId: retailerId,
            storeId: 'Canal Walk',
            contentConfigId: 'config_1716386400001',
            status: 'error',
            lastPing: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        }
    ];
    
    // Filter by retailerId just as the real query would
    return mockDisplays.filter(d => d.retailerId === retailerId);
  }
);
