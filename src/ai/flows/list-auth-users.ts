'use server';

/**
 * @fileOverview Secure platform tool for listing Firebase Authentication users.
 *
 * Platform authorization is established through /platformOperators/{uid}.
 * Firebase custom claims are deliberately not treated as authoritative
 * retailer authorization.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { admin, getDb } from '@/lib/firebase-admin';
import { verifyPlatformOperator } from '@/lib/auth-server';

const ListAuthUsersInputSchema = z.object({
  idToken: z.string().describe("Platform operator's Firebase ID token."),
  maxResults: z.number().optional().default(100),
});

const AuthUserSchema = z.object({
  uid: z.string(),
  email: z.string().optional(),
  displayName: z.string().optional(),
  role: z.string().optional(),
  retailerId: z.string().optional(),
  creationTime: z.string().optional(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

export async function listAuthUsers(
  input: z.input<typeof ListAuthUsersInputSchema>
): Promise<AuthUser[]> {
  const parsedInput = ListAuthUsersInputSchema.parse(input);
  return listAuthUsersFlow(parsedInput);
}

const listAuthUsersFlow = ai.defineFlow(
  {
    name: 'listAuthUsersFlow',
    inputSchema: ListAuthUsersInputSchema,
    outputSchema: z.array(AuthUserSchema),
  },
  async ({ idToken, maxResults }) => {
    await verifyPlatformOperator(idToken);

    try {
      const listUsersResult = await admin.auth().listUsers(maxResults);
      const db = getDb();

      return Promise.all(
        listUsersResult.users.map(async (u) => {
          let role: string | undefined;
          let retailerId: string | undefined;

          if (db) {
            const userDoc = await db
              .collection('users')
              .doc(u.uid)
              .get();

            if (userDoc.exists) {
              const userData = userDoc.data();

              if (userData) {
                role =
                  typeof userData.role === 'string'
                    ? userData.role
                    : undefined;

                retailerId =
                  typeof userData.retailerId === 'string'
                    ? userData.retailerId
                    : undefined;
              }
            }
          }

          return {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            role,
            retailerId,
            creationTime: u.metadata.creationTime,
          };
        })
      );
    } catch (error: any) {
      console.error(
        '[Platform] Auth Discovery Failure:',
        error?.message || error
      );

      throw new Error(
        `Auth Service Error: ${
          error?.message || 'Unable to list Auth accounts.'
        }`
      );
    }
  }
);
