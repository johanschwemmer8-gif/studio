import { z } from 'zod';

import { getDb } from './firebase-admin';

const StoreNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  code: z.string().optional(),
  address: z.string().optional(),
});

const AreaNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  stores: z.array(StoreNodeSchema).default([]),
});

const RegionNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  province: z.string().optional(),
  areas: z.array(AreaNodeSchema).default([]),
});

const DivisionNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  regions: z.array(RegionNodeSchema).default([]),
});

const BrandNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  divisions: z.array(DivisionNodeSchema).default([]),
});

const OrganizationDataSchema = z.object({
  brands: z.array(BrandNodeSchema).default([]),
});

const OrganizationDocumentSchema = z.object({
  retailerId: z.string().min(1),
  type: z.literal('org'),
  data: OrganizationDataSchema,
});

export type OrganizationScopeLevel =
  | 'network'
  | 'brand'
  | 'division'
  | 'region'
  | 'area'
  | 'store';

export type OrganizationScope = {
  level: OrganizationScopeLevel;
  networkId?: string;
  brandId?: string;
  divisionId?: string;
  regionId?: string;
  areaId?: string;
  storeId?: string;
};

export type ResolvedOrganizationScope = {
  retailerId: string;
  scope: OrganizationScope;
  storeIds: string[];
};

function scopeResolutionError(code: string): never {
  throw new Error(code);
}

export async function resolveOrganizationScope(
  retailerId: string,
  scope: OrganizationScope
): Promise<ResolvedOrganizationScope> {
  const db = getDb();

  if (!db) {
    scopeResolutionError('INFRASTRUCTURE_UNAVAILABLE');
  }

  const snapshot = await db
    .collection('configurations')
    .doc(`${retailerId}_org`)
    .get();

  if (!snapshot.exists) {
    scopeResolutionError('ORGANIZATION_CONFIGURATION_UNAVAILABLE');
  }

  const parsed = OrganizationDocumentSchema.safeParse(snapshot.data());

  if (!parsed.success) {
    scopeResolutionError('ORGANIZATION_CONFIGURATION_INVALID');
  }

  if (parsed.data.retailerId !== retailerId) {
    scopeResolutionError('ORGANIZATION_TENANT_MISMATCH');
  }

  const organization = parsed.data.data;

  const allStoreIds = organization.brands.flatMap(brand =>
    brand.divisions.flatMap(division =>
      division.regions.flatMap(region =>
        region.areas.flatMap(area =>
          area.stores.map(store => store.id)
        )
      )
    )
  );

  if (scope.level === 'network') {
    return {
      retailerId,
      scope,
      storeIds: allStoreIds,
    };
  }

  const brand = scope.brandId
    ? organization.brands.find(item => item.id === scope.brandId)
    : undefined;

  if (!brand) {
    scopeResolutionError('AUTHORIZED_BRAND_SCOPE_NOT_FOUND');
  }

  if (scope.level === 'brand') {
    return {
      retailerId,
      scope,
      storeIds: brand.divisions.flatMap(division =>
        division.regions.flatMap(region =>
          region.areas.flatMap(area =>
            area.stores.map(store => store.id)
          )
        )
      ),
    };
  }

  const division = scope.divisionId
    ? brand.divisions.find(item => item.id === scope.divisionId)
    : undefined;

  if (!division) {
    scopeResolutionError('AUTHORIZED_DIVISION_SCOPE_NOT_FOUND');
  }

  if (scope.level === 'division') {
    return {
      retailerId,
      scope,
      storeIds: division.regions.flatMap(region =>
        region.areas.flatMap(area =>
          area.stores.map(store => store.id)
        )
      ),
    };
  }

  const region = scope.regionId
    ? division.regions.find(item => item.id === scope.regionId)
    : undefined;

  if (!region) {
    scopeResolutionError('AUTHORIZED_REGION_SCOPE_NOT_FOUND');
  }

  if (scope.level === 'region') {
    return {
      retailerId,
      scope,
      storeIds: region.areas.flatMap(area =>
        area.stores.map(store => store.id)
      ),
    };
  }

  const area = scope.areaId
    ? region.areas.find(item => item.id === scope.areaId)
    : undefined;

  if (!area) {
    scopeResolutionError('AUTHORIZED_AREA_SCOPE_NOT_FOUND');
  }

  if (scope.level === 'area') {
    return {
      retailerId,
      scope,
      storeIds: area.stores.map(store => store.id),
    };
  }

  const store = scope.storeId
    ? area.stores.find(item => item.id === scope.storeId)
    : undefined;

  if (!store) {
    scopeResolutionError('AUTHORIZED_STORE_SCOPE_NOT_FOUND');
  }

  return {
    retailerId,
    scope,
    storeIds: [store.id],
  };
}
