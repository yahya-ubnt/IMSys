'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { Topbar } from '@/components/topbar';
import { Input } from '@/components/ui/input';
import { Server, User, Search as SearchIcon, Loader2, HeartPulse, ShieldCheck, CheckCircle, XCircle, Users, GitBranch, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataTable } from "@/components/data-table";
import { ColumnDef } from '@tanstack/react-table';
import { DiagnosticLog } from '@/types/diagnostics';
import { cn } from '@/lib/utils';

// --- Type Definitions ---
interface SearchResult { _id: string; name: string; type: 'User' | 'Access' | 'Station'; entity: { station?: string; }; }
interface DeviceCheck { deviceName: string; status: 'Success' | 'Failure'; message: string; }
interface UserCheck { officialName: string; isOnline: boolean; details: string; }

// --- Status Configuration ---
const statusInfo = {
  Success: { icon: CheckCircle, color: 'text-green-400', border: 'border-green-500/20' },
  Failure: { icon: XCircle, color: 'text-red-400', border: 'border-red-500/20' },
};

// --- Main Component ---
export default function NetworkHealthCheckPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeDiagnosticId, setActiveDiagnosticId] = useState<string | null>(null);
  const [diagnosticLog, setDiagnosticLog] = useState<DiagnosticLog | null>(null);
  const { token } = useAuth();

  const fetchSearchResults = useCallback(async (query: string) => {
    if (!token || query.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${query}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch search results');
      setSearchResults(await res.json());
    } catch (error) {
      console.error(error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [token]);

  useEffect(() => {
    const debounce = setTimeout(() => { fetchSearchResults(searchQuery); }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, fetchSearchResults]);

  const handleRunDiagnostic = async (entity: SearchResult) => {
    setActiveDiagnosticId(entity._id);
    setDiagnosticLog(null);
    setSearchQuery('');
    setSearchResults([]);

    const deviceIdToRun = entity.type === 'User' ? entity.entity.station : entity._id;
    if (!deviceIdToRun) {
        toast.error("This user is not associated with a station and cannot be diagnosed.");
        setActiveDiagnosticId(null);
        return;
    }

    try {
        const response = await fetch('/api/bulk-diagnostics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                deviceIds: [deviceIdToRun],
                userChecks: entity.type === 'User' ? [entity.name] : [],
                stream: false // Explicitly disable streaming
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
            throw new Error(errorData.message || 'An error occurred during diagnostics.');
        }

        const results = await response.json();
        setDiagnosticLog(results);
        toast.success(`Diagnostic on ${entity.name} completed.`);

    } catch (error: any) {
        toast.error(`Diagnostic failed: ${error.message}`);
    } finally {
        setActiveDiagnosticId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <main className="flex-1 p-6 space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="inline-block p-3 bg-zinc-800/50 border border-blue-500/20 rounded-full">
            <ShieldCheck className="h-10 w-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Network Health Intelligence
          </h1>
          <p className="mt-2 text-base text-zinc-400">
            A live, integrated diagnostic panel for real-time network insights.
          </p>
        </motion.div>

        <motion.div layout className="w-full max-w-xl mx-auto">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <Input
              placeholder="Find a user or device to begin diagnostic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-10 w-full bg-zinc-900/50 backdrop-blur-sm text-base text-white border-2 border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
            />
          </div>

          <AnimatePresence>
            {searchQuery.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mt-4 space-y-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {isSearching && <p className="text-zinc-400 text-sm text-center p-4">Scanning...</p>}
                {!isSearching && searchResults.length > 0 && (
                  searchResults.map((item: SearchResult) => (
                    <motion.div
                      key={item._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 border-b border-zinc-800 last:border-b-0 hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {item.type === 'User' ? <User className="h-5 w-5 text-blue-400" /> : <Server className="h-5 w-5 text-cyan-400" />}
                        <div>
                          <p className="font-semibold text-zinc-200">{item.name}</p>
                          <p className="text-xs text-zinc-500">{item.type}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRunDiagnostic(item)}
                        disabled={activeDiagnosticId !== null}
                        size="sm"
                        className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all duration-200 hover:scale-105 disabled:opacity-50"
                      >
                        {activeDiagnosticId === item._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HeartPulse className="mr-2 h-4 w-4" />}
                        Run Check
                      </Button>
                    </motion.div>
                  ))
                )}
                {!isSearching && searchQuery.length > 1 && searchResults.length === 0 && (
                  <p className="text-zinc-500 text-center py-4 text-sm">No results found for "{searchQuery}"</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        <AnimatePresence>
          {activeDiagnosticId && !diagnosticLog && <DiagnosticLoader />}
          {diagnosticLog && <DiagnosticResultsDisplay log={diagnosticLog} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Report Sub-components (Rebuilt) ---
const DiagnosticLoader = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center items-center p-8 flex-col gap-4">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        <p className="text-xl text-zinc-300 font-semibold">Initiating Diagnostic...</p>
    </motion.div>
);

const SectionCard = ({ title, icon: Icon, children, borderColor = 'border-zinc-700' }: { title: string, icon: React.ElementType, children: React.ReactNode, borderColor?: string }) => (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className={cn("bg-zinc-900/50 border rounded-lg", borderColor)}>
        <div className="p-3 border-b flex items-center gap-3 bg-zinc-800/40 rounded-t-lg" style={{ borderBottomColor: 'rgba(var(--tw-color-zinc-700-rgb), 0.5)' }}>
            <Icon size={18} className="text-cyan-400" />
            <h3 className="text-lg font-semibold text-cyan-400">{title}</h3>
        </div>
        <div className="p-4">
            {children}
        </div>
    </motion.div>
);

const ConclusionCard = ({ conclusion, status }: { conclusion: string, status: 'Success' | 'Failure' }) => {
  const { icon: Icon, color, border } = statusInfo[status];
  const [rootCause, recommendation] = conclusion.split('**Recommendation:**');

  return (
    <SectionCard title="Final Conclusion" icon={GitBranch} borderColor={border}>
      <div className="flex items-start gap-4">
        <Icon className={cn("h-8 w-8 flex-shrink-0", color)} />
        <div>
            <p className="text-zinc-200 text-sm pt-1">{rootCause.replace('**Root Cause:**', '')}</p>
            {recommendation && <p className="text-amber-400 text-sm pt-2 mt-2 border-t border-zinc-700">{`Recommendation: ${recommendation}`}</p>}
        </div>
      </div>
    </SectionCard>
  );
};

const DiagnosticResultsDisplay = ({ log }: { log: DiagnosticLog }) => {
    const deviceChecks: DeviceCheck[] = log.steps
        .filter(step => step.stepName.startsWith('Ping'))
        .map(step => ({
            deviceName: step.stepName.replace('Ping Initial Device: ', '').replace('Ping Station: ', ''),
            status: step.status as 'Success' | 'Failure',
            message: step.summary,
        }));

    const userChecks: UserCheck[] = log.steps
        .filter(step => step.stepName.startsWith('User Status'))
        .map(step => ({
            officialName: step.stepName.replace('User Status: ', ''),
            isOnline: step.status === 'Success',
            details: step.summary,
        }));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto w-full">
            <ConclusionCard conclusion={log.finalConclusion} status={log.finalConclusion.includes("No issues detected") ? "Success" : "Failure"} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DeviceChecks deviceChecks={deviceChecks} />
                <UserChecks userChecks={userChecks} />
            </div>
        </motion.div>
    );
};

const DeviceChecks = ({ deviceChecks }: { deviceChecks: DeviceCheck[] }) => (
  <Card className="bg-zinc-900 text-white border-zinc-700 shadow-xl rounded-lg">
    <CardHeader className="pb-3">
      <div className="flex items-center space-x-2">
        <Server className="h-5 w-5 text-cyan-400" />
        <CardTitle className="text-base font-medium text-cyan-400">Device Checks</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      {deviceChecks.length > 0 ? deviceChecks.map((device, i) => (
        <div key={i} className="p-2 rounded-lg bg-zinc-800 border border-zinc-700">
          <div className="flex justify-between items-center">
            <div className="font-semibold text-zinc-200 text-sm">{device.deviceName}</div>
            <div className={`flex items-center space-x-1.5 font-bold text-xs ${device.status === 'Success' ? 'text-green-400' : 'text-red-400'}`}>
              {device.status === 'Success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>{device.status}</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{device.message}</p>
        </div>
      )) : <p className="text-zinc-500 text-center py-4 text-sm">No device checks performed.</p>}
    </CardContent>
  </Card>
);



const UserChecks = ({ userChecks }: { userChecks: UserCheck[] }) => (
  <Card className="bg-zinc-900 text-white border-zinc-700 shadow-xl rounded-lg">
    <CardHeader className="pb-3">
      <div className="flex items-center space-x-2">
        <Users className="h-5 w-5 text-cyan-400" />
        <CardTitle className="text-base font-medium text-cyan-400">User Status Checks</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      {userChecks.length > 0 ? (
         <DataTable
            columns={userCheckColumns}
            data={userChecks}
            className="scroll-container text-sm [&_th]:bg-zinc-800 [&_th]:text-white [&_th]:font-semibold [&_td]:bg-zinc-900 [&_td]:text-white [&_tr:last-child_td]:border-b-0 hover:[&_tr]:bg-zinc-800 transition-colors duration-200"
          />
      ) : <p className="text-zinc-500 text-center py-4 text-sm">No user status checks performed.</p>}
    </CardContent>
  </Card>
);

const userCheckColumns: ColumnDef<UserCheck>[] = [
    {
        accessorKey: "officialName",
        header: "User",
    },
    {
        accessorKey: "isOnline",
        header: "Status",
        cell: ({ row }) => {
            const isOnline = row.original.isOnline;
            return (
                <div className={`flex items-center space-x-1.5 font-bold text-xs ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                    {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                    <span>{isOnline ? 'Online' : 'Offline'}</span>
                </div>
            );
        },
    },
    {
        accessorKey: "details",
        header: "Details",
    },
];
