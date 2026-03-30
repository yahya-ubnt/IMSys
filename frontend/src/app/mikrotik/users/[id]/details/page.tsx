'use client'

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { ArrowLeft, Edit, User as UserIcon, Wifi, WifiOff, Package, Smartphone, AtSign, Calendar, DollarSign, Lock, Hash, Building, Home, Router as RouterIcon, BarChart2, ShieldCheck, FileText, MessageCircle, Send, Loader2, Pause, Play } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { MpesaTransaction } from "./mpesa-columns";
import { WalletTransaction } from "./wallet-columns";
import { calculateDaysRemaining } from '@/lib/utils'; // Import the new utility function
// import { differenceInDays, parseISO } from 'date-fns'; // Removed as no longer needed
import MikrotikUserTrafficChart from "@/components/MikrotikUserTrafficChart";
import DowntimeLogTable from "@/components/mikrotik/DowntimeLogTable";
import BillingTab from "@/components/mikrotik/BillingTab";
import SmsTab from "@/components/mikrotik/SmsTab";
import { DiagnosticButton } from "@/components/diagnostics/DiagnosticButton";
import { DiagnosticHistory } from "@/components/diagnostics/DiagnosticHistory";
import { ConnectDisconnectButtons } from "@/components/mikrotik/ConnectDisconnectButtons"; // Import the new component
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// --- Interface Definitions ---
interface MikrotikUser {
    _id: string;
    username: string;
    officialName: string;
    emailAddress?: string;
    mobileNumber: string;
    billingCycle: string;
    expiryDate: string;
    mikrotikRouter: { _id: string; name: string };
    package: { _id: string; name: string; price: number };
    serviceType: 'pppoe' | 'static';
    mPesaRefNo: string;
    installationFee?: number;
    building?: { _id: string; name: string };
    door_number_unit_label?: string;
    pppoePassword?: string;
    remoteAddress?: string;
    ipAddress?: string;
    station?: { _id: string; deviceName: string; ipAddress: string };
    isOnline: boolean;
    isManuallyDisconnected?: boolean;
    walletBalance: number;
    // New fields for Pause Subscription
    isPaused?: boolean;
    pauseDate?: string;
    remainingDaysAtPause?: number; // Stored in milliseconds
    prePauseExpiryDate?: string;
}
interface PaymentStats { totalSpentMpesa: number; lastMpesaPaymentDate: string | null; totalMpesaTransactions: number; averageMpesaTransaction: number; mpesaTransactionHistory: MpesaTransaction[]; }
interface SmsLog { _id: string; message: string; messageType: string; smsStatus: 'Success' | 'Failed' | 'Pending' | 'RequiresManualIntervention'; createdAt: string; }
interface SmsStats { total: number; acknowledgement: number; expiry: number; composed: number; system: number; }
interface SmsData { logs: SmsLog[]; stats: SmsStats; }


// --- Sub-components ---
const DetailItem = ({ icon: Icon, label, value, href, isPassword }: { icon: React.ElementType; label: string; value: string | number | undefined; href?: string; isPassword?: boolean }) => {
    const [isVisible, setIsVisible] = useState(!isPassword);
    return (
        <div className="flex items-start space-x-3 rounded-lg p-2 hover:bg-zinc-800/50 transition-colors">
            <Icon className="h-4 w-4 text-zinc-400 mt-1 flex-shrink-0" />
            <div className="flex-grow">
                <p className="text-xs text-zinc-400">{label}</p>
                <div className="flex items-center gap-2">
                    {href ? (
                        <Link href={href} className="text-sm font-semibold text-blue-400 hover:underline">
                            {isVisible ? (value || 'N/A') : '••••••••'}
                        </Link>
                    ) : (
                        <p className="text-sm font-semibold text-zinc-100">{isVisible ? (value || 'N/A') : '••••••••'}</p>
                    )}
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
    const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
    const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
    const [smsData, setSmsData] = useState<SmsData | null>(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [isResendingSms, setIsResendingSms] = useState(false); // New state for resending SMS
    const [isResendConfirmOpen, setIsResendConfirmOpen] = useState(false); // New state for confirmation dialog
    const [isPausing, setIsPausing] = useState(false);
    const [isUnpausing, setIsUnpausing] = useState(false);
    const [isPauseConfirmOpen, setIsPauseConfirmOpen] = useState(false);
    const [isUnpauseConfirmOpen, setIsUnpauseConfirmOpen] = useState(false);
    const { toast } = useToast();

    const fetchUser = useCallback(async () => {
        try {
            const response = await fetch(`/api/mikrotik/users/${id}`);
            if (!response.ok) throw new Error("Failed to fetch user details");
            setUserData(await response.json());
        } catch {
            toast({ title: "Error", description: "Failed to load user data.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    const fetchSmsData = useCallback(async () => {
        if (!id) return;
        try {
            const response = await fetch(`/api/sms/logs/user/${id}`);
            if (!response.ok) throw new Error("Failed to fetch SMS logs");
            setSmsData(await response.json());
        } catch {
            toast({ title: "Error", description: "Failed to load SMS history.", variant: "destructive" });
        }
    }, [id, toast]);

    useEffect(() => {
        if (!id) return;
        fetchUser();
        fetchSmsData();
    }, [id, fetchUser, fetchSmsData]);

    useEffect(() => {
        if (!id) return;
        const fetchPaymentStats = async () => {
            try {
                const response = await fetch(`/api/mikrotik/users/${id}/payment-stats`);
                if (!response.ok) throw new Error("Failed to fetch payment stats");
                setPaymentStats(await response.json());
            } catch {
                toast({ title: "Error", description: "Failed to load M-Pesa payment stats.", variant: "destructive" });
            }
        };
        fetchPaymentStats();
    }, [id, toast]);

    useEffect(() => {
        if (!id) return;
        const fetchWalletTransactions = async () => {
            try {
                const response = await fetch(`/api/payments/wallet/user/${id}`);
                if (!response.ok) throw new Error("Failed to fetch wallet transactions");
                const data = await response.json();
                setWalletTransactions(data.transactions || []);
            } catch {
                toast({ title: "Error", description: "Failed to load wallet transactions.", variant: "destructive" });
            }
        };
        fetchWalletTransactions();
    }, [id, toast]);

    const handleResendWelcomeSms = async () => {
        setIsResendingSms(true);
        setIsResendConfirmOpen(false); // Close the dialog
        try {
            const response = await fetch(`/api/mikrotik/users/${id}/resend-welcome-sms`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to resend welcome SMS");
            }

            toast({ title: "Success", description: "Welcome SMS resent successfully." });
            fetchSmsData(); // Refresh SMS data after resending
        } catch (error: unknown) {
            toast({ title: "Error", description: (error instanceof Error) ? error.message : "An unexpected error occurred.", variant: "destructive" });
        } finally {
            setIsResendingSms(false);
        }
    };

    const handlePauseSubscription = async () => {
        setIsPausing(true);
        setIsPauseConfirmOpen(false);
        try {
            const response = await fetch(`/api/mikrotik/users/${id}/pause-subscription`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to pause subscription");
            }

            toast({ title: "Success", description: "Subscription paused successfully." });
            fetchUser(); // Refresh user data
        } catch (error: unknown) {
            toast({ title: "Error", description: (error instanceof Error) ? error.message : "An unexpected error occurred.", variant: "destructive" });
        } finally {
            setIsPausing(false);
        }
    };

    const handleUnpauseSubscription = async () => {
        setIsUnpausing(true);
        setIsUnpauseConfirmOpen(false);
        try {
            const response = await fetch(`/api/mikrotik/users/${id}/unpause-subscription`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to unpause subscription");
            }

            toast({ title: "Success", description: "Subscription unpaused successfully." });
            fetchUser(); // Refresh user data
        } catch (error: unknown) {
            toast({ title: "Error", description: (error instanceof Error) ? error.message : "An unexpected error occurred.", variant: "destructive" });
        } finally {
            setIsUnpausing(false);
        }
    };

    const daysToExpire = useMemo(() => {
        if (!userData) return { days: 0, label: 'N/A' };

        if (userData.isPaused && userData.remainingDaysAtPause !== undefined) {
            const days = Math.ceil(userData.remainingDaysAtPause / (1000 * 60 * 60 * 24));
            return { days, label: `${days} days remaining (paused)` };
        }

        if (!userData.expiryDate) return { days: 0, label: 'Expired' };
        const days = calculateDaysRemaining(userData.expiryDate);
        return { days, label: days > 0 ? `${days} days remaining` : 'Expired' };
    }, [userData]);

    if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading user profile...</div>;
    if (!userData) return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">User not found.</div>;

    const tabs = [
        { id: "overview", label: "Overview", icon: UserIcon },
        { id: "usage", label: "Live Usage", icon: BarChart2 },
        { id: "billing", label: "Billing", icon: FileText },
        { id: "sms", label: "SMS", icon: MessageCircle },
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
                            {/* Mobile Buttons */}
                            <div className="flex sm:hidden items-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => router.push(`/mikrotik/users/${id}`)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="outline" size="icon" onClick={() => setIsResendConfirmOpen(true)} disabled={isResendingSms}>
                                    {isResendingSms ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                                <DiagnosticButton userId={userData._id} isIconOnly={true} />
                                {userData.isPaused ? (
                                    <Button variant="outline" size="icon" onClick={() => setIsUnpauseConfirmOpen(true)} disabled={isUnpausing}>
                                        {isUnpausing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="icon" onClick={() => setIsPauseConfirmOpen(true)} disabled={isPausing || new Date(userData.expiryDate) < new Date()}>
                                        {isPausing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
                                    </Button>
                                )}
                                <ConnectDisconnectButtons userId={userData._id} isManuallyDisconnected={userData.isManuallyDisconnected || false} onStatusChange={fetchUser} isIconOnly={true} />
                            </div>
                            {/* Desktop Buttons */}
                            <div className="hidden sm:flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => router.push(`/mikrotik/users/${id}`)}><Edit className="h-3 w-3 mr-2" />Edit User</Button>
                                <Button variant="outline" size="sm" onClick={() => setIsResendConfirmOpen(true)} disabled={isResendingSms}>
                                    {isResendingSms ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Send className="h-3 w-3 mr-2" />}Resend Welcome SMS
                                </Button>
                                <DiagnosticButton userId={userData._id} />
                                {userData.isPaused ? (
                                    <Button variant="outline" size="sm" onClick={() => setIsUnpauseConfirmOpen(true)} disabled={isUnpausing}>
                                        {isUnpausing ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Play className="h-3 w-3 mr-2" />}Unpause Subscription
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={() => setIsPauseConfirmOpen(true)} disabled={isPausing || new Date(userData.expiryDate) < new Date()}>
                                        {isPausing ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Pause className="h-3 w-3 mr-2" />}Pause Subscription
                                    </Button>
                                )}
                                <ConnectDisconnectButtons userId={userData._id} isManuallyDisconnected={userData.isManuallyDisconnected || false} onStatusChange={fetchUser} />
                            </div>
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl flex-1 flex flex-col">
                        <Card className="bg-transparent border-none flex-1 flex flex-col">
                            <CardHeader className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <HeaderStat icon={userData.isOnline ? Wifi : WifiOff} label="Status" value={userData.isOnline ? 'Online' : 'Offline'} color={userData.isOnline ? 'text-green-400' : 'text-red-400'} />
                                <HeaderStat icon={Package} label="Package" value={userData.package.name} />
                                <HeaderStat icon={DollarSign} label="Price" value={`KES ${userData.package.price}`} />
                                <HeaderStat icon={DollarSign} label="Wallet" value={`KES ${userData.walletBalance.toFixed(2)}`} color={userData.walletBalance > 0 ? 'text-green-400' : 'text-zinc-300'} />
                                <HeaderStat icon={Calendar} label="Expires in" value={daysToExpire.label} color={daysToExpire.days < 7 ? 'text-red-400' : 'text-zinc-300'} />
                            </CardHeader>
                            
                            <TabsPrimitive.Root value={activeTab} onValueChange={setActiveTab} defaultValue="overview" className="flex-1 flex flex-col">
                                <TabsPrimitive.List className="relative flex flex-col sm:flex-row w-full items-start sm:items-center justify-start p-2 sm:overflow-x-auto mb-4">
                                    {tabs.map((tab) => (
                                        <TabsPrimitive.Trigger key={tab.id} value={tab.id} className="relative w-full sm:w-auto px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors focus-visible:outline-none data-[state=active]:text-white data-[state=active]:bg-zinc-700/50 rounded-md">
                                            <span className="relative z-10 flex items-center"><tab.icon className="mr-2 h-4 w-4" />{tab.label}</span>
                                        </TabsPrimitive.Trigger>
                                    ))}
                                </TabsPrimitive.List>
                                <hr className="border-zinc-700 mb-4" />

                                <CardContent className="p-4 flex-1">
                                    <TabsPrimitive.Content value="overview" className="h-full">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                                            <DetailItem icon={UserIcon} label="Username" value={userData.username} />
                                            <DetailItem icon={Smartphone} label="Mobile Number" value={userData.mobileNumber} />
                                            <DetailItem icon={AtSign} label="Email Address" value={userData.emailAddress} />
                                            <DetailItem icon={Wifi} label="Service Type" value={userData.serviceType.toUpperCase()} />
                                            <DetailItem icon={RouterIcon} label="Mikrotik Router" value={userData.mikrotikRouter.name} />
                                            <DetailItem icon={RouterIcon} label="Station" value={userData.station?.deviceName} href={userData.station?._id ? `/devices/${userData.station._id}` : undefined} />
                                            <DetailItem icon={Building} label="Building" value={userData.building?.name} />
                                            <DetailItem icon={Home} label="Door Number/Unit Label" value={userData.door_number_unit_label} />
                                            {userData.serviceType === 'pppoe' && <DetailItem icon={Lock} label="PPPoE Password" value={userData.pppoePassword} isPassword />}
                                            {userData.serviceType === 'static' && <DetailItem icon={Hash} label="IP Address" value={userData.ipAddress} />}
                                        </div>
                                    </TabsPrimitive.Content>
                                    <TabsPrimitive.Content value="usage" className="h-full"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full"><MikrotikUserTrafficChart userId={userData._id} /><DowntimeLogTable userId={userData._id} /></div></TabsPrimitive.Content>
                                    <TabsPrimitive.Content value="billing" className="h-full flex flex-col"><BillingTab paymentStats={paymentStats} walletTransactions={walletTransactions} /></TabsPrimitive.Content>
                                    <TabsPrimitive.Content value="sms" className="h-full flex flex-col"><SmsTab smsData={smsData} onRefresh={fetchSmsData} /></TabsPrimitive.Content>
                                    <TabsPrimitive.Content value="diagnostics" className="h-full"><DiagnosticHistory userId={userData._id} /></TabsPrimitive.Content>
                                </CardContent>
                            </TabsPrimitive.Root>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Resend Welcome SMS Confirmation Dialog */}
            <AlertDialog open={isResendConfirmOpen} onOpenChange={setIsResendConfirmOpen}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-cyan-400">Confirm Resend Welcome SMS</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Are you sure you want to resend the welcome SMS to {userData.officialName}?
                            This will send a new message to their registered mobile number.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-700">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResendWelcomeSms} disabled={isResendingSms} className="bg-blue-600 hover:bg-blue-700">
                            {isResendingSms ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}Resend SMS
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Pause Subscription Confirmation Dialog */}
            <AlertDialog open={isPauseConfirmOpen} onOpenChange={setIsPauseConfirmOpen}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-cyan-400">Confirm Pause Subscription</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Are you sure you want to pause {userData.officialName}'s subscription?
                            Service will stop immediately and remaining time will be preserved.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-700">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePauseSubscription} disabled={isPausing} className="bg-purple-600 hover:bg-purple-700">
                            {isPausing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pause className="h-4 w-4 mr-2" />}Pause Subscription
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Unpause Subscription Confirmation Dialog */}
            <AlertDialog open={isUnpauseConfirmOpen} onOpenChange={setIsUnpauseConfirmOpen}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-700 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-cyan-400">Confirm Unpause Subscription</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Are you sure you want to unpause {userData.officialName}'s subscription?
                            Service will resume and remaining time will continue counting down.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-zinc-700">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleUnpauseSubscription} disabled={isUnpausing} className="bg-green-600 hover:bg-green-700">
                            {isUnpausing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}Unpause Subscription
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
