'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function MikrotikRouterDashboardRedirectPage() {
  const params = useParams();
  const routerId = params.id as string;
  const router = useRouter();

  useEffect(() => {
    if (routerId) {
      router.replace(`/mikrotik/routers/${routerId}/dashboard/overview`);
    }
  }, [routerId, router]);

  return null; // This page will redirect, so it doesn't render anything
}
