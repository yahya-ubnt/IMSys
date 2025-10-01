'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { PppoeTabs } from '@/components/mikrotik/PppoeTabs';

export default function PppoePage() {
  const params = useParams();
  const routerId = params.id as string;

  return (
    <div className="px-6 py-4 space-y-6"> {/* Added padding and spacing */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PPPoE</h1>
          <p className="text-muted-foreground text-base">Manage PPPoE settings and sessions.</p>
        </div>
      </div>

      <Card className="w-full"> {/* Added w-full */}
        <CardHeader>
          <CardTitle>PPPoE Management</CardTitle> {/* Changed title */}
          <CardDescription>Active sessions and secret accounts.</CardDescription> {/* Added description */}
        </CardHeader>
        <CardContent>
          <PppoeTabs routerId={routerId} />
        </CardContent>
      </Card>
    </div>
  );
}
