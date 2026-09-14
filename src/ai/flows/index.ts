'use server';

// This file exports all the Genkit flows for easy access from the client.
import { analyzeBehavioralInsights, type AnalyzeBehavioralInsightsInput, type AnalyzeBehavioralInsightsOutput } from './analyze-behavioral-insights';
import { analyzeCampaignPerformance, type AnalyzeCampaignPerformanceInput, type AnalyzeCampaignPerformanceOutput } from './analyze-campaign-performance';
import { analyzeEngagementMetrics, type AnalyzeEngagementMetricsOutput } from './analyze-engagement-metrics';
import { analyzeDecisionIntelligence, type DecisionIntelligenceOutput } from './analyze-decision-intelligence';
import { assignDisplayConfig } from './assign-display-config';
import { submitBulkQrRequest, type SubmitBulkQrRequestInput, type SubmitBulkQrRequestOutput } from './submit-bulk-qr-request';
import { generateCrossSellRecommendations, type GenerateCrossSellRecommendationsInput, type GenerateCrossSellRecommendationsOutput } from './generate-cross-sell-recommendations';
import { getDisplays, type Display } from './get-displays';
import { getExecutiveRoiMetrics, type ExecutiveRoiMetricsOutput } from './get-executive-roi-metrics';
import { getQrTemplates } from './get-qr-templates';
import { type GetQrTemplatesInput, type QrTemplate } from '@/lib/schemas/qr-templates';
import { getScanEvents } from './get-scan-events';
import { type GetScanEventsInput, type GetScanEventsOutput } from '@/lib/schemas/scan-events';
import { getScanInteraction } from './get-scan-interaction';
import { type GetScanInteractionInput, type GetScanInteractionOutput } from '@/lib/schemas/scan-interaction';
import { logABTestConversion, type LogABTestConversionInput } from './log-ab-test-conversion';
import { logAdClick, type LogAdClickInput } from './log-ad-click';
import { logPurchaseConversion, type LogPurchaseConversionInput } from './log-purchase-conversion';
import { processBulkQrQueue, type ProcessBulkQrQueueOutput } from './process-bulk-qr-queue';
import { productChat, type ProductChatInput, type ProductChatOutput } from './product-chat-flow';
import { regenerateQrCode, type RegenerateQrCodeInput, type RegenerateQrCodeOutput } from './regenerate-qr-code';
import { registerDisplay } from './register-display';
import { remoteDisplayCommand, type RemoteDisplayCommandInput, type RemoteDisplayCommandOutput } from './remote-display-command';
import { createCampaign, type CreateCampaignOutput } from './create-campaign';
import { updateCampaign, type UpdateCampaignOutput } from './update-campaign';
import { archiveCampaign, type ArchiveCampaignOutput } from './archive-campaign';
import { listCampaignManagement, type CampaignManagementItem } from './list-campaign-management';
import { createActivation, type CreateActivationOutput } from './create-activation';
import { updateActivation, type UpdateActivationOutput } from './update-activation';
import { submitActivation, type SubmitActivationOutput } from './submit-activation';
import { approveActivation, type ApproveActivationOutput } from './approve-activation';
import { scheduleActivation, type ScheduleActivationOutput } from './schedule-activation';
import { pauseActivation, type PauseActivationOutput } from './pause-activation';
import { endActivation, type EndActivationOutput } from './end-activation';
import { archiveActivation, type ArchiveActivationOutput } from './archive-activation';
import {
    type CreateActivationInput,
    type UpdateActivationInput,
    type SubmitActivationInput,
    type ApproveActivationInput,
    type ScheduleActivationInput,
    type PauseActivationInput,
    type EndActivationInput,
    type ArchiveActivationInput,
} from '@/lib/schemas/activation-command';
import { createDeployment, type CreateDeploymentOutput } from './create-deployment';
import { listDeploymentOperations, type DeploymentOperationsItem } from './list-deployment-operations';
import { assignDeployment, type AssignDeploymentOutput } from './assign-deployment';
import { markDeploymentPrinted, type MarkDeploymentPrintedOutput } from './mark-deployment-printed';
import { markDeploymentDeployed, type MarkDeploymentDeployedOutput } from './mark-deployment-deployed';
import { reportDeploymentProblem, type ReportDeploymentProblemOutput } from './report-deployment-problem';
import { resolveDeploymentProblem, type ResolveDeploymentProblemOutput } from './resolve-deployment-problem';
import { removeDeployment, type RemoveDeploymentOutput } from './remove-deployment';
import { generateDeploymentPack, type GenerateDeploymentPackOutput } from './generate-deployment-pack';
import { bindQrToDeployment, type BindQrToDeploymentOutput } from './bind-qr-to-deployment';
import { beginQrShopperSession, type BeginQrShopperSessionOutput } from './begin-qr-shopper-session';
import {
    type CreateDeploymentInput,
    type AssignDeploymentInput,
    type MarkDeploymentPrintedInput,
    type MarkDeploymentDeployedInput,
    type ReportDeploymentProblemInput,
    type ResolveDeploymentProblemInput,
    type RemoveDeploymentInput,
    type GenerateDeploymentPackInput,
} from '@/lib/schemas/deployment-command';
import { type BindQrToDeploymentInput } from '@/lib/schemas/qr-command';
import { type BeginQrShopperSessionInput } from '@/lib/schemas/shopper-session-command';
import {
    type CreateCampaignInput,
    type UpdateCampaignInput,
    type ArchiveCampaignInput,
} from '@/lib/schemas/campaign-command';
import { saveQrTemplate } from './save-qr-template';
import { type SaveQrTemplateInput, type SaveQrTemplateOutput } from '@/lib/schemas/qr-templates';
import { saveRetailerApiKey, type SaveRetailerApiKeyInput, type SaveRetailerApiKeyOutput } from './save-retailer-api-key';
import { getScanAnalytics, type ScanAnalyticsInput, type ScanAnalyticsOutput } from './scan-analytics';
import { scheduledProductSync, type ScheduledProductSyncInput, type ScheduledProductSyncOutput } from './scheduled-product-sync';
import { syncProducts, type SyncProductsInput, type SyncProductsOutput } from './sync-products';
import { aggregateIntelligence } from './aggregate-intelligence';
import { attributeTransactions } from './attribute-transactions';
import { type AttributionReport, type AttributionRecord } from '@/lib/schemas/attribution';
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
    assignDisplayConfig,
    submitBulkQrRequest,
    generateCrossSellRecommendations,
    getDisplays,
    getExecutiveRoiMetrics,
    getQrTemplates,
    getScanEvents,
    getScanInteraction,
    logABTestConversion,
    logAdClick,
    logPurchaseConversion,
    processBulkQrQueue,
    productChat,
    regenerateQrCode,
    registerDisplay,
    remoteDisplayCommand,
    createCampaign,
    updateCampaign,
    archiveCampaign,
    listCampaignManagement,
    createActivation,
    updateActivation,
    submitActivation,
    approveActivation,
    scheduleActivation,
    pauseActivation,
    endActivation,
    archiveActivation,
    createDeployment,
    listDeploymentOperations,
    assignDeployment,
    markDeploymentPrinted,
    markDeploymentDeployed,
    reportDeploymentProblem,
    resolveDeploymentProblem,
    removeDeployment,
    generateDeploymentPack,
    bindQrToDeployment,
    beginQrShopperSession,
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
    SubmitBulkQrRequestInput, SubmitBulkQrRequestOutput,
    GenerateCrossSellRecommendationsInput, GenerateCrossSellRecommendationsOutput,
    Display,
    ExecutiveRoiMetricsOutput,
    GetQrTemplatesInput,
    QrTemplate,
    GetScanEventsInput, GetScanEventsOutput,
    GetScanInteractionInput, GetScanInteractionOutput,
    LogABTestConversionInput,
    LogAdClickInput,
    LogPurchaseConversionInput,
    ProcessBulkQrQueueOutput,
    ProductChatInput, ProductChatOutput,
    RegenerateQrCodeInput, RegenerateQrCodeOutput,
    RemoteDisplayCommandInput, RemoteDisplayCommandOutput,
    CreateCampaignInput, CreateCampaignOutput,
    UpdateCampaignInput, UpdateCampaignOutput,
    ArchiveCampaignInput, ArchiveCampaignOutput,
    CampaignManagementItem,
    CreateActivationInput, CreateActivationOutput,
    UpdateActivationInput, UpdateActivationOutput,
    SubmitActivationInput, SubmitActivationOutput,
    ApproveActivationInput, ApproveActivationOutput,
    ScheduleActivationInput, ScheduleActivationOutput,
    PauseActivationInput, PauseActivationOutput,
    EndActivationInput, EndActivationOutput,
    ArchiveActivationInput, ArchiveActivationOutput,
    CreateDeploymentInput, CreateDeploymentOutput,
    DeploymentOperationsItem,
    AssignDeploymentInput, AssignDeploymentOutput,
    MarkDeploymentPrintedInput, MarkDeploymentPrintedOutput,
    MarkDeploymentDeployedInput, MarkDeploymentDeployedOutput,
    ReportDeploymentProblemInput, ReportDeploymentProblemOutput,
    ResolveDeploymentProblemInput, ResolveDeploymentProblemOutput,
    RemoveDeploymentInput, RemoveDeploymentOutput,
    GenerateDeploymentPackInput, GenerateDeploymentPackOutput,
    BindQrToDeploymentInput, BindQrToDeploymentOutput,
    BeginQrShopperSessionInput, BeginQrShopperSessionOutput,
    SaveQrTemplateInput, SaveQrTemplateOutput,
    SaveRetailerApiKeyInput, SaveRetailerApiKeyOutput,
    ScanAnalyticsInput, ScanAnalyticsOutput,
    ScheduledProductSyncInput, ScheduledProductSyncOutput,
    SyncProductsInput, SyncProductsOutput,
    AttributionReport, AttributionRecord,
    AuthUser
};