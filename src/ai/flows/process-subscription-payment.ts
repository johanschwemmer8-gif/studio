'use server';

// This file exports all the Genkit flows for easy access from the client.
import { analyzeBehavioralInsights, type AnalyzeBehavioralInsightsInput, type AnalyzeBehavioralInsightsOutput } from './analyze-behavioral-insights';
import { analyzeCampaignPerformance, type AnalyzeCampaignPerformanceInput, type AnalyzeCampaignPerformanceOutput } from './analyze-campaign-performance';
import { analyzeEngagementMetrics, type AnalyzeEngagementMetricsOutput } from './analyze-engagement-metrics';
import { assignDisplayConfig } from './assign-display-config';
import { deleteBulkQrRequest, type DeleteBulkQrRequestInput, type DeleteBulkQrRequestOutput } from './delete-bulk-qr-request';
import { generateBulkQrCodes } from './generate-bulk-qr-codes';
import { generateCampaignAI, type GenerateCampaignAIInput, type GenerateCampaignAIOutput } from './generate-campaign-ai';
import { generateCrossSellRecommendations, type GenerateCrossSellRecommendationsInput, type GenerateCrossSellRecommendationsOutput } from './generate-cross-sell-recommendations';
import { generateZipForRequest, type GenerateZipForRequestInput, type GenerateZipForRequestOutput } from './generate-zip-for-request';
import { getDisplays, type Display } from './get-displays';
import { getExecutiveRoiMetrics, type ExecutiveRoiMetricsOutput } from './get-executive-roi-metrics';
import { getQrTemplates, type GetQrTemplatesInput } from './get-qr-templates';
import { type QrTemplate } from '@/lib/schemas/qr-templates';
import { getScanEvents, type GetScanEventsInput, type GetScanEventsOutput } from './get-scan-events';
import { getScanInteraction, type GetScanInteractionInput, type GetScanInteractionOutput } from './get-scan-interaction';
import { importExternalQrCodes, type ImportExternalQrCodesInput, type ImportExternalQrCodesOutput } from './import-external-qr-codes';
import { logABTestConversion, type LogABTestConversionInput } from './log-ab-test-conversion';
import { logAdClick, type LogAdClickInput } from './log-ad-click';
import { logPurchaseConversion, type LogPurchaseConversionInput } from './log-purchase-conversion';
import { processBulkQrQueue, type ProcessBulkQrQueueOutput } from './process-bulk-qr-queue';
import { productChat, type ProductChatInput, type ProductChatOutput } from './product-chat-flow';
import { regenerateQrCode, type RegenerateQrCodeInput, type RegenerateQrCodeOutput } from './regenerate-qr-code';
import { registerDisplay } from './register-display';
import { remoteDisplayCommand, type RemoteDisplayCommandInput, type RemoteDisplayCommandOutput } from './remote-display-command';
import { saveQrTemplate, type SaveQrTemplateInput, type SaveQrTemplateOutput } from './save-qr-template';
import { saveRetailerApiKey, type SaveRetailerApiKeyInput, type SaveRetailerApiKeyOutput } from './save-retailer-api-key';
import { getScanAnalytics, type ScanAnalyticsInput, type ScanAnalyticsOutput } from './scan-analytics';
import { scheduledProductSync, type ScheduledProductSyncInput, type ScheduledProductSyncOutput } from './scheduled-product-sync';
import { submitBulkQrRequest, type SubmitBulkQrRequestInput, type SubmitBulkQrRequestOutput } from './submit-bulk-qr-request';
import { syncProducts, type SyncProductsInput, type SyncProductsOutput } from './sync-products';


export {
    analyzeBehavioralInsights,
    analyzeCampaignPerformance,
    analyzeEngagementMetrics,
    assignDisplayConfig,
    deleteBulkQrRequest,
    generateBulkQrCodes,
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
    saveQrTemplate,
    saveRetailerApiKey,
    getScanAnalytics,
    scheduledProductSync,
    submitBulkQrRequest,
    syncProducts,
};

export type {
    AnalyzeBehavioralInsightsInput, AnalyzeBehavioralInsightsOutput,
    AnalyzeCampaignPerformanceInput, AnalyzeCampaignPerformanceOutput,
    AnalyzeEngagementMetricsOutput,
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
    SaveQrTemplateInput, SaveQrTemplateOutput,
    SaveRetailerApiKeyInput, SaveRetailerApiKeyOutput,
    ScanAnalyticsInput, ScanAnalyticsOutput,
    ScheduledProductSyncInput, ScheduledProductSyncOutput,
    SyncProductsInput, SyncProductsOutput
};