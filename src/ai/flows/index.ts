'use server';

// Reverted index with simpler naming
import { analyzeBehavioralInsights, type AnalyzeBehavioralInsightsInput, type AnalyzeBehavioralInsightsOutput } from './analyze-behavioral-insights';
import { analyzeCampaignPerformance, type AnalyzeCampaignPerformanceInput, type AnalyzeCampaignPerformanceOutput } from './analyze-campaign-performance';
import { analyzeEngagementMetrics, type AnalyzeEngagementMetricsOutput } from './analyze-engagement-metrics';
import { analyzeDecisionIntelligence, type DecisionIntelligenceOutput } from './analyze-decision-intelligence';
import { createCampaign, type CreateCampaignOutput } from './create-campaign';
import { deleteBulkQrRequest, type DeleteBulkQrRequestInput, type DeleteBulkQrRequestOutput } from './delete-bulk-qr-request';
import { submitBulkQrRequest, type SubmitBulkQrRequestInput, type SubmitBulkQrRequestOutput } from './submit-bulk-qr-request';
import { generateCampaignAI, type GenerateCampaignAIInput, type GenerateCampaignAIOutput } from './generate-campaign-ai';
import { generateCrossSellRecommendations, type GenerateCrossSellRecommendationsInput, type GenerateCrossSellRecommendationsOutput } from './generate-cross-sell-recommendations';
import { generateZipForRequest, type GenerateZipForRequestInput, type GenerateZipForRequestOutput } from './generate-zip-for-request';
import { getQrTemplates } from './get-qr-templates';
import { getScanEvents } from './get-scan-events';
import { getScanInteraction } from './get-scan-interaction';
import { importExternalQrCodes, type ImportExternalQrCodesInput, type ImportExternalQrCodesOutput } from './import-external-qr-codes';
import { listCampaigns, type ListCampaignsOutput } from './list-campaigns';
import { logABTestConversion, type LogABTestConversionInput } from './log-ab-test-conversion';
import { processBulkQrQueue, type ProcessBulkQrQueueOutput } from './process-bulk-qr-queue';
import { productChat, type ProductChatInput, type ProductChatOutput } from './product-chat-flow';
import { regenerateQrCode, type RegenerateQrCodeInput, type RegenerateQrCodeOutput } from './regenerate-qr-code';
import { remoteDisplayCommand, type RemoteDisplayCommandInput, type RemoteDisplayCommandOutput } from './remote-display-command';
import { saveQrCampaignDraft, type SaveQrCampaignDraftOutput } from './save-qr-campaign-draft';
import { saveQrTemplate } from './save-qr-template';
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
import { saveAiConfig } from './save-ai-config';
import { listAuthUsers, type AuthUser } from './list-auth-users';

export {
    analyzeBehavioralInsights,
    analyzeCampaignPerformance,
    analyzeEngagementMetrics,
    analyzeDecisionIntelligence,
    createCampaign,
    deleteBulkQrRequest,
    submitBulkQrRequest,
    generateCampaignAI,
    generateCrossSellRecommendations,
    generateZipForRequest,
    getQrTemplates,
    getScanEvents,
    getScanInteraction,
    importExternalQrCodes,
    listCampaigns,
    logABTestConversion,
    processBulkQrQueue,
    productChat,
    regenerateQrCode,
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
    saveAiConfig,
    listAuthUsers,
};

export type {
    AnalyzeBehavioralInsightsInput, AnalyzeBehavioralInsightsOutput,
    AnalyzeCampaignPerformanceInput, AnalyzeCampaignPerformanceOutput,
    AnalyzeEngagementMetricsOutput,
    DecisionIntelligenceOutput,
    CreateCampaignOutput,
    DeleteBulkQrRequestInput, DeleteBulkQrRequestOutput,
    SubmitBulkQrRequestInput, SubmitBulkQrRequestOutput,
    GenerateCampaignAIInput, GenerateCampaignAIOutput,
    GenerateCrossSellRecommendationsInput, GenerateCrossSellRecommendationsOutput,
    GenerateZipForRequestInput, GenerateZipForRequestOutput,
    GetScanEventsInput, GetScanEventsOutput,
    GetScanInteractionInput, GetScanInteractionOutput,
    ImportExternalQrCodesInput, ImportExternalQrCodesOutput,
    ListCampaignsOutput,
    LogABTestConversionInput,
    ProcessBulkQrQueueOutput,
    ProductChatInput, ProductChatOutput,
    RegenerateQrCodeInput, RegenerateQrCodeOutput,
    RemoteDisplayCommandInput, RemoteDisplayCommandOutput,
    SaveQrCampaignDraftOutput,
    SaveRetailerApiKeyInput, SaveRetailerApiKeyOutput,
    ScanAnalyticsInput, ScanAnalyticsOutput,
    ScheduledProductSyncInput, ScheduledProductSyncOutput,
    SyncProductsInput, SyncProductsOutput,
    AuthUser
};
