'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { MikroTikTerminal } from '@/components/mikrotik/Terminal';

export default function TerminalPage() {
  const params = useParams();
  const routerId = params.id as string;

  return (
    <div className="px-6 py-4 space-y-6"> {/* Added padding and spacing */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Terminal</h1>
          <p className="text-muted-foreground text-base">Access the MikroTik router's command line interface.</p>
        </div>
      </div>

      <Card className="w-full"> {/* Added w-full */}
        <CardHeader>
          <CardTitle>Router Terminal</CardTitle> {/* Changed title */}
          <CardDescription>Interactive command line access to the router.</CardDescription> {/* Added description */}
        </CardHeader>
        <CardContent>
          <MikroTikTerminal routerId={routerId} />
        </CardContent>
      </Card>
    </div>
  );
}
