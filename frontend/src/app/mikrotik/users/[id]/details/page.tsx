'use client'

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { ArrowLeft, Edit, User as UserIcon, Wifi, WifiOff, Package, Smartphone, AtSign, Calendar, DollarSign, Lock, Hash, Building, Home, Router as RouterIcon, BarChart2, ShieldCheck, FileText } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { MpesaTransaction } from "./mpesa-columns";
import { differenceInDays, parseISO } from 'date-fns';
import MikrotikUserTrafficChart from "@/components/MikrotikUserTrafficChart";
import DowntimeLogTable from "@/components/mikrotik/DowntimeLogTable";
import BillingTab from "@/components/mikrotik/BillingTab";
import { DiagnosticButton } from "@/components/diagnostics/DiagnosticButton";
import { DiagnosticHistory } from "@/components/diagnostics/DiagnosticHistory";
import { DiagnosticLog } from "@/types/diagnostics";
import { DiagnosticModal } from "@/components/diagnostics/DiagnosticModal";

// --- Interface Definitions ---
interface MikrotikUser { _id: string; username: string; officialName: string; emailAddress?: string; mobileNumber: string; billingCycle: string; expiryDate: string; mikrotikRouter: { _id: string; name: string }; package: { _id: string; name: string; price: number }; serviceType: 'pppoe' | 'static'; mPesaRefNo: string; installationFee?: number; apartment_house_number?: string; door_number_unit_label?: string; pppoePassword?: string; remoteAddress?: string; ipAddress?: string; station?: { _id: string; deviceName: string; ipAddress: string }; isOnline: boolean; }

// --- Sub-components ---
const DetailItem = ({ icon: Icon, label, value, isPassword }: { icon: React.ElementType; label: string; value: string | number | undefined; isPassword?: boolean }) => {
    const [isVisible, setIsVisible] = useState(!isPassword);
    return (
        <div className="flex items-start space-x-3 rounded-lg p-2 hover:bg-zinc-800/50 transition-colors">
            <Icon className="h-4 w-4 text-zinc-400 mt-1 flex-shrink-0" />
            <div className="flex-grow">
                <p className="text-xs text-zinc-400">{label}</p>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-100">{isVisible ? (value || 'N/A') : '••••••••'}</p>
                    {isPassword && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsVisible(!isVisible)}>{isVisible ? <EyeOff size={14} /> : <Eye size={14} />}</Button>}
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---
export default function MikrotikUserDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const [userData, setUserData] = useState<MikrotikUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [mpesaTransactions, setMpesaTransactions] = useState<MpesaTransaction[]>([]);
    const [modalStatus, setModalStatus] = useState<'idle' | 'running' | 'viewing'>('idle');
    const [currentLog, setCurrentLog] = useState<DiagnosticLog | null>(null);
    const [activeTab, setActiveTab] = useState("overview");
    const { token } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (!id || !token) return;
        const fetchUser = async () => {
            try {
                const response = await fetch(`/api/mikrotik/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                if (!response.ok) throw new Error("Failed to fetch user details");
                setUserData(await response.json());
            } catch {
                toast({ title: "Error", description: "Failed to load user data.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id, token, toast]);

    useEffect(() => {
        if (!token || !userData?.mobileNumber) return;
        const fetchMpesaTransactions = async () => {
            try {
                const response = await fetch(`/api/payments/transactions`, { headers: { Authorization: `Bearer ${token}` } });
                if (!response.ok) throw new Error("Failed to fetch Mpesa transactions");
                const data: MpesaTransaction[] = await response.json();
                setMpesaTransactions(data.filter(tx => tx.msisdn === userData.mobileNumber));
            } catch (err) {
                toast({ title: "Error", description: "Failed to load Mpesa transactions.", variant: "destructive" });
            }
        };
        fetchMpesaTransactions();
    }, [token, userData, toast]);

    const daysToExpire = useMemo(() => {
        if (!userData?.expiryDate) return { days: 0, label: 'Expired' };
        const days = differenceInDays(parseISO(userData.expiryDate), new Date());
        return { days, label: days > 0 ? `${days} days remaining` : 'Expired' };
    }, [userData?.expiryDate]);

    const handleRunStart = () => {
        setCurrentLog({ _id: 'running', user: id as string, steps: [], finalConclusion: 'Running diagnostic...', createdAt: new Date().toISOString() });
        setModalStatus('running');
    };
    const handleRunComplete = (log: DiagnosticLog) => {
        setCurrentLog(log);
        setModalStatus('viewing');
    };
    const handleViewReport = (log: DiagnosticLog) => { setCurrentLog(log); setModalStatus('viewing'); };

    if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading user profile...</div>;
    if (!userData) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">User not found.</div>;

    const tabs = [
        { id: "overview", label: "Overview", icon: UserIcon },
        { id: "usage", label: "Live Usage", icon: BarChart2 },
        { id: "billing", label: "Billing", icon: FileText },
        { id: "diagnostics", label: "Diagnostics", icon: ShieldCheck },
    ];

    return (
        <>
            <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
                <Topbar />
                <div className="flex-1 p-6 flex flex-col space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/mikrotik/users"><Button variant="ghost" size="icon" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"><ArrowLeft className="h-4 w-4" /></Button></Link>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{userData.officialName}</h1>
                                <p className="text-sm text-zinc-400">@{userData.username}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => router.push(`/mikrotik/users/${id}`)}><Edit className="h-3 w-3 mr-2" />Edit User</Button>
                            <DiagnosticButton userId={userData._id} onRunStart={handleRunStart} onRunComplete={handleRunComplete} />
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <motion.div layout className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl flex-1 flex flex-col">
                        <Card className="bg-transparent border-none flex-1 flex flex-col">
                            <CardHeader className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-zinc-800">
                                <HeaderStat icon={userData.isOnline ? Wifi : WifiOff} label="Status" value={userData.isOnline ? 'Online' : 'Offline'} color={userData.isOnline ? 'text-green-400' : 'text-red-400'} />
                                <HeaderStat icon={Package} label="Package" value={userData.package.name} />
                                <HeaderStat icon={DollarSign} label="Price" value={`KES ${userData.package.price}`} />
                                <HeaderStat icon={Calendar} label="Expires in" value={daysToExpire.label} color={daysToExpire.days < 7 ? 'text-red-400' : 'text-zinc-300'} />
                            </CardHeader>
                            
                            <TabsPrimitive.Root value={activeTab} onValueChange={setActiveTab} defaultValue="overview" className="flex-1 flex flex-col">
                                <TabsPrimitive.List className="relative flex w-full items-center justify-start border-b border-zinc-800 p-2">
                                    {tabs.map((tab) => (
                                        <TabsPrimitive.Trigger key={tab.id} value={tab.id} className="relative px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors focus-visible:outline-none data-[state=active]:text-white">
                                            {activeTab === tab.id && <motion.div layoutId="active-user-tab-indicator" className="absolute inset-0 bg-zinc-700/50 rounded-md" />}
                                            <span className="relative z-10 flex items-center"><tab.icon className="mr-2 h-4 w-4" />{tab.label}</span>
                                        </TabsPrimitive.Trigger>
                                    ))}
                                </TabsPrimitive.List>

                                <CardContent className="p-4 flex-1">
                                    <TabsPrimitive.Content value="overview" className="h-full">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                                            <DetailItem icon={UserIcon} label="Username" value={userData.username} />
                                            <DetailItem icon={Smartphone} label="Mobile Number" value={userData.mobileNumber} />
                                            <DetailItem icon={AtSign} label="Email Address" value={userData.emailAddress} />
                                            <DetailItem icon={Wifi} label="Service Type" value={userData.serviceType.toUpperCase()} />
                                            <DetailItem icon={RouterIcon} label="Mikrotik Router" value={userData.mikrotikRouter.name} />
                                            <DetailItem icon={RouterIcon} label="Station" value={userData.station?.deviceName} />
                                            <DetailItem icon={Building} label="Apartment/House Number" value={userData.apartment_house_number} />
                                            <DetailItem icon={Home} label="Door Number/Unit Label" value={userData.door_number_unit_label} />
                                            {userData.serviceType === 'pppoe' && <DetailItem icon={Lock} label="PPPoE Password" value={userData.pppoePassword} isPassword />}
                                            {userData.serviceType === 'static' && <DetailItem icon={Hash} label="IP Address" value={userData.ipAddress} />}
                                        </div>
                                    </TabsPrimitive.Content>
                                    <TabsPrimitive.Content value="usage" className="h-full"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full"><MikrotikUserTrafficChart userId={userData._id} /><DowntimeLogTable userId={userData._id} /></div></TabsPrimitive.Content>
                                    <TabsPrimitive.Content value="billing" className="h-full flex flex-col"><BillingTab transactions={mpesaTransactions} /></TabsPrimitive.Content>
                                    <TabsPrimitive.Content value="diagnostics" className="h-full"><DiagnosticHistory userId={userData._id} onViewReport={handleViewReport} /></TabsPrimitive.Content>
                                </CardContent>
                            </TabsPrimitive.Root>
                        </Card>
                    </motion.div>
                </div>
            </div>
            <DiagnosticModal isOpen={modalStatus !== 'idle'} onClose={() => setModalStatus('idle')} log={currentLog} status={modalStatus} />
        </>
    );
}

import { Eye, EyeOff } from "lucide-react";

const HeaderStat = ({ icon: Icon, label, value, color = 'text-zinc-300' }: { icon: React.ElementType, label: string, value: string, color?: string }) => (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50">
        <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
        <div>
            <p className="text-xs text-zinc-400">{label}</p>
            <p className={`text-sm font-bold ${color}`}>{value}</p>
        </div>
    </div>
);
