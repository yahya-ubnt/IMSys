'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { PppoeUserCountCard } from '@/components/mikrotik/PppoeUserCountCard';
import { StaticUserCountCard } from '@/components/mikrotik/StaticUserCountCard';
import { TrafficMonitorCard } from '@/components/mikrotik/TrafficMonitorCard';
import { ResourceGraphCard } from '@/components/mikrotik/ResourceGraphCard';
import { CombinedRouterInfoCard } from '@/components/mikrotik/CombinedRouterInfoCard';

// Animation variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

export default function OverviewPage() {
  const params = useParams();
  const routerId = params.id as string;

  return (
    <motion.div 
      className="p-6 space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Router Overview
        </h1>
        <p className="text-sm text-zinc-400">A real-time, mission-control summary of your MikroTik router.</p>
      </motion.div>

      {/* Main "Mission Control" Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants} className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl p-6">
            <TrafficMonitorCard routerId={routerId} />
          </motion.div>
          <motion.div variants={itemVariants} className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl p-6">
            <CombinedRouterInfoCard routerId={routerId} />
          </motion.div>
        </div>

        {/* Right Column: Live Stats Sidebar */}
        <motion.div variants={itemVariants} className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl p-6 space-y-6">
          <ResourceGraphCard routerId={routerId} resourceType="cpu" title="CPU Usage" unit="%" />
          <ResourceGraphCard routerId={routerId} resourceType="memory" title="Memory Usage" unit="MB" />
          <div className="space-y-4 pt-4 border-t border-zinc-700">
            <PppoeUserCountCard routerId={routerId} />
            <StaticUserCountCard routerId={routerId} />
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}