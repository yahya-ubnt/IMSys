'use client';

import * as Tabs from "@radix-ui/react-tabs";
import { CheckCircle, XCircle, AlertTriangle, ChevronsRight, ShieldCheck, ListChecks, Users2, GitBranch, Building, Wifi, WifiOff, User, Package, Server, Info, ArrowLeft } from 'lucide-react';
import { DiagnosticLog, DiagnosticStep } from '@/types/diagnostics';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// --- Status & Icon Configuration ---
const statusInfo = {
  Success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  Failure: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  Warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  Skipped: { icon: ChevronsRight, color: 'text-zinc-500', bg: 'bg-zinc-700/20' },
};

const stepIcons = {
  "Billing Check": Package,
  "Mikrotik Router Check": GitBranch,
  "CPE Check": Server,
  "AP Check": Wifi,
  "Neighbor Analysis (Station-Based)": Users2,
  "Neighbor Analysis (Apartment-Based)": Building,
};

// --- Main Page Component ---
export default function DiagnosticReportPage() {
    const params = useParams();
    const { id: userId, logId } = params;
    const [log, setLog] = useState<DiagnosticLog | null>(null);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (!logId || !token) return;
        const fetchLog = async () => {
            try {
                const response = await fetch(`/api/mikrotik/users/${userId}/diagnostics/${logId}`, { headers: { Authorization: `Bearer ${token}` } });
                if (!response.ok) throw new Error("Failed to fetch diagnostic log");
                setLog(await response.json());
            } catch {
                toast({ title: "Error", description: "Failed to load diagnostic log.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchLog();
    }, [logId, userId, token, toast]);

    return (
        <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
            <Topbar />
            <main className="flex-1 p-6 flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/mikrotik/users/${userId}/details`}><Button variant="ghost" size="icon" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"><ArrowLeft className="h-4 w-4" /></Button></Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Diagnostic Report</h1>
                            {log && <p className="text-sm text-zinc-400">Generated on {new Date(log.createdAt).toLocaleString()}</p>}
                        </div>
                    </div>
                </div>

                {loading && <SkeletonLoader />}
                {!loading && log && <ReportContent log={log} />}
                {!loading && !log && <div className="flex h-full items-center justify-center text-zinc-500">Diagnostic log not found.</div>}
            </main>
        </div>
    );
}


// --- Report Content & Layout ---
const ReportContent = ({ log }: { log: DiagnosticLog }) => {
  const timelineSteps = log.steps.filter(s => !s.stepName.includes('Neighbor Analysis'));
  const analysisSteps = log.steps.filter(s => s.stepName.includes('Neighbor Analysis'));
  const overallStatus = log.steps.every(s => s.status === 'Success') ? 'Success' : log.steps.some(s => s.status === 'Failure') ? 'Failure' : 'Warning';

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-8">
      <SummaryCard status={overallStatus} conclusion={log.finalConclusion} />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1">
          <Card title="Diagnostic Timeline" icon={ListChecks}>
            <div className="relative flex flex-col gap-6 pt-4">
              {timelineSteps.map((step, index) => <TimelineStep key={index} step={step} isLast={index === timelineSteps.length - 1} />)}
            </div>
          </Card>
        </div>

        <div className="xl:col-span-2">
          {analysisSteps.length > 0 ? (
            <Card title="Neighbor Analysis" icon={Users2}>
              <AnalysisTabs analysisSteps={analysisSteps} />
            </Card>
          ) : (
            <Card title="Neighbor Analysis" icon={Users2}>
              <div className="flex items-center justify-center h-48">
                <p className="text-zinc-500">No neighbor analysis was performed.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- Reusable Card Component ---
const Card = ({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => (
  <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl shadow-lg">
    <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
      <Icon className="h-5 w-5 text-cyan-400" />
      <h3 className="text-lg font-semibold text-zinc-200">{title}</h3>
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

// --- Summary Card ---
const SummaryCard = ({ status, conclusion }: { status: string, conclusion: string }) => {
  const { icon: StatusIcon, color, bg } = statusInfo[status] || statusInfo.Skipped;
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }} className={cn("p-5 rounded-xl border flex items-start gap-4", bg, `border-${color.replace('text-','')}/30`)}>
      <StatusIcon className={cn("h-8 w-8 mt-1 flex-shrink-0", color)} />
      <div>
        <h2 className={cn("text-xl font-bold", color)}>Overall Status: {status}</h2>
        <p className="text-zinc-300 mt-1">{conclusion}</p>
      </div>
    </motion.div>
  )
}

// --- Timeline Components ---
const TimelineStep = ({ step, isLast }: { step: DiagnosticStep, isLast: boolean }) => {
  const { icon: StatusIcon, color } = statusInfo[step.status] || statusInfo.Skipped;
  const StepIcon = stepIcons[step.stepName] || ListChecks;

  return (
    <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="flex items-start gap-4 pl-12 relative">
      {!isLast && <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-zinc-700/50" />}
      <div className="absolute left-0 top-1 flex items-center justify-center size-9 rounded-full bg-zinc-800 border border-zinc-700">
        <StepIcon className="h-5 w-5 text-cyan-400" />
      </div>
      <div>
        <p className="font-semibold text-zinc-200 flex items-center gap-2.5">{step.stepName} <StatusIcon className={cn("h-4 w-4", color)} /></p>
        <p className="text-sm text-zinc-400">{step.summary}</p>
      </div>
    </motion.div>
  );
};

// --- Analysis Components ---
const AnalysisTabs = ({ analysisSteps }: { analysisSteps: DiagnosticStep[] }) => (
  <Tabs.Root defaultValue={analysisSteps[0].stepName} className="-m-4">
    <Tabs.List className="relative flex w-full items-center justify-start border-b-2 border-zinc-800/50 px-4">
      {analysisSteps.map((step) => (
        <Tabs.Trigger key={step.stepName} value={step.stepName} className="relative px-4 py-3 text-sm font-medium text-zinc-400 transition-colors focus-visible:outline-none data-[state=active]:text-white data-[state=active]:border-b-2 border-cyan-400 -mb-0.5">
          <span className="relative z-10 flex items-center gap-2">
            {React.createElement(stepIcons[step.stepName] || Users2, { className: "h-4 w-4" })} {step.stepName.replace('Neighbor Analysis ', '')}
          </span>
        </Tabs.Trigger>
      ))}
    </Tabs.List>
    <div className="p-4">
      {analysisSteps.map((step) => (
        <Tabs.Content key={step.stepName} value={step.stepName}>
          <NeighborTable neighbors={step.details?.neighbors || []} />
        </Tabs.Content>
      ))}
    </div>
  </Tabs.Root>
);

const NeighborTable = ({ neighbors }: { neighbors: { name: string; isOnline: boolean; accountStatus: string; reason: string }[] }) => {
  if (neighbors.length === 0) {
    return <div className="text-center text-zinc-500 py-12">No neighbors found for this analysis.</div>;
  }
  return (
    <div className="w-full text-sm">
      <div className="grid grid-cols-4 gap-4 font-semibold text-zinc-400 px-4 py-2 border-b border-zinc-800">
        <div>User</div>
        <div>Live Status</div>
        <div>Account Status</div>
        <div className="text-right">Reason for Offline</div>
      </div>
      <div className="max-h-[45vh] overflow-y-auto">
        {neighbors.map((n, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-zinc-800/50 last:border-none hover:bg-zinc-800/30 transition-colors">
            <div className="flex items-center gap-2 font-medium text-zinc-200"><User size={14} /> {n.name}</div>
            <div><StatusBadge status={n.isOnline ? 'Online' : 'Offline'} /></div>
            <div><StatusBadge status={n.accountStatus} /></div>
            <div className="text-zinc-400 text-right pr-2">{n.reason || 'N/A'}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  let colorClass = 'bg-zinc-600/20 text-zinc-400';
  let Icon = Info;

  if (status === 'Online' || status === 'Active') {
    colorClass = 'bg-green-500/10 text-green-400';
    Icon = status === 'Online' ? Wifi : CheckCircle;
  } else if (status === 'Offline' || status === 'Expired' || status === 'Suspended') {
    colorClass = 'bg-red-500/10 text-red-400';
    Icon = status === 'Offline' ? WifiOff : XCircle;
  }

  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-medium w-fit px-2.5 py-1 rounded-full", colorClass)}>
      <Icon size={12} /> {status}
    </div>
  );
};

// --- Skeleton Loader ---
const SkeletonLoader = () => (
  <div className="space-y-8 animate-pulse">
    <div className="h-24 w-full bg-zinc-800/50 rounded-xl"></div>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-1 bg-zinc-800/50 rounded-xl p-4 space-y-8">
        <div className="h-6 w-3/4 bg-zinc-700 rounded-md"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start gap-4 pl-12 relative">
            <div className="absolute left-0 top-1 size-9 rounded-full bg-zinc-700"></div>
            <div className="w-full space-y-2">
              <div className="h-4 w-1/2 bg-zinc-700 rounded-md"></div>
              <div className="h-3 w-full bg-zinc-700 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="xl:col-span-2 bg-zinc-800/50 rounded-xl p-4 space-y-4">
          <div className="h-10 w-1/2 bg-zinc-700 rounded-t-md"></div>
          <div className="space-y-2 p-2">
              {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 w-full bg-zinc-700/50 rounded-md"></div>
              ))}
          </div>
      </div>
    </div>
  </div>
);