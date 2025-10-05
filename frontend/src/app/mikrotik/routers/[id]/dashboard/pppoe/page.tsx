'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { PppoeTabs } from '@/components/mikrotik/PppoeTabs';

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

export default function PppoePage() {
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
          PPPoE Management
        </h1>
        <p className="text-sm text-zinc-400">Manage PPPoE active sessions and secret accounts.</p>
      </motion.div>

      <motion.div 
        variants={itemVariants} 
        className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl p-6"
      >
        <PppoeTabs routerId={routerId} />
      </motion.div>
    </motion.div>
  );
}