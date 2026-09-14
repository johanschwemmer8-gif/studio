"use server";

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { db } from "@/lib/firebase-admin";
import { verifyAuth, getAuthorizedRetailerId } from "@/lib/auth-server";
import { canAccessQrStoreResource } from "@/lib/qr-resource-authorization";

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

    const snapshot = await db
      .collection("stores")
      .where("retailerId", "==", authorizedRetailerId)
      .get();

    const stores: RetailerStoreOption[] = [];

    for (const document of snapshot.docs) {
      const storeData = document.data();

      if (!canAccessQrStoreResource(actor, document.id)) {
        continue;
      }

      const storeName =
        typeof storeData.storeName === "string"
          ? storeData.storeName.trim()
          : "";

      if (!storeName) {
        throw new Error("STORE_NAME_MISSING");
      }

      const status =
        typeof storeData.status === "string"
          ? storeData.status.trim()
          : undefined;

      if (status && status.toLowerCase() === "inactive") {
        continue;
      }

      stores.push({
        storeId: document.id,
        storeName,
        ...(status ? { status } : {}),
      });
    }

    return stores.sort((a, b) => a.storeName.localeCompare(b.storeName));
  }
);
