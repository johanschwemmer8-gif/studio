import { config } from 'dotenv';
config();

import '@/ai/flows/generate-cross-sell-recommendations.ts';
import '@/ai/flows/product-chat-flow.ts';
import '@/ai/flows/analyze-engagement-metrics.ts';
import '@/ai/flows/analyze-campaign-performance.ts';
import '@/ai/flows/analyze-behavioral-insights.ts';
import '@/ai/flows/generate-bulk-qr-codes.ts';
import '@/ai/flows/process-bulk-qr-queue.ts';
