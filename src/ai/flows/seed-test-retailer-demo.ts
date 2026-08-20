'use server';
/**
 * @fileOverview Deterministic seed flow for the Heritage Vineyards & Estates demo.
 * Provisions configurations, canonical products, and QR activations.
 * AUDIT VERSION: 1.6.0 (Enriched Sommelier Facts)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, getDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-server';

const TEST_RETAILER_ID = 'interact-test-tenant';

const SeedTestRetailerDemoInputSchema = z.object({
  idToken: z.string().describe("Administrator's Firebase ID token."),
});

const SeedTestRetailerDemoOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

const DEMO_PRODUCTS = [
  {
    gtin: '06000000000018',
    name: 'Estate Reserve Pinotage',
    brand: 'Heritage Vineyards',
    description: 'Our flagship red. Bold, complex, and aged for 18 months in French oak. Notes of dark chocolate and roasted coffee. Best served at 16-18°C.',
    category: 'Red Wine',
    price: 350.00,
    imageUrl: 'https://picsum.photos/seed/pinotage/600/600',
    facts: {
        pairing: 'Spicy lamb chops, venison, or strong blue cheese.',
        aging: '18 months in French Oak barrels.',
        serving_temp: '16-18°C',
        tasting_notes: 'Plum, dark chocolate, roasted coffee beans.'
    }
  },
  {
    gtin: '06000000000025',
    name: 'Coastal White Blend',
    brand: 'Heritage Vineyards',
    description: 'A refreshing, crisp blend perfect for summer afternoons. Zesty citrus notes with a smooth mineral finish. Serve chilled at 8-10°C.',
    category: 'White Wine',
    price: 185.00,
    imageUrl: 'https://picsum.photos/seed/white/600/600',
    facts: {
        pairing: 'Grilled seafood, salads, or light pasta dishes.',
        serving_temp: '8-10°C',
        tasting_notes: 'Lemon zest, green apple, wet stone.'
    }
  },
  {
    gtin: '06000000000032',
    name: 'Vintage Brut',
    brand: 'Heritage Vineyards',
    description: 'Elegant bubbles for special celebrations. Traditional method sparkling wine with toasted brioche aromas and fine mousse.',
    category: 'Sparkling',
    price: 450.00,
    imageUrl: 'https://picsum.photos/seed/brut/600/600',
    facts: {
        pairing: 'Oysters, sushi, or as a celebratory aperitif.',
        method: 'Cap Classique (Traditional Method)',
        tasting_notes: 'Green apple, almond, toasted brioche.'
    }
  },
  {
    gtin: '06000000000049',
    name: 'Aged Cabernet Sauvignon',
    brand: 'Heritage Vineyards',
    description: 'A deep, structured Cabernet with intense blackcurrant flavors and refined tannins. Ideal for long-term cellaring. Decant before serving.',
    category: 'Red Wine',
    price: 580.00,
    imageUrl: 'https://picsum.photos/seed/cabernet/600/600',
    facts: {
        pairing: 'Prime rib, Wagyu beef, or slow-cooked stews.',
        aging: '24 months in new French Oak.',
        tasting_notes: 'Blackcurrant, tobacco, graphite.'
    }
  },
  {
    gtin: '06000000000056',
    name: 'Heritage Rosé',
    brand: 'Heritage Vineyards',
    description: 'Delicate and dry with hints of wild strawberry. A versatile wine that pairs beautifully with Mediterranean cuisine.',
    category: 'Rosé',
    price: 145.00,
    imageUrl: 'https://picsum.photos/seed/rose/600/600',
    facts: {
        pairing: 'Tapas, salmon, or spicy Asian cuisine.',
        serving_temp: '7-9°C',
        tasting_notes: 'Wild strawberry, rose petal, watermelon.'
    }
  }
];

export async function seedTestRetailerDemo(input: z.infer<typeof SeedTestRetailerDemoInputSchema>) {
    return seedTestRetailerDemoFlow(input);
}

const seedTestRetailerDemoFlow = ai.defineFlow(
  {
    name: 'seedTestRetailerDemoFlow',
    inputSchema: SeedTestRetailerDemoInputSchema,
    outputSchema: SeedTestRetailerDemoOutputSchema,
  },
  async ({ idToken }) => {
    const caller = await verifyAuth(idToken);
    if (caller.role !== 'admin') {
        throw new Error("Unauthorized: Only platform administrators can seed the demo.");
    }

    const db = getDb();
    if (!db) throw new Error("Infrastructure Unavailable.");

    try {
        const batch = db.batch();

        // 1. Provision Configurations
        batch.set(db.collection('configurations').doc(`${TEST_RETAILER_ID}_org`), {
            retailerId: TEST_RETAILER_ID,
            type: 'org',
            data: {
                brands: [{
                    name: 'Heritage Vineyards & Estates',
                    divisions: [{
                        name: 'Wine & Spirits',
                        regions: [{
                            name: 'Western Cape',
                            areas: [{
                                name: 'Stellenbosch',
                                stores: [{ name: 'Flagship Tasting Room' }]
                            }]
                        }]
                    }]
                }]
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        batch.set(db.collection('configurations').doc(`${TEST_RETAILER_ID}_brand`), {
            retailerId: TEST_RETAILER_ID,
            type: 'brand',
            data: {
                logoUrl: 'https://picsum.photos/seed/heritage-logo/128/50',
                logoWidth: 160,
                logoAlign: 'center',
                selectedTemplate: 'template1',
                scanDestination: 'ai'
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // 2. Provision Canonical Products
        for (const p of DEMO_PRODUCTS) {
            batch.set(db.collection('products').doc(p.gtin), {
                ...p,
                retailerId: TEST_RETAILER_ID,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Pre-provision QR Codes for each product
            const qrId = `demo_${p.gtin}`;
            batch.set(db.collection('qrcodes').doc(qrId), {
                qrCodeId: qrId,
                retailerId: TEST_RETAILER_ID,
                gtin: p.gtin,
                campaignId: 'Demo Scenario',
                trackingUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/resolve/${qrId}`,
                redirectUrl: `/p/${p.gtin}`,
                scanCount: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        await batch.commit();

        return {
            success: true,
            message: 'Heritage Vineyards demo dataset successfully provisioned.'
        };

    } catch (error: any) {
        console.error("[Demo Seed] Failure:", error.message);
        throw error;
    }
  }
);
