'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';
import { Cpu, Gauge, HardDrive, Globe, Clock, Server, GitBranch } from 'lucide-react';

interface SystemInfo {
  'board-name': string;
  version: string;
  uptime: string;
  'cpu-load': string;
  'cpu-count': string;
  'cpu-frequency': string;
  'free-memory': string;
  'total-memory': string;
  'hdd-free': string;
  'total-hdd-space': string;
  'ip-address': string;
}

export function CombinedRouterInfoCard({ routerId }: { routerId: string }) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!routerId || !token) return;

    const fetchSystemInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/routers/${routerId}/dashboard/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch router info');
        }
        const data = await response.json();
        setSystemInfo(data);
      } catch (err: unknown) {
        setError((err instanceof Error) ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, [routerId, token]);

  if (loading) {
    return <div>Loading router information...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!systemInfo) {
    return <div>No router information available.</div>;
  }

  const formatMemory = (bytes: string) => {
    const value = parseInt(bytes, 10);
    if (isNaN(value)) return 'N/A';
    return `${(value / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatHddSpace = (bytes: string) => {
    const value = parseInt(bytes, 10);
    if (isNaN(value)) return 'N/A';
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let size = value;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(2)} ${units[i]}`;
  };

  return (
    <Card className="w-full bg-gray-900 text-white border-gray-700 shadow-lg"> {/* Added futuristic styling */}
      <CardHeader className="border-b border-gray-700 pb-4"> {/* Added bottom border */}
        <CardTitle className="text-2xl font-bold text-blue-400">Router Details</CardTitle>
        <CardDescription className="text-gray-400">Comprehensive information about your MikroTik router.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6"> {/* Adjusted grid and gap */}
        {/* System Info Section */}
        <div className="flex items-center space-x-3 border-b border-gray-800 pb-3"> {/* CPU Load */}
          <Cpu className="h-5 w-5 text-green-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-400">CPU Load</p>
            <p className="text-lg font-semibold text-blue-300">{systemInfo['cpu-load']}%</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 border-b border-gray-800 pb-3"> {/* Free Memory */}
          <Gauge className="h-5 w-5 text-purple-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-400">Free Memory</p>
            <p className="text-lg font-semibold text-blue-300">{formatMemory(systemInfo['free-memory'])}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 border-b border-gray-800 pb-3"> {/* HDD Free */}
          <HardDrive className="h-5 w-5 text-red-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-400">HDD Free</p>
            <p className="text-lg font-semibold text-blue-300">{formatHddSpace(systemInfo['hdd-free'])}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 border-b border-gray-800 pb-3"> {/* IP Address */}
          <Globe className="h-5 w-5 text-yellow-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-400">IP Address</p>
            <p className="text-lg font-semibold text-blue-300">{systemInfo['ip-address']}</p>
          </div>
        </div>

        {/* Router Info Section */}
        <div className="flex items-center space-x-3 border-b border-gray-800 pb-3"> {/* Uptime Duration */}
          <Clock className="h-5 w-5 text-cyan-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-400">Uptime Duration</p>
            <p className="text-lg font-semibold text-blue-300">{systemInfo.uptime}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 border-b border-gray-800 pb-3"> {/* Device Name */}
          <Server className="h-5 w-5 text-orange-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-400">Device Name</p>
            <p className="text-lg font-semibold text-blue-300">{systemInfo['board-name']}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 border-b border-gray-800 pb-3"> {/* Version */}
          <GitBranch className="h-5 w-5 text-pink-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-400">Version</p>
            <p className="text-lg font-semibold text-blue-300">{systemInfo.version}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 border-b border-gray-800 pb-3"> {/* CPU Count */}
          <Cpu className="h-5 w-5 text-green-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-400">CPU Count</p>
            <p className="text-lg font-semibold text-blue-300">{systemInfo['cpu-count'] || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 border-b border-gray-800 pb-3"> {/* CPU Frequency */}
          <Gauge className="h-5 w-5 text-purple-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-400">CPU Frequency</p>
            <p className="text-lg font-semibold text-blue-300">{systemInfo['cpu-frequency'] || 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
