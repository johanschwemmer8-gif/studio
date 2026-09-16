"use server";

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { db } from "@/lib/firebase-admin";
import { verifyAuth, getAuthorizedRetailerId } from "@/lib/auth-server";
import { canAccessQrStoreResource } from "@/lib/qr-resource-authorization";
import type { AuthorizedContext } from "@/lib/auth-types";

const ListRetailerStoresInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
});

const RetailerStoreOptionSchema = z.object({
  storeId: z.string().min(1),
  storeName: z.string().min(1),
  status: z.string().min(1).optional(),
});

export type RetailerStoreOption = z.infer<
  typeof RetailerStoreOptionSchema
>;

const ListRetailerStoresOutputSchema = z.array(
  RetailerStoreOptionSchema
);

function extractAuthorizedStores(
  organizationData: unknown,
  actor: AuthorizedContext
): RetailerStoreOption[] {
  const data =
    organizationData &&
    typeof organizationData === "object"
      ? (organizationData as Record<string, unknown>)
      : {};

  const brands = Array.isArray(data.brands) ? data.brands : [];
  const stores = new Map<string, RetailerStoreOption>();

  for (const brand of brands) {
    const divisions =
      brand &&
      typeof brand === "object" &&
      Array.isArray((brand as any).divisions)
        ? (brand as any).divisions
        : [];

    for (const division of divisions) {
      const regions =
        division &&
        typeof division === "object" &&
        Array.isArray((division as any).regions)
          ? (division as any).regions
          : [];

      for (const region of regions) {
        const areas =
          region &&
          typeof region === "object" &&
          Array.isArray((region as any).areas)
            ? (region as any).areas
            : [];

        for (const area of areas) {
          const areaStores =
            area &&
            typeof area === "object" &&
            Array.isArray((area as any).stores)
              ? (area as any).stores
              : [];

          for (const store of areaStores) {
            if (!store || typeof store !== "object") {
              continue;
            }

            const storeId =
              typeof (store as any).id === "string"
                ? (store as any).id.trim()
                : "";

            const storeName =
              typeof (store as any).name === "string"
                ? (store as any).name.trim()
                : "";

            if (!storeId || !storeName) {
              continue;
            }

            if (!canAccessQrStoreResource(actor, storeId)) {
              continue;
            }

            stores.set(storeId, {
              storeId,
              storeName,
            });
          }
        }
      }
    }
  }

  return Array.from(stores.values()).sort((a, b) =>
    a.storeName.localeCompare(b.storeName)
  );
}

export async function listRetailerStores(input: {
  idToken: string;
  retailerId: string;
}): Promise<RetailerStoreOption[]> {
  return listRetailerStoresFlow(input);
}

const listRetailerStoresFlow = ai.defineFlow(
  {
    name: "listRetailerStoresFlow",
    inputSchema: ListRetailerStoresInputSchema,
    outputSchema: ListRetailerStoresOutputSchema,
  },
  async (data) => {
    const actor = await verifyAuth(data.idToken);

    if ("error" in actor) {
      throw new Error(actor.error);
    }

    const authorizedRetailerId = await getAuthorizedRetailerId(
      data.idToken,
      data.retailerId
    );

    if (!db) {
      throw new Error("Infrastructure Layer Unavailable.");
    }

    const organizationDocument = await db
      .collection("configurations")
      .doc(`${authorizedRetailerId}_org`)
      .get();

    if (!organizationDocument.exists) {
      return [];
    }

    const organization = organizationDocument.data();

    if (
      !organization ||
      organization.retailerId !== authorizedRetailerId ||
      organization.type !== "org"
    ) {
      throw new Error("ORGANIZATION_CONFIGURATION_INVALID");
    }

    return extractAuthorizedStores(
      organization.data,
      actor
    );
  }
);
