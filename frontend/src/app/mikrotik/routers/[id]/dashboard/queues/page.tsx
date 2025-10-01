'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { QueuesTable } from '@/components/mikrotik/QueuesTable';

export default function QueuesPage() {
  const params = useParams();
  const routerId = params.id as string;

  return (
    <div className="py-4 space-y-6"> {/* Added padding and spacing */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Queues</h1>
          <p className="text-muted-foreground text-base">Manage queues for traffic shaping and bandwidth control.</p>
        </div>
      </div>

      <Card className="w-full"> {/* Added w-full */}
        <CardHeader>
          <CardTitle>Queue List</CardTitle> {/* Changed title */}
          <CardDescription>A list of all configured queues.</CardDescription> {/* Added description */}
        </CardHeader>
        <CardContent>
          <QueuesTable routerId={routerId} />
        </CardContent>
      </Card>
    </div>
  );
}
