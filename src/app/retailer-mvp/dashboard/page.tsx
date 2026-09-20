'use client';

import AuthoritativeOverview from '@/components/dashboard/authoritative-overview';
import SetupGuide from '@/components/dashboard/setup-guide';
import { useAuth } from '@/context/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();
  const retailerId = user?.retailerId;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {retailerId ? <SetupGuide retailerId={retailerId} /> : null}

      <AuthoritativeOverview />
    </div>
  );
}
