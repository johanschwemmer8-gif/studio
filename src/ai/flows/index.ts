'use server';

// This file exports all the Genkit flows for easy access from the client.
import { analyzeBehavioralInsights, type AnalyzeBehavioralInsightsInput, type AnalyzeBehavioralInsightsOutput } from './analyze-behavioral-insights';
import { analyzeCampaignPerformance, type AnalyzeCampaignPerformanceInput, type AnalyzeCampaignPerformanceOutput } from './analyze-campaign-performance';
import { analyzeEngagementMetrics, type AnalyzeEngagementMetricsOutput } from './analyze-engagement-metrics';
import { analyzeDecisionIntelligence, type DecisionIntelligenceOutput } from './analyze-decision-intelligence';
import { assignDisplayConfig } from './assign-display-config';
import { deleteBulkQrRequest, type DeleteBulkQrRequestInput, type DeleteBulkQrRequestOutput } from './delete-bulk-qr-request';
import { submitBulkQrRequest, type SubmitBulkQrRequestInput, type SubmitBulkQrRequestOutput } from './generate-bulk-qr-codes';
import { generateCampaignAI, type GenerateCampaignAIInput, type GenerateCampaignAIOutput } from './generate-campaign-ai';
import { generateCrossSellRecommendations, type GenerateCrossSellRecommendationsInput, type GenerateCrossSellRecommendationsOutput } from './generate-cross-sell-recommendations';
import { generateZipForRequest, type GenerateZipForRequestInput, type GenerateZipForRequestOutput } from './generate-zip-for-request';
import { getDisplays, type Display } from './get-displays';
import { getExecutiveRoiMetrics, type ExecutiveRoiMetricsOutput } from './get-executive-roi-metrics';
import { getQrTemplates } from './get-qr-templates';
import { type GetQrTemplatesInput, type QrTemplate } from '@/lib/schemas/qr-templates';
import { getScanEvents } from './get-scan-events';
import { type GetScanEventsInput, type GetScanEventsOutput } from '@/lib/schemas/scan-events';
import { getScanInteraction } from './get-scan-interaction';
import { type GetScanInteractionInput, type GetScanInteractionOutput } from '@/lib/schemas/scan-interaction';
import { importExternalQrCodes, type ImportExternalQrCodesInput, type ImportExternalQrCodesOutput } from './import-external-qr-codes';
import { logABTestConversion, type LogABTestConversionInput } from './log-ab-test-conversion';
import { logAdClick, type LogAdClickInput } from './log-ad-click';
import { logPurchaseConversion, type LogPurchaseConversionInput } from './log-purchase-conversion';
import { processBulkQrQueue, type ProcessBulkQrQueueOutput } from './process-bulk-qr-queue';
import { productChat, type ProductChatInput, type ProductChatOutput } from './product-chat-flow';
import { regenerateQrCode, type RegenerateQrCodeInput, type RegenerateQrCodeOutput } from './regenerate-qr-code';
import { registerDisplay } from './register-display';
import { remoteDisplayCommand, type RemoteDisplayCommandInput, type RemoteDisplayCommandOutput } from './remote-display-command';
import { saveQrCampaignDraft, type SaveQrCampaignDraftOutput } from './save-qr-campaign-draft';
import { saveQrTemplate } from './save-qr-template';
import { type SaveQrTemplateInput, type SaveQrTemplateOutput } from '@/lib/schemas/qr-templates';
import { saveRetailerApiKey, type SaveRetailerApiKeyInput, type SaveRetailerApiKeyOutput } from './save-retailer-api-key';
import { getScanAnalytics, type ScanAnalyticsInput, type ScanAnalyticsOutput } from './scan-analytics';
import { scheduledProductSync, type ScheduledProductSyncInput, type ScheduledProductSyncOutput } from './scheduled-product-sync';
import { syncProducts, type SyncProductsInput, type SyncProductsOutput } from './sync-products';
import { aggregateIntelligence } from './aggregate-intelligence';
import { attributeTransactions } from './attribute-transactions';
import { getDecisionJourneyIntelligence } from './decision-journey-intelligence';
import { assignUserClaims } from './assign-user-claims';
import { resetTestRetailer } from './reset-test-retailer';
import { seedTestRetailerDemo } from './seed-test-retailer-demo';

export {
    analyzeBehavioralInsights,
    analyzeCampaignPerformance,
    analyzeEngagementMetrics,
    analyzeDecisionIntelligence,
    assignDisplayConfig,
    deleteBulkQrRequest,
    submitBulkQrRequest,
    generateCampaignAI,
    generateCrossSellRecommendations,
    generateZipForRequest,
    getDisplays,
    getExecutiveRoiMetrics,
    getQrTemplates,
    getScanEvents,
    getScanInteraction,
    importExternalQrCodes,
    logABTestConversion,
    logAdClick,
    logPurchaseConversion,
    processBulkQrQueue,
    productChat,
    regenerateQrCode,
    registerDisplay,
    remoteDisplayCommand,
    saveQrCampaignDraft,
    saveQrTemplate,
    saveRetailerApiKey,
    getScanAnalytics,
    scheduledProductSync,
    syncProducts,
    aggregateIntelligence,
    attributeTransactions,
    getDecisionJourneyIntelligence,
    assignUserClaims,
    resetTestRetailer,
    seedTestRetailerDemo,
};

export type {
    AnalyzeBehavioralInsightsInput, AnalyzeBehavioralInsightsOutput,
    AnalyzeCampaignPerformanceInput, AnalyzeCampaignPerformanceOutput,
    AnalyzeEngagementMetricsOutput,
    DecisionIntelligenceOutput,
    DeleteBulkQrRequestInput, DeleteBulkQrRequestOutput,
    SubmitBulkQrRequestInput, SubmitBulkQrRequestOutput,
    GenerateCampaignAIInput, GenerateCampaignAIOutput,
    GenerateCrossSellRecommendationsInput, GenerateCrossSellRecommendationsOutput,
    GenerateZipForRequestInput, GenerateZipForRequestOutput,
    Display,
    ExecutiveRoiMetricsOutput,
    GetQrTemplatesInput,
    QrTemplate,
    GetScanEventsInput, GetScanEventsOutput,
    GetScanInteractionInput, GetScanInteractionOutput,
    ImportExternalQrCodesInput, ImportExternalQrCodesOutput,
    LogABTestConversionInput,
    LogAdClickInput,
    LogPurchaseConversionInput,
    ProcessBulkQrQueueOutput,
    ProductChatInput, ProductChatOutput,
    RegenerateQrCodeInput, RegenerateQrCodeOutput,
    RemoteDisplayCommandInput, RemoteDisplayCommandOutput,
    SaveQrCampaignDraftOutput,
    SaveQrTemplateInput, SaveQrTemplateOutput,
    SaveRetailerApiKeyInput, SaveRetailerApiKeyOutput,
    ScanAnalyticsInput, ScanAnalyticsOutput,
    ScheduledProductSyncInput, ScheduledProductSyncOutput,
    SyncProductsInput, SyncProductsOutput
};
