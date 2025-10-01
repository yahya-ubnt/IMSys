'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, XCircle, AlertTriangle, Loader, ChevronsRight, User, Phone, Wifi, WifiOff, ShieldCheck, ListChecks, Users2, GitBranch } from 'lucide-react';
import { DiagnosticLog, DiagnosticStep, NeighborAnalysisDetails } from '@/types/diagnostics';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';

// --- Status Configuration ---
const statusInfo = {
  Success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  Failure: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  Warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  Skipped: { icon: ChevronsRight, color: 'text-zinc-500', bg: 'bg-zinc-700/10', border: 'border-zinc-600/20' },
  'In-Progress': { icon: Loader, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  Info: { icon: AlertTriangle, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
};

// --- Main Modal Component ---
export function DiagnosticModal({ isOpen, onClose, log, status }: { isOpen: boolean; onClose: () => void; log: DiagnosticLog | null; status: 'running' | 'viewing' | 'idle' }) {
  const getTitle = () => {
    if (status === 'running') return "Running Live Diagnostic";
    if (status === 'viewing' && log) return `Diagnostic Report`;
    return "Diagnostic Report";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full bg-zinc-900/50 backdrop-blur-lg border-zinc-700 text-white shadow-2xl shadow-blue-500/10 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 text-2xl flex items-center gap-3">
            <ShieldCheck size={24} />
            {getTitle()}
          </DialogTitle>
          {status === 'viewing' && log && <DialogDescription>Generated on {new Date(log.createdAt).toLocaleString()}</DialogDescription>}
        </DialogHeader>
        
        <div className="mt-4 max-h-[80vh] overflow-y-auto p-1 pr-4">
          {status === 'running' && !log && <DiagnosticLoader />}
          {log && <ReportContent log={log} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Content & Sub-components ---
const DiagnosticLoader = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
    <Loader className="h-12 w-12 animate-spin text-blue-400" />
    <p className="text-xl text-zinc-300 font-semibold">Running Live Diagnostics...</p>
    <p className="text-sm text-zinc-500">Please wait while we analyze the network connection.</p>
  </div>
);

const ReportContent = ({ log }: { log: DiagnosticLog }) => {
  const neighborAnalysis = log.steps.find(s => s.stepName === 'Neighbor Analysis')?.details;
  const conclusionStatus = log.finalConclusion.includes("No issues detected") ? "Success" : "Failure";

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-6">
      <ConclusionCard conclusion={log.finalConclusion} status={conclusionStatus} />
      <ChecksPerformed steps={log.steps} />
      {neighborAnalysis && <NeighborAnalysis analysis={neighborAnalysis} />}
    </motion.div>
  );
};

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
  return (
    <SectionCard title="Final Conclusion" icon={GitBranch} borderColor={border}>
      <div className="flex items-start gap-4">
        <Icon className={cn("h-8 w-8 flex-shrink-0", color)} />
        <p className="text-zinc-200 text-sm pt-1">{conclusion}</p>
      </div>
    </SectionCard>
  );
};

const ChecksPerformed = ({ steps }: { steps: DiagnosticStep[] }) => (
    <SectionCard title="Diagnostic Timeline" icon={ListChecks}>
        <div className="relative flex flex-col">
            {steps.map((step, index) => <Step key={index} step={step} isLast={index === steps.length - 1} />)}
        </div>
    </SectionCard>
);

const Step = ({ step, isLast }: { step: DiagnosticStep, isLast: boolean }) => {
  const { icon: Icon, color, bg } = statusInfo[step.status] || statusInfo.Skipped;
  return (
    <div className="flex items-start gap-4 pl-12 py-2 relative">
      {!isLast && <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-zinc-700" />}
      <div className={cn("absolute left-0 top-2 flex items-center justify-center size-10 rounded-full", bg)}>
        <Icon className={cn("h-5 w-5", color, step.status === 'In-Progress' && 'animate-spin')} />
      </div>
      <div>
        <p className="font-semibold text-zinc-200">{step.stepName}</p>
        <p className="text-sm text-zinc-400">{step.summary}</p>
      </div>
    </div>
  );
};

const NeighborAnalysis = ({ analysis }: { analysis: NeighborAnalysisDetails }) => (
    <SectionCard title="Neighbor Analysis" icon={Users2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NeighborList title="Online Neighbors" neighbors={analysis.onlineNeighbors || []} variant="online" />
            <NeighborList title="Offline Neighbors" neighbors={analysis.offlineNeighbors || []} variant="offline" />
        </div>
    </SectionCard>
);

const NeighborList = ({ title, neighbors, variant }: { title: string; neighbors: { name: string; phone: string }[]; variant: 'online' | 'offline' }) => {
  const Icon = variant === 'online' ? Wifi : WifiOff;
  const { color, bg, border } = variant === 'online' ? statusInfo.Success : statusInfo.Failure;
  
  return (
    <div className={cn("bg-zinc-800/50 p-3 rounded-lg border", border)}>
      <h4 className={cn("flex items-center gap-2 text-sm font-semibold mb-3", color)}>
        <Icon size={16} /> {title} ({neighbors.length})
      </h4>
      <div className="space-y-2 text-sm max-h-48 overflow-y-auto pr-2">
        {neighbors.length > 0 ? neighbors.map((n, i) => (
          <div key={i} className={cn("flex justify-between items-center text-xs p-1.5 rounded-md", bg)}>
            <div className="flex items-center gap-2"><User size={12} className="text-zinc-400" /><span>{n.name}</span></div>
            <div className="flex items-center gap-2"><Phone size={12} className="text-zinc-400" /><span>{n.phone}</span></div>
          </div>
        )) : <p className="text-zinc-500 text-xs px-2 py-4 text-center">No {title.toLowerCase()}.</p>}
      </div>
    </div>
  );
};