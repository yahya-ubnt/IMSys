'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { LogsViewer } from '@/components/mikrotik/LogsViewer';

export default function LogsPage() {
  const params = useParams();
  const routerId = params.id as string;

  return (
    <div className="px-6 py-4 space-y-6"> {/* Added padding and spacing */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
          <p className="text-muted-foreground text-base">View system logs from your MikroTik router.</p>
        </div>
      </div>

      <Card className="w-full"> {/* Added w-full */}
        <CardHeader>
          <CardTitle>Router Logs</CardTitle> {/* Changed title */}
          <CardDescription>Recent log entries from the router.</CardDescription> {/* Added description */}
        </CardHeader>
        <CardContent>
          <LogsViewer routerId={routerId} />
        </CardContent>
      </Card>
    </div>
  );
}
