'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { InterfacesTable } from '@/components/mikrotik/InterfacesTable';

export default function InterfacesPage() {
  const params = useParams();
  const routerId = params.id as string;

  return (
    <div className="px-6 py-4 space-y-6 bg-gray-900 text-white min-h-screen"> {/* Added padding and spacing, futuristic background */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-400">Interfaces</h1>
          <p className="text-gray-400 text-base">Manage network interfaces of your MikroTik router.</p>
        </div>
      </div>

      <Card className="w-full bg-gray-800 text-white border-gray-700 shadow-lg"> {/* Added w-full, futuristic card styling */}
        <CardHeader className="border-b border-gray-700 pb-4"> {/* Added bottom border */}
          <CardTitle className="text-2xl font-bold text-blue-400">Interface List</CardTitle> {/* Changed title */}
          <CardDescription className="text-gray-400">A list of all network interfaces.</CardDescription> {/* Added description */}
        </CardHeader>
        <CardContent>
          <InterfacesTable routerId={routerId} />
        </CardContent>
      </Card>
    </div>
  );
}
