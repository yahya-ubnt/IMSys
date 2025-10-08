'use client';

import * as Tabs from "@radix-ui/react-tabs";
import { CheckCircle, XCircle, AlertTriangle, ChevronsRight, ShieldCheck, ListChecks, Users2, GitBranch, Building, Wifi, WifiOff, User, Package, Server } from 'lucide-react';
import { DiagnosticLog, DiagnosticStep } from '@/types/diagnostics';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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

// --- Main Modal Component ---
export function DiagnosticModal({ isOpen, onClose, log, status }: { isOpen: boolean; onClose: () => void; log: DiagnosticLog | null; status: 'running' | 'viewing' | 'idle' }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] w-full bg-zinc-900/80 backdrop-blur-lg border-zinc-700 text-white shadow-2xl shadow-blue-500/10 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-2xl flex items-center gap-2">
            <ShieldCheck size={24} />
            {status === 'running' ? "Running Live Diagnostic" : "Diagnostic Report"}
          </DialogTitle>
          {status === 'viewing' && log && <DialogDescription>Generated on {new Date(log.createdAt).toLocaleString()}</DialogDescription>}
        </DialogHeader>

        <div className="mt-4 max-h-[80vh] overflow-y-auto p-1 pr-4">
          {status === 'running' && <SkeletonLoader />}
          {status === 'viewing' && log && <ReportContent log={log} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Report Content & Layout ---
const ReportContent = ({ log }: { log: DiagnosticLog }) => {
  const timelineSteps = log.steps.filter(s => !s.stepName.includes('Neighbor Analysis'));
  const analysisSteps = log.steps.filter(s => s.stepName.includes('Neighbor Analysis'));

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="flex flex-col gap-8 p-4">
      {/* Timeline Section */}
      <div>
        <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2"><ListChecks size={18} /> Diagnostic Timeline</h3>
        <div className="relative flex flex-col gap-4">
          {timelineSteps.map((step, index) => <TimelineStep key={index} step={step} isLast={index === timelineSteps.length - 1} />)}
        </div>
      </div>

      {/* Analysis Section */}
      <div>
        {analysisSteps.length > 0 ? (
          <AnalysisTabs analysisSteps={analysisSteps} />
        ) : (
          <div className="flex items-center justify-center h-full bg-zinc-900/50 rounded-lg border border-zinc-800">
            <p className="text-zinc-500">No neighbor analysis was performed.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// --- Timeline Components (Left Column) ---
const TimelineStep = ({ step, isLast }: { step: DiagnosticStep, isLast: boolean }) => {
  const { icon: StatusIcon, color } = statusInfo[step.status] || statusInfo.Skipped;
  const StepIcon = stepIcons[step.stepName] || ListChecks;

  return (
    <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="flex items-start gap-4 pl-12 py-2 relative">
      {!isLast && <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-zinc-700" />}
      <div className="absolute left-0 top-2 flex items-center justify-center size-10 rounded-full bg-zinc-800 border border-zinc-700">
        <StepIcon className="h-5 w-5 text-cyan-400" />
      </div>
      <div>
        <p className="font-semibold text-zinc-200 flex items-center gap-2">{step.stepName} <StatusIcon className={cn("h-4 w-4", color)} /></p>
        <p className="text-sm text-zinc-400">{step.summary}</p>
      </div>
    </motion.div>
  );
};

// --- Analysis Components (Right Column) ---
const AnalysisTabs = ({ analysisSteps }: { analysisSteps: DiagnosticStep[] }) => (
  <Tabs.Root defaultValue={analysisSteps[0].stepName}>
    <Tabs.List className="relative flex w-full items-center justify-start border-b-2 border-zinc-700 mb-4">
      {analysisSteps.map((step) => (
        <Tabs.Trigger key={step.stepName} value={step.stepName} className="relative px-3 py-2 text-sm font-medium text-zinc-400 transition-colors focus-visible:outline-none data-[state=active]:text-white">
          <span className="relative z-10 flex items-center gap-2">
            {React.createElement(stepIcons[step.stepName] || Users2, { className: "h-4 w-4" })} {step.stepName.replace('Neighbor Analysis ', '')}
          </span>
        </Tabs.Trigger>
      ))}
    </Tabs.List>
    {analysisSteps.map((step) => (
      <Tabs.Content key={step.stepName} value={step.stepName}>
        <NeighborTable neighbors={step.details?.neighbors || []} />
      </Tabs.Content>
    ))}
  </Tabs.Root>
);

const NeighborTable = ({ neighbors }: { neighbors: { name: string; isOnline: boolean; accountStatus: string; reason: string }[] }) => {
  if (neighbors.length === 0) {
    return <div className="text-center text-zinc-500 py-8">No neighbors found for this analysis.</div>;
  }
  return (
    <div className="w-full text-sm">
      <div className="grid grid-cols-4 gap-4 font-semibold text-zinc-400 px-4 py-2 border-b border-zinc-700">
        <div>User</div>
        <div>Live Status</div>
        <div>Account Status</div>
        <div>Reason for Offline</div>
      </div>
      <div className="max-h-[50vh] overflow-y-auto">
        {neighbors.map((n, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-zinc-800 last:border-none hover:bg-zinc-800/50">
            <div className="flex items-center gap-2"><User size={14} /> {n.name}</div>
            <div><StatusBadge status={n.isOnline ? 'Online' : 'Offline'} /></div>
            <div><StatusBadge status={n.accountStatus} /></div>
            <div className="text-zinc-400 pr-2">{n.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const isOnline = status === 'Online';
  const isActive = status === 'Active';
  const color = status === 'Online' || status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400';
  const Icon = isOnline ? Wifi : (status === 'Offline' ? WifiOff : (isActive ? CheckCircle : XCircle));
  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-medium w-fit px-2 py-0.5 rounded-full", color)}>
      <Icon size={12} /> {status}
    </div>
  );
};

// --- Skeleton Loader ---
const SkeletonLoader = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 animate-pulse">
    {/* Left Column Skeleton */}
    <div className="lg:col-span-1 space-y-8">
      <div className="h-6 w-3/4 bg-zinc-700 rounded-md"></div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 pl-12 relative">
          <div className="absolute left-0 top-2 size-10 rounded-full bg-zinc-800 border border-zinc-700"></div>
          <div className="w-full space-y-2">
            <div className="h-4 w-1/2 bg-zinc-700 rounded-md"></div>
            <div className="h-3 w-full bg-zinc-700 rounded-md"></div>
          </div>
        </div>
      ))}
    </div>
    {/* Right Column Skeleton */}
    <div className="lg:col-span-2 space-y-4">
        <div className="h-10 w-1/2 bg-zinc-700 rounded-t-md"></div>
        <div className="space-y-2 p-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 w-full bg-zinc-800 rounded-md"></div>
            ))}
        </div>
    </div>
  </div>
);