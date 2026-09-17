import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QR Template Preview | iNteract AOE',
  description: 'Design preview destination for iNteract AOE QR Templates.',
};

export default function QrTemplatePreviewPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border">
          <span className="text-lg font-semibold">iN</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          QR Template Preview
        </h1>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          This QR code is a design preview only. It lets you test how the
          configured QR Template looks and scans before it is used in a live
          retail deployment.
        </p>

        <div className="mt-6 rounded-lg border bg-muted/30 p-4 text-sm">
          No Campaign, Activation, Deployment or QR identity has been created.
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          iNteract AOE · Point-of-Decision Retail Intelligence
        </p>
      </section>
    </main>
  );
}
