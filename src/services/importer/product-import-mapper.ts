/**
 * Bulk Product Import Column Mapper
 *
 * Detects likely mappings between retailer-supplied column names and
 * iNteract canonical product fields.
 *
 * Mapping is deliberately conservative:
 * - HIGH confidence can be auto-selected.
 * - MEDIUM confidence is suggested for retailer confirmation.
 * - LOW confidence remains unmapped.
 *
 * This layer does NOT:
 * - validate product values;
 * - generate product IDs;
 * - determine duplicates;
 * - write to Firestore.
 */

import type { ProductImportMapping } from '@/types/importer/product-import';

export type ProductImportTargetField =
  | 'name'
  | 'category'
  | 'price'
  | 'currency'
  | 'retailerSku'
  | 'barcode'
  | 'gtin'
  | 'brand'
  | 'description'
  | 'subcategory'
  | 'department'
  | 'promotionalPrice'
  | 'imageUrl';

export type ProductImportMappingConfidence =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW';

export type ProductImportSuggestedMapping = ProductImportMapping & {
  confidence: ProductImportMappingConfidence;
  matchedAlias?: string;
};

type MappingRule = {
  field: ProductImportTargetField;
  aliases: string[];
  confidence: ProductImportMappingConfidence;
};

const MAPPING_RULES: MappingRule[] = [
  {
    field: 'name',
    aliases: [
      'product name',
      'productname',
      'item name',
      'itemname',
      'product title',
      'producttitle',
      'item title',
      'itemtitle',
      'name',
    ],
    confidence: 'HIGH',
  },
  {
    field: 'category',
    aliases: [
      'category',
      'product category',
      'productcategory',
      'item category',
      'itemcategory',
      'merchandise category',
      'merchandisecategory',
    ],
    confidence: 'HIGH',
  },
  {
    field: 'price',
    aliases: [
      'price',
      'selling price',
      'sellingprice',
      'sale price',
      'saleprice',
      'retail price',
      'retailprice',
      'unit price',
      'unitprice',
      'current price',
      'currentprice',
    ],
    confidence: 'HIGH',
  },
  {
    field: 'currency',
    aliases: [
      'currency',
      'currency code',
      'currencycode',
      'iso currency',
      'isocurrency',
      'iso currency code',
      'isocurrencycode',
    ],
    confidence: 'HIGH',
  },
  {
    field: 'retailerSku',
    aliases: [
      'sku',
      'retailer sku',
      'retailersku',
      'item code',
      'itemcode',
      'stock code',
      'stockcode',
      'product code',
      'productcode',
      'article number',
      'articlenumber',
      'article no',
      'articleno',
    ],
    confidence: 'HIGH',
  },
  {
    field: 'gtin',
    aliases: [
      'gtin',
      'gtin-8',
      'gtin8',
      'gtin-12',
      'gtin12',
      'gtin-13',
      'gtin13',
      'gtin-14',
      'gtin14',
      'ean',
      'ean-8',
      'ean8',
      'ean-13',
      'ean13',
      'upc',
      'upc-a',
      'upca',
    ],
    confidence: 'HIGH',
  },
  {
    field: 'barcode',
    aliases: [
      'barcode',
      'barcode number',
      'barcodenumber',
      'scan code',
      'scancode',
      'scan number',
      'scannumber',
    ],
    confidence: 'HIGH',
  },
  {
    field: 'brand',
    aliases: [
      'brand',
      'product brand',
      'productbrand',
      'manufacturer brand',
      'manufacturerbrand',
      'brand name',
      'brandname',
    ],
    confidence: 'HIGH',
  },
  {
    field: 'description',
    aliases: [
      'description',
      'product description',
      'productdescription',
      'item description',
      'itemdescription',
      'long description',
      'longdescription',
    ],
    confidence: 'HIGH',
  },
  {
    field: 'subcategory',
    aliases: [
      'subcategory',
      'sub-category',
      'sub category',
      'product subcategory',
      'productsubcategory',
      'item subcategory',
      'itemsubcategory',
    ],
    confidence: 'HIGH',
  },
  {
    field: 'department',
    aliases: [
      'department',
      'product department',
      'productdepartment',
      'merchandise department',
      'merchandisedepartment',
    ],
    confidence: 'HIGH',
  },
  {
    field: 'promotionalPrice',
    aliases: [
      'promotional price',
      'promotionalprice',
      'promo price',
      'promoprice',
      'promotion price',
      'promotionprice',
      'sale promotional price',
      'sale promotionalprice',
    ],
    confidence: 'HIGH',
  },
  {
    field: 'imageUrl',
    aliases: [
      'image url',
      'imageurl',
      'image',
      'product image',
      'productimage',
      'image link',
      'imagelink',
      'photo url',
      'photourl',
    ],
    confidence: 'MEDIUM',
  },
];

function normaliseColumnName(column: string): string {
  return column
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function compactColumnName(column: string): string {
  return normaliseColumnName(column).replace(/\s/g, '');
}

function findRule(
  column: string
): { rule: MappingRule; alias: string } | null {
  const normalised = normaliseColumnName(column);
  const compact = compactColumnName(column);

  for (const rule of MAPPING_RULES) {
    for (const alias of rule.aliases) {
      if (
        normalised === normaliseColumnName(alias) ||
        compact === compactColumnName(alias)
      ) {
        return {
          rule,
          alias,
        };
      }
    }
  }

  return null;
}

export function suggestProductImportMappings(
  columns: string[]
): ProductImportSuggestedMapping[] {
  const suggestions: ProductImportSuggestedMapping[] = [];
  const usedTargetFields = new Set<ProductImportTargetField>();

  for (const sourceColumn of columns) {
    if (!sourceColumn.trim()) continue;

    const match = findRule(sourceColumn);

    if (!match) continue;

    const { rule, alias } = match;

    /*
     * A canonical target field may only be automatically suggested once.
     * If a retailer supplies two possible source columns for the same field,
     * the UI must ask the retailer to resolve the ambiguity.
     */
    if (usedTargetFields.has(rule.field)) {
      continue;
    }

    usedTargetFields.add(rule.field);

    suggestions.push({
      sourceColumn,
      targetField: rule.field,
      confidence: rule.confidence,
      matchedAlias: alias,
    });
  }

  return suggestions;
}

export function getProductImportTargetFields(): ProductImportTargetField[] {
  return MAPPING_RULES.map((rule) => rule.field);
}

export function getRequiredProductImportFields(): ProductImportTargetField[] {
  return ['name', 'category', 'price', 'currency'];
}
