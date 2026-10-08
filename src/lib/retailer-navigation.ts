/**
 * Canonical Retailer MVP functional navigation contract.
 *
 * IMPORTANT:
 * - `id` is the durable authorization identifier.
 * - `label` is presentation copy and may change independently.
 * - `href` is routing configuration and may change independently.
 * - Sidebar access is distinct from role, organisational scope,
 *   permissions and domain capabilities.
 */

export const RETAILER_FUNCTIONAL_AREA_IDS = [
  'dashboard',
  'roi',
  'products',
  'qrManagement',
  'uiManagement',
  'aiConfiguration',
  'retailMediaNetwork',
  'retailMediaPartners',
  'organization',
  'systemIntegration',
  'posTerminal',
  'decisionIntelligence',
  'visualsReporting',
  'documentation',
] as const;

export type RetailerFunctionalArea =
  (typeof RETAILER_FUNCTIONAL_AREA_IDS)[number];

export type SidebarAccess = RetailerFunctionalArea[];

export type RetailerNavigationGroup =
  | 'Overview'
  | 'Catalog & Products'
  | 'Shopper Experience'
  | 'Retail Media'
  | 'Operations & Integrations'
  | 'Intelligence'
  | 'Administration';

export type RetailerNavigationItem = {
  id: RetailerFunctionalArea;
  label: string;
  href: string;
  group: RetailerNavigationGroup;
};

export const RETAILER_NAVIGATION: readonly RetailerNavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Overview',
    href: '/retailer-mvp/dashboard',
    group: 'Overview',
  },
  {
    id: 'roi',
    label: 'Profit & ROI',
    href: '/retailer-mvp/roi',
    group: 'Overview',
  },
  {
    id: 'products',
    label: 'Product Catalog',
    href: '/retailer-mvp/products',
    group: 'Catalog & Products',
  },
  {
    id: 'qrManagement',
    label: 'QR Management',
    href: '/retailer-mvp/qr-management',
    group: 'Shopper Experience',
  },
  {
    id: 'uiManagement',
    label: 'Brand & Experience',
    href: '/retailer-mvp/ui-management',
    group: 'Shopper Experience',
  },
  {
    id: 'aiConfiguration',
    label: 'Ari Experience',
    href: '/retailer-mvp/ai-configuration',
    group: 'Shopper Experience',
  },
  {
    id: 'retailMediaNetwork',
    label: 'Retail Media Network',
    href: '/retailer-mvp/retail-media-network',
    group: 'Retail Media',
  },
  {
    id: 'retailMediaPartners',
    label: 'Retail Media Partners',
    href: '/retailer-mvp/retail-media-partners',
    group: 'Retail Media',
  },
  {
    id: 'organization',
    label: 'My Retail Network',
    href: '/retailer-mvp/organization',
    group: 'Operations & Integrations',
  },
  {
    id: 'systemIntegration',
    label: 'App Connections',
    href: '/retailer-mvp/system-integration',
    group: 'Operations & Integrations',
  },
  {
    id: 'posTerminal',
    label: 'Checkout Sync',
    href: '/retailer-mvp/pos-terminal',
    group: 'Operations & Integrations',
  },
  {
    id: 'decisionIntelligence',
    label: 'Decision Intelligence',
    href: '/retailer-mvp/decision-intelligence',
    group: 'Intelligence',
  },
  {
    id: 'visualsReporting',
    label: 'Visuals & Reporting',
    href: '/retailer-mvp/visuals-reporting',
    group: 'Intelligence',
  },
  {
    id: 'documentation',
    label: 'Help Center',
    href: '/retailer-mvp/documentation',
    group: 'Administration',
  },
];

export const RETAILER_NAVIGATION_GROUPS: readonly RetailerNavigationGroup[] = [
  'Overview',
  'Catalog & Products',
  'Shopper Experience',
  'Retail Media',
  'Operations & Integrations',
  'Intelligence',
  'Administration',
];

export function isRetailerFunctionalArea(
  value: unknown
): value is RetailerFunctionalArea {
  return (
    typeof value === 'string' &&
    (RETAILER_FUNCTIONAL_AREA_IDS as readonly string[]).includes(value)
  );
}

export function isSidebarAccess(value: unknown): value is SidebarAccess {
  return (
    Array.isArray(value) &&
    value.every(isRetailerFunctionalArea) &&
    new Set(value).size === value.length
  );
}
