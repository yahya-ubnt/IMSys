'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { FirewallRulesTable } from '@/components/mikrotik/FirewallRulesTable';

export default function FirewallPage() {
  const params = useParams();
  const routerId = params.id as string;

  return (
    <div className="px-6 py-4 space-y-6"> {/* Added padding and spacing */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Firewall</h1>
          <p className="text-muted-foreground text-base">Manage firewall rules for your MikroTik router.</p>
        </div>
      </div>

      <Card className="w-full"> {/* Added w-full */}
        <CardHeader>
          <CardTitle>Firewall Rules</CardTitle> {/* Changed title */}
          <CardDescription>A list of all configured firewall rules.</CardDescription> {/* Added description */}
        </CardHeader>
        <CardContent>
          <FirewallRulesTable routerId={routerId} />
        </CardContent>
      </Card>
    </div>
  );
}
