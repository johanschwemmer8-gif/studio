
'use server';
/**
 * @fileOverview A Genkit flow to calculate and aggregate executive-level ROI metrics across all retailers.
 *
 * - getExecutiveRoiMetrics - A flow that fetches data for all retailers and computes key metrics.
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
    const db = admin.firestore();
    
    // In a real application, you'd fetch this from the 'retailers' collection.
    // For now, we simulate by assuming access to the same source as the admin page.
    // This part is a placeholder for a more robust multi-tenant data aggregation strategy.
    const retailersSnapshot = await db.collection('savedRetailers').limit(1).get();
    
    let retailers: {name: string}[] = [];
    if (!retailersSnapshot.empty) {
        // This assumes retailers are stored in a document, which may need rethinking.
        // A better schema would be a 'retailers' collection. For now, we adapt.
        const data = retailersSnapshot.docs[0].data();
        if (data.retailers) retailers = data.retailers;
    }
    
    // If no retailers in DB, we'll return empty metrics.
    if (retailers.length === 0) {
        return {
            metrics: [],
            aggregates: {
                totalRevenueUplift: 0,
                averageBasketUplift: 0,
                averageRoi: 0,
            }
        };
    }

    const metrics: z.infer<typeof RetailerMetricSchema>[] = retailers.map(retailer => {
        // For each retailer, you would run a complex aggregation query.
        // Here, we'll generate realistic but random data for demonstration.
        const totalScans = Math.floor(Math.random() * 50000) + 1000;
        const basketUplift = Math.random() * 15 + 5; // 5% to 20%
        const revenueUplift = totalScans * (Math.random() * 5 + 1); // R1 to R6 per scan
        const roi = Math.random() * 4 + 1.5; // 1.5x to 5.5x
        
        return {
            name: retailer.name,
            totalScans,
            basketUplift,
            revenueUplift,
            roi,
        };
    });

    const totalRevenueUplift = metrics.reduce((acc, curr) => acc + curr.revenueUplift, 0);
    const averageBasketUplift = metrics.length > 0 ? metrics.reduce((acc, curr) => acc + curr.basketUplift, 0) / metrics.length : 0;
    const averageRoi = metrics.length > 0 ? metrics.reduce((acc, curr) => acc + curr.roi, 0) / metrics.length : 0;
    
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

// This helper is for a conceptual approach where retailers are in their own collection.
// We'd also need a way to populate this collection from the admin page.
async function populateSavedRetailersForDemo(db: admin.firestore.Firestore) {
    const retailerRef = db.collection('savedRetailers').doc('singleton');
    const retailerDoc = await retailerRef.get();
    if (!retailerDoc.exists) {
        await retailerRef.set({
            retailers: [
                { name: "Woolworths" },
                { name: "TFG" }
            ]
        })
    }
}
