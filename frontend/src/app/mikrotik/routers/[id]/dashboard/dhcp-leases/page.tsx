'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { DhcpLeasesTable } from '@/components/mikrotik/DhcpLeasesTable';

export default function DhcpLeasesPage() {
  const params = useParams();
  const routerId = params.id as string;

  return (
    <div className="px-6 py-4 space-y-6"> {/* Added padding and spacing */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DHCP Leases</h1>
          <p className="text-muted-foreground text-base">View and manage DHCP leases on your MikroTik router.</p>
        </div>
      </div>

      <Card className="w-full"> {/* Added w-full */}
        <CardHeader>
          <CardTitle>DHCP Lease List</CardTitle> {/* Changed title */}
          <CardDescription>A list of all active DHCP leases.</CardDescription> {/* Added description */}
        </CardHeader>
        <CardContent>
          <DhcpLeasesTable routerId={routerId} />
        </CardContent>
      </Card>
    </div>
  );
}
