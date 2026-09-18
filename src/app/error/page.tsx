import type { Metadata } from 'next';

import { getQrResolutionShopperMessage } from '@/lib/qr-resolution-shopper-message';

export const metadata: Metadata = {
  title: 'QR Experience | iNteract AOE',
  description: 'iNteract AOE QR experience status.',
};

export default async function QrResolutionErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawCode = params.code;
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;

  const message = getQrResolutionShopperMessage(code);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border">
          <span className="text-lg font-semibold">iN</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          {message.title}
        </h1>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {message.description}
        </p>

        <p className="mt-6 text-xs text-muted-foreground">
          iNteract AOE · Point-of-Decision Retail Intelligence
        </p>
      </section>
    </main>
  );
}
