'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MikrotikRouterDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('./dashboard/overview');
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center bg-zinc-900 text-white">
      <p>Redirecting...</p>
    </div>
  );
}
