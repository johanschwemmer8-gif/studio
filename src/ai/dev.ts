
import { config } from 'dotenv';
config();

import '@/ai/flows/submit-bulk-qr-request.ts';
import '@/ai/flows/product-chat-flow.ts';
import '@/ai/flows/analyze-engagement-metrics.ts';
import '@/ai/flows/analyze-campaign-performance.ts';
import '@/ai/flows/analyze-behavioral-insights.ts';
import '@/ai/flows/generate-cross-sell-recommendations.ts';
import '@/ai/flows/process-bulk-qr-queue.ts';
import '@/aiflows/generate-zip-for-request.ts';
import '@/ai/flows/regenerate-qr-code.ts';
import '@/ai/flows/generate-campaign-ai.ts';
import '@/ai/flows/save-qr-template.ts';
import '@/ai/flows/get-qr-templates.ts';
import '@/ai/flows/generate-bulk-qr-codes.ts';
import '@/ai/flows/import-external-qr-codes.ts';
import '@/ai/flows/delete-bulk-qr-request.ts';
import '@/ai/flows/get-scan-events.ts';
import '@/ai/flows/scan-analytics.ts';
import '@/ai/flows/get-scan-interaction.ts';
import '@/ai/flows/log-ab-test-conversion.ts';
import '@/ai/flows/log-ad-click.ts';
import '@/ai/flows/log-purchase-conversion.ts';
import '@/ai/flows/sync-products.ts';
import '@/ai/flows/scheduled-product-sync.ts';
import '@/ai/flows/save-retailer-api-key.ts';
import '@/ai/flows/process-subscription-payment.ts';
import '@/ai/flows/get-displays.ts';
import '@/ai/flows/register-display.ts';
import '@/ai/flows/remote-display-command.ts';
import '@/ai/flows/assign-display-config.ts';
import '@/ai/flows/get-executive-roi-metrics.ts';
import { seedBillingData } from '@/lib/seed-billing';

// Seed data on startup
seedBillingData().catch(console.error);
