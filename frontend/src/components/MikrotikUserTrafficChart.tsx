"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, Upload, PlayCircle, Loader2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { formatSpeed } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// --- Interface Definitions ---
interface TrafficDataPoint {
  timestamp: number;
  rxRate: number;
  txRate: number;
}

interface MikrotikUserTraffic {
  rxRate: number;
  txRate: number;
  rxBytes: number;
  txBytes: number;
}

interface MikrotikUserTrafficChartProps {
  userId: string;
}

// --- Framer Motion Variants ---
const containerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
};

// --- Stat Card Component ---
const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color?: string }) => (
  <div className="flex items-center p-3 bg-zinc-800/50 rounded-lg">
    <Icon className={`h-6 w-6 mr-3 ${color || 'text-zinc-400'}`} />
    <div>
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-lg font-bold text-zinc-100">{value}</p>
    </div>
  </div>
);

// --- Custom Tooltip Component ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700 rounded-lg shadow-lg">
        <p className="text-sm text-zinc-400">{new Date(label).toLocaleTimeString()}</p>
        <p className="text-sm" style={{ color: payload[0].stroke }}>{`Download: ${formatSpeed(payload[0].value)}`}</p>
        <p className="text-sm" style={{ color: payload[1].stroke }}>{`Upload: ${formatSpeed(payload[1].value)}`}</p>
      </div>
    );
  }
  return null;
};


// --- Main Component ---
const MikrotikUserTrafficChart: React.FC<MikrotikUserTrafficChartProps> = ({ userId }) => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [trafficHistory, setTrafficHistory] = useState<TrafficDataPoint[]>([]);
  const [currentTraffic, setCurrentTraffic] = useState<MikrotikUserTraffic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrafficData = useCallback(async () => {
    if (!token || !userId) {
      setError("Authentication token or User ID not found.");
      return;
    }
    if (trafficHistory.length === 0) setIsLoading(true);
    try {
      const response = await fetch(`/api/mikrotik/users/${userId}/traffic`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch traffic data");
      }
      const data: MikrotikUserTraffic = await response.json();
      setCurrentTraffic(data);
      setTrafficHistory((prev) => [...prev.slice(-59), { timestamp: Date.now(), rxRate: data.rxRate, txRate: data.txRate }]);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error) ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({ title: "Traffic Monitoring Error", description: errorMessage, variant: "destructive" });
      setIsMonitoring(false);
    } finally {
      setIsLoading(false);
    }
  }, [token, userId, toast, trafficHistory.length]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isMonitoring) {
      fetchTrafficData();
      interval = setInterval(fetchTrafficData, 2000);
    }
    return () => clearInterval(interval);
  }, [isMonitoring, fetchTrafficData]);

  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      setIsMonitoring(false);
      setTrafficHistory([]);
      setCurrentTraffic(null);
    } else {
      setIsMonitoring(true);
    }
  };

  const stats = useMemo(() => {
    if (trafficHistory.length === 0) {
      return { peakTx: 0, peakRx: 0, avgTx: 0, avgRx: 0 };
    }
    const txRates = trafficHistory.map(h => h.txRate);
    const rxRates = trafficHistory.map(h => h.rxRate);
    return {
      peakTx: Math.max(...txRates),
      peakRx: Math.max(...rxRates),
      avgTx: txRates.reduce((a, b) => a + b, 0) / txRates.length,
      avgRx: rxRates.reduce((a, b) => a + b, 0) / rxRates.length,
    };
  }, [trafficHistory]);

  const renderContent = () => {
    if (!isMonitoring) {
      return (
        <motion.div variants={containerVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center h-full text-center p-8">
          <PlayCircle className="w-20 h-20 text-cyan-400/20 mb-4" strokeWidth={1} />
          <h3 className="text-xl font-bold text-zinc-200 mb-2">Live Traffic Monitoring</h3>
          <p className="text-zinc-400 mb-6 max-w-sm">Click the button below to start monitoring the user's real-time upload and download speed.</p>
          <Button onClick={handleToggleMonitoring} size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg hover:shadow-cyan-500/50 transition-shadow">
            Start Monitoring
          </Button>
        </motion.div>
      );
    }

    if (isLoading && trafficHistory.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          <p className="mt-4 text-zinc-400">Establishing connection...</p>
        </div>
      );
    }
    
    if (error && trafficHistory.length === 0) {
        return (
          <motion.div variants={containerVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col items-center justify-center h-full text-center p-8 bg-red-900/20 rounded-lg">
            <AlertTriangle className="w-16 h-16 text-red-400/50 mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-bold text-red-300 mb-2">Connection Failed</h3>
            <p className="text-red-400/80 mb-6 max-w-sm">{error}</p>
            <Button onClick={handleToggleMonitoring} variant="outline" className="border-red-400/50 text-red-300 hover:bg-red-400/10 hover:text-red-200">
              Try Again
            </Button>
          </motion.div>
        );
      }

    return (
      <motion.div variants={containerVariants} initial="initial" animate="animate" exit="exit" className="p-4 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-3">
          <StatCard icon={Download} label="Download" value={formatSpeed(currentTraffic?.txRate ?? 0)} color="text-blue-400" />
          <StatCard icon={Upload} label="Upload" value={formatSpeed(currentTraffic?.rxRate ?? 0)} color="text-cyan-400" />
        </div>
        <motion.div 
          className="h-60"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} stroke="#a1a1aa" fontSize={12} />
              <YAxis tickFormatter={formatSpeed} stroke="#a1a1aa" fontSize={12} tickCount={6} domain={[0, 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="txRate" name="Download" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDownload)" animationDuration={300} />
              <Area type="monotone" dataKey="rxRate" name="Upload" stroke="#22d3ee" fillOpacity={1} fill="url(#colorUpload)" animationDuration={300} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <Card className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800 p-3">
        <CardTitle className="text-base text-cyan-400">Live Usage</CardTitle>
        {isMonitoring && (
          <Button onClick={handleToggleMonitoring} size="sm" variant="destructive">
            Stop Monitoring
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default MikrotikUserTrafficChart;