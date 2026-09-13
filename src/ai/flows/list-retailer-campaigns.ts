"use server";

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { db } from "@/lib/firebase-admin";
import { verifyAuth, getAuthorizedRetailerId } from "@/lib/auth-server";
import { CampaignSchema } from "@/lib/schemas/campaign";

const ListRetailerCampaignsInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
});

const RetailerCampaignOptionSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().min(1),
  status: z.string().min(1),
});

export type RetailerCampaignOption = z.infer<
  typeof RetailerCampaignOptionSchema
>;

const ListRetailerCampaignsOutputSchema = z.array(
  RetailerCampaignOptionSchema
);

export async function listRetailerCampaigns(input: {
  idToken: string;
  retailerId: string;
}): Promise<RetailerCampaignOption[]> {
  return listRetailerCampaignsFlow(input);
}

const listRetailerCampaignsFlow = ai.defineFlow(
  {
    name: "listRetailerCampaignsFlow",
    inputSchema: ListRetailerCampaignsInputSchema,
    outputSchema: ListRetailerCampaignsOutputSchema,
  },
  async (data) => {
    await verifyAuth(data.idToken);

    const authorizedRetailerId = await getAuthorizedRetailerId(
      data.idToken,
      data.retailerId
    );

    if (!db) {
      throw new Error("Infrastructure Layer Unavailable.");
    }

    const snapshot = await db
      .collection("campaigns")
      .where("retailerId", "==", authorizedRetailerId)
      .get();

    const campaigns: RetailerCampaignOption[] = [];

    for (const document of snapshot.docs) {
      const campaign = CampaignSchema.parse(document.data());

      if (campaign.campaignId !== document.id) {
        throw new Error("CAMPAIGN_IDENTITY_MISMATCH");
      }

      if (campaign.status === "ARCHIVED") {
        continue;
      }

      campaigns.push({
        campaignId: campaign.campaignId,
        name: campaign.name,
        status: campaign.status,
      });
    }

    return campaigns.sort((a, b) => a.name.localeCompare(b.name));
  }
);
