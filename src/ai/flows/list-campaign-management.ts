"use server";

import { ai } from "@/ai/genkit";
import { z } from "genkit";
import { db } from "@/lib/firebase-admin";
import { verifyAuth, getAuthorizedRetailerId } from "@/lib/auth-server";
import { CampaignSchema } from "@/lib/schemas/campaign";

const ListCampaignManagementInputSchema = z.object({
  idToken: z.string().min(1),
  retailerId: z.string().min(1),
});

function timestampToIso(timestamp: {
  seconds: number;
  nanoseconds: number;
}): string {
  const milliseconds =
    timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1_000_000);

  return new Date(milliseconds).toISOString();
}

const CampaignManagementItemSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  purpose: z.string().optional(),
  objective: z.string().optional(),
  status: z.string().min(1),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  timezone: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  archivedAt: z.string().optional(),
});

export type CampaignManagementItem = z.infer<
  typeof CampaignManagementItemSchema
>;

const ListCampaignManagementOutputSchema = z.array(
  CampaignManagementItemSchema
);

export async function listCampaignManagement(input: {
  idToken: string;
  retailerId: string;
}): Promise<CampaignManagementItem[]> {
  return listCampaignManagementFlow(input);
}

const listCampaignManagementFlow = ai.defineFlow(
  {
    name: "listCampaignManagementFlow",
    inputSchema: ListCampaignManagementInputSchema,
    outputSchema: ListCampaignManagementOutputSchema,
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

    const campaigns: CampaignManagementItem[] = [];

    for (const document of snapshot.docs) {
      const campaign = CampaignSchema.parse(document.data());

      if (campaign.campaignId !== document.id) {
        throw new Error("CAMPAIGN_IDENTITY_MISMATCH");
      }

      campaigns.push({
        campaignId: campaign.campaignId,
        name: campaign.name,
        description: campaign.description,
        purpose: campaign.purpose,
        objective: campaign.objective,
        status: campaign.status,
        startAt: campaign.startAt ? timestampToIso(campaign.startAt) : undefined,
        endAt: campaign.endAt ? timestampToIso(campaign.endAt) : undefined,
        timezone: campaign.timezone,
        createdAt: timestampToIso(campaign.createdAt),
        updatedAt: timestampToIso(campaign.updatedAt),
        archivedAt: campaign.archivedAt ? timestampToIso(campaign.archivedAt) : undefined,
      });
    }

    return campaigns.sort((a, b) => a.name.localeCompare(b.name));
  }
);
