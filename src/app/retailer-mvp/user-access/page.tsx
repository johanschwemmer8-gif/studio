import { Separator } from '@/components/ui/separator';

export default function UserAccessPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-3xl font-black tracking-tight">
          User Access
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Manage who can access iNteract, where they operate in your retail
          network, and which platform areas are available to them.
        </p>
      </div>

      <Separator />

      <section className="space-y-2">
        <h3 className="text-xl font-bold">Retailer User Administration</h3>
        <p className="max-w-3xl text-sm text-muted-foreground">
          User administration is being connected to the authoritative retailer
          access model. Role, organisational scope and Sidebar Access will be
          managed here.
        </p>
      </section>
    </div>
  );
}
