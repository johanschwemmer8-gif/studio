
'use server';
/**
 * @fileOverview A Genkit flow to calculate and aggregate executive-level ROI metrics.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin } from '@/lib/firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const RetailerMetricSchema = z.object({
    name: z.string(),
    totalScans: z.number(),
    basketUplift: z.number(),
    revenueUplift: z.number(),
    roi: z.number(),
});

const ExecutiveRoiMetricsOutputSchema = z.object({
    metrics: z.array(RetailerMetricSchema),
    aggregates: z.object({
        totalRevenueUplift: z.number(),
        averageBasketUplift: z.number(),
        averageRoi: z.number(),
    })
});

export type ExecutiveRoiMetricsOutput = z.infer<typeof ExecutiveRoiMetricsOutputSchema>;

export const getExecutiveRoiMetrics = ai.defineFlow(
  {
    name: 'getExecutiveRoiMetrics',
    inputSchema: z.void(),
    outputSchema: ExecutiveRoiMetricsOutputSchema,
  },
  async () => {
    const retailers = [
        { name: "Woolworths" },
        { name: "TFG" },
        { name: "Dis-Chem" }
    ];

    const metrics: z.infer<typeof RetailerMetricSchema>[] = retailers.map(retailer => {
        // High-fidelity mock generation for consistent prototype viewing
        const totalScans = Math.floor(Math.random() * 50000) + 12000;
        const basketUplift = Math.random() * 8 + 12; // 12% to 20%
        const revenueUplift = totalScans * (Math.random() * 5 + 4); // R4 to R9 per scan
        const roi = Math.random() * 2 + 3.5; // 3.5x to 5.5x
        
        return {
            name: retailer.name,
            totalScans,
            basketUplift,
            revenueUplift,
            roi,
        };
    });

    const totalRevenueUplift = metrics.reduce((acc, curr) => acc + curr.revenueUplift, 0);
    const averageBasketUplift = metrics.reduce((acc, curr) => acc + curr.basketUplift, 0) / metrics.length;
    const averageRoi = metrics.reduce((acc, curr) => acc + curr.roi, 0) / metrics.length;
    
    return {
        metrics,
        aggregates: {
            totalRevenueUplift,
            averageBasketUplift,
            averageRoi,
        }
    };
  }
);
