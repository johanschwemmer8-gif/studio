import { config } from 'dotenv';
config();

import '@/ai/flows/submit-bulk-qr-request.ts';
import '@/ai/flows/product-chat-flow.ts';
import '@/ai/flows/analyze-engagement-metrics.ts';
import '@/ai/flows/analyze-campaign-performance.ts';
import '@/ai/flows/analyze-behavioral-insights.ts';
import '@/ai/flows/generate-cross-sell-recommendations.ts';
import '@/ai/flows/process-bulk-qr-queue.ts';
import '@/ai/flows/generate-zip-for-request.ts';
import '@/ai/flows/regenerate-qr-code.ts';
import '@/ai/flows/import-external-qr-codes.ts';
