'use server';

import { verifyAuth } from '@/lib/auth-server';

import {
  getVisualsReportingBrandNavigation,
  listOrganizationScopeChildren,
} from '@/lib/organization-scope-server';

import {
  VisualsReportingNavigationSchema,
  type VisualsReportingNavigation,
} from '@/lib/schemas/visuals-reporting';

type GetVisualsReportingNavigationInput = {
  idToken?: string;
  selectedBrandId?: string;
};

/**
 * Canonical Visuals & Reporting navigation boundary.
 *
 * Reporting visibility is intentionally open inside an authorised Brand,
 * while Brand/Sister-Company isolation remains absolute.
 *
 * Network-scoped users may select any Brand in their retailer network.
 * Brand-bound users may select only their assigned Brand.
 *
 * This boundary exposes navigation only. It does not acquire or project
 * reporting evidence.
 */
export async function getVisualsReportingNavigation(
  input: GetVisualsReportingNavigationInput,
): Promise<VisualsReportingNavigation> {
  const auth = await verifyAuth(input.idToken);

  if ('error' in auth) {
    throw new Error(auth.error);
  }

  if (!auth.isActive) {
    throw new Error('ACCOUNT_INACTIVE');
  }

  if (!auth.retailerId) {
    throw new Error('RETAILER_AUTHORIZATION_REQUIRED');
  }

  if (auth.permissions.visualsReporting !== true) {
    throw new Error(
      'VISUALS_REPORTING_PERMISSION_REQUIRED',
    );
  }

  if (!auth.scope.networkId) {
    throw new Error(
      'VISUALS_REPORTING_BRAND_ACCESS_DENIED',
    );
  }

  const retailerId = auth.retailerId;
  const networkId = auth.scope.networkId;

  let brandPortfolio: VisualsReportingNavigation['brandPortfolio'];
  let selectedBrandId: string;

  if (auth.scope.level === 'network') {
    brandPortfolio =
      await listOrganizationScopeChildren(
        retailerId,
        {
          level: 'network',
          networkId,
        },
      );

    if (brandPortfolio.length === 0) {
      throw new Error(
        'VISUALS_REPORTING_BRAND_ACCESS_DENIED',
      );
    }

    if (input.selectedBrandId) {
      const selectedBrandIsAuthorized =
        brandPortfolio.some(
          item =>
            item.scope.level === 'brand' &&
            item.scope.brandId ===
              input.selectedBrandId,
        );

      if (!selectedBrandIsAuthorized) {
        throw new Error(
          'VISUALS_REPORTING_BRAND_ACCESS_DENIED',
        );
      }

      selectedBrandId = input.selectedBrandId;
    } else {
      const initialBrand = brandPortfolio[0];

      if (
        initialBrand.scope.level !== 'brand' ||
        !initialBrand.scope.brandId
      ) {
        throw new Error(
          'VISUALS_REPORTING_BRAND_ACCESS_DENIED',
        );
      }

      selectedBrandId = initialBrand.scope.brandId;
    }
  } else {
    if (!auth.scope.brandId) {
      throw new Error(
        'VISUALS_REPORTING_BRAND_ACCESS_DENIED',
      );
    }

    if (
      input.selectedBrandId &&
      auth.scope.brandId !== input.selectedBrandId
    ) {
      throw new Error(
        'VISUALS_REPORTING_BRAND_ACCESS_DENIED',
      );
    }

    selectedBrandId = auth.scope.brandId;
    brandPortfolio = [];
  }

  const brandNavigation =
    await getVisualsReportingBrandNavigation(
      retailerId,
      networkId,
      selectedBrandId,
    );

  if (auth.scope.level !== 'network') {
    brandPortfolio = [
      brandNavigation.brand,
    ];
  }

  return VisualsReportingNavigationSchema.parse({
    brandPortfolio,
    selectedBrand: brandNavigation.brand,
    divisions: brandNavigation.divisions,
    regions: brandNavigation.regions,
    areas: brandNavigation.areas,
    stores: brandNavigation.stores,
  });
}
