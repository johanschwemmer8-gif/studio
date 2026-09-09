/**
 * AUTHORITATIVE ARCHITECTURAL TYPES - GATE 1
 * 
 * CORE HIERARCHY:
 * Campaign -> Activation -> QR Identity
 * 
 * SYSTEM INVARIANTS:
 * 1. ONE ACTIVATION = ONE QR.
 * 2. Target (Intent) is separate from Product Context (Environment).
 * 3. Primary identifiers are immutable.
 */

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED';

export type ActivationStatus = 'DRAFT' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type DeploymentStatus = 'PENDING' | 'VERIFIED' | 'DAMAGED' | 'REPLACED';

/**
 * RETAILER INTENT / TARGET
 * Defines the promotional objective for a Point-of-Decision.
 */
export interface QRActivationTarget {
  category?: string;
  subCategory?: string;
  productType?: string; // Legacy pipeline compatibility
  brandId?: string;
  brandName?: string;
  targetProductName?: string;
  targetProductGtin?: string;
}

/**
 * PRODUCT CONTEXT
 * Provides contextual product data without multiplying the digital identity.
 */
export interface QRProductContext {
  /**
   * Authoritative array of product GTINs providing context.
   * These products are visible/compared but do NOT trigger additional QRs.
   */
  productGtins: string[];
}

/**
 * PHYSICAL CONTEXT
 * Defines the physical Point-of-Decision.
 */
export interface PhysicalPointOfDecision {
  storeId?: string;
  storeName: string;
  location: string; // generic: e.g. "Aisle 4, Shelf 2", "End-cap", "Checkout"
}

/**
 * QR CAMPAIGN
 * Commercial/Marketing container for grouping and reporting.
 */
export interface QRCampaign {
  readonly retailerId: string;
  readonly campaignId: string;
  name: string;
  type: 'promotion' | 'engagement';
  mode: 'single-target' | 'collection';
  status: CampaignStatus;
  createdAt: Date | any;
  updatedAt: Date | any;
}

/**
 * QR ACTIVATION
 * The digital twin of a physical Point-of-Decision.
 * 1 Activation = 1 QR.
 */
export interface QRActivation {
  readonly retailerId: string;
  readonly campaignId: string;
  readonly activationId: string; // The parent Request ID
  readonly qrCodeId: string;     // The immutable digital identity anchor
  
  target: QRActivationTarget;
  productContext: QRProductContext;
  physicalContext: PhysicalPointOfDecision;
  
  shopperObjective: 'discover' | 'compare' | 'choose' | 'learn' | 'recommendation' | 'promote' | string;
  status: ActivationStatus;
  
  createdAt: Date | any;
  updatedAt: Date | any;
}

/**
 * STORE DEPLOYMENT
 * Tracks the physical execution and verification of the activation.
 */
export interface StoreDeployment {
  readonly retailerId: string;
  readonly storeId: string;
  readonly activationId: string;
  readonly qrCodeId: string;
  
  status: DeploymentStatus;
  verifiedBy?: string;
  verifiedAt?: Date | any;
  lastReprintedAt?: Date | any;
}
