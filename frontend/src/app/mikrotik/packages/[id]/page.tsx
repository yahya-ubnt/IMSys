"use client"

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Topbar } from "@/components/topbar";
import Link from "next/link";

interface Package {
    _id: string;
    mikrotikRouter: { _id: string; name: string; };
    serviceType: 'pppoe' | 'static';
    name: string;
    price: number;
    profile?: string;
    rateLimit?: string;
    status: 'active' | 'disabled';
}

export default function EditPackagePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = React.use(paramsPromise);
    const { id } = params;
    const [packageData, setPackageData] = useState<Package | null>(null);
    const [serviceType, setServiceType] = useState<'pppoe' | 'static' | null>(null);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [profile, setProfile] = useState("");
    const [rateLimit, setRateLimit] = useState("");
    const [status, setStatus] = useState<'active' | 'disabled'>("active");
    const [pppProfiles, setPppProfiles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [pppProfilesLoading, setPppProfilesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { token } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const fetchPackage = async () => {
            if (!token) {
                setError("Authentication token not found. Please log in.");
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(`/api/mikrotik/packages/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Failed to fetch package");
                }
                const data: Package = await response.json();
                setPackageData(data);
                setName(data.name);
                setServiceType(data.serviceType);
                setPrice(data.price.toString());
                setProfile(data.profile || "");
                setRateLimit(data.rateLimit || "");
                setStatus(data.status);
            } catch (err: unknown) {
                setError((err instanceof Error) ? err.message : "Failed to load package data.");
                toast({
                    title: "Error",
                    description: (err instanceof Error) ? err.message : "Failed to load package data.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPackage();
        }
    }, [id, token, toast]);

    useEffect(() => {
        const fetchPppProfiles = async () => {
            if (!token || !packageData?.mikrotikRouter?._id) {
                setPppProfiles([]);
                return;
            }
            setPppProfilesLoading(true);
            try {
                const response = await fetch(`/api/mikrotik/routers/${packageData.mikrotikRouter._id}/ppp-profiles`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch PPP profiles");
                }
                const data = await response.json();
                setPppProfiles(data);
            } catch (err: unknown) {
                toast({
                    title: "Error",
                    description: (err instanceof Error) ? err.message : "Failed to load PPP profiles.",
                    variant: "destructive",
                });
            } finally {
                setPppProfilesLoading(false);
            }
        };

        if (serviceType === "pppoe") {
            fetchPppProfiles();
        }
    }, [token, toast, packageData, serviceType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        if (!serviceType) {
            toast({
                title: "Validation Error",
                description: "Please select a service type.",
                variant: "destructive",
            });
            setSubmitting(false);
            return;
        }

        if (!token) {
            toast({
                title: "Authentication Error",
                description: "You must be logged in to update a package.",
                variant: "destructive",
            });
            setSubmitting(false);
            return;
        }

        const updatedPackageData = {
            name,
            serviceType,
            price: parseFloat(price),
            profile: serviceType === 'pppoe' ? profile : undefined,
            rateLimit: serviceType === 'static' ? rateLimit : undefined,
            status,
        };

        try {
            const response = await fetch(`/api/mikrotik/packages/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatedPackageData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update package");
            }

            toast({
                title: "Package Updated",
                description: "Mikrotik package updated successfully.",
            });
            router.push("/mikrotik/packages");
        } catch (error: unknown) {
            toast({
                title: "Error",
                description: (error instanceof Error) ? error.message : "Failed to update package. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-950 to-zinc-900 text-white">
                <Topbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-300 mx-auto"></div>
                        <p className="mt-2 text-zinc-400">Loading package data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-950 to-zinc-900 text-white">
                <Topbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-4 bg-zinc-900 border border-red-500 rounded-lg">
                        <p className="text-lg font-semibold text-red-500">Error loading package details. Please try again.</p>
                        <Button onClick={() => setError(null)} className="mt-4 bg-red-600 hover:bg-red-700">
                            Retry
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!packageData) {
        return (
            <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-950 to-zinc-900 text-white">
                <Topbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-zinc-300 mb-2">Package Not Found</h2>
                        <p className="text-zinc-400 mb-4">The Mikrotik package you&apos;re looking for doesn&apos;t exist.</p>
                        <Link href="/mikrotik/packages">
                            <Button variant="outline" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700">
                                Back to Packages
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-950 to-black text-white">
            <Topbar />
            <div className="flex-1 p-6 lg:px-8 space-y-8">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/mikrotik/packages">
                        <Button variant="ghost" size="icon" className="bg-zinc-800 text-white hover:bg-zinc-700">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-blue-400">Edit Mikrotik Package</h1>
                        <p className="text-sm text-zinc-400">Update Mikrotik package information.</p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <Card className="bg-zinc-900 border border-zinc-700 shadow-xl rounded-lg hover:shadow-blue-500/50 transition-all duration-300">
                            <CardHeader className="border-b border-zinc-800 pb-4">
                                <CardTitle className="text-cyan-400">Package Details</CardTitle>
                                <CardDescription className="text-zinc-400">Update the details for this package.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-zinc-300">Package Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="serviceType" className="text-zinc-300">Service Type</Label>
                                    <Select onValueChange={(value: 'pppoe' | 'static') => setServiceType(value)} value={serviceType || undefined}>
                                        <SelectTrigger className="bg-zinc-800 text-white border-zinc-700 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                                            <SelectValue placeholder="Select service type" className="text-zinc-400" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 text-white border-zinc-700 rounded-lg">
                                            <SelectItem value="pppoe" className="focus:bg-zinc-700 focus:text-white">PPPoE</SelectItem>
                                            <SelectItem value="static" className="focus:bg-zinc-700 focus:text-white">Static IP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-zinc-300">Price</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        required
                                        className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                    />
                                </div>
                                {serviceType === 'pppoe' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="profile" className="text-zinc-300">Profile</Label>
                                        <Select onValueChange={setProfile} value={profile} disabled={pppProfilesLoading || pppProfiles.length === 0}>
                                            <SelectTrigger className="bg-zinc-800 text-white border-zinc-700 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                                                <SelectValue placeholder={pppProfilesLoading ? "Loading profiles..." : "Select a profile"} className="text-zinc-400" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-800 text-white border-zinc-700 rounded-lg">
                                                {pppProfiles.map((p) => (
                                                    <SelectItem key={p} value={p} className="focus:bg-zinc-700 focus:text-white">
                                                        {p}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {serviceType === 'static' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="rateLimit" className="text-zinc-300">Rate Limit</Label>
                                        <Input
                                            id="rateLimit"
                                            type="text"
                                            value={rateLimit}
                                            onChange={(e) => setRateLimit(e.target.value)}
                                            placeholder="e.g., 10M/10M"
                                            className="bg-zinc-800 text-white border-zinc-700 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-zinc-300">Status</Label>
                                    <Select onValueChange={(value: 'active' | 'disabled') => setStatus(value)} value={status}>
                                        <SelectTrigger className="bg-zinc-800 text-white border-zinc-700 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
                                            <SelectValue placeholder="Select status" className="text-zinc-400" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 text-white border-zinc-700 rounded-lg">
                                            <SelectItem value="active" className="focus:bg-zinc-700 focus:text-white">Active</SelectItem>
                                            <SelectItem value="disabled" className="focus:bg-zinc-700 focus:text-white">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-zinc-800">
                            <Link href="/mikrotik/packages">
                                <Button type="button" variant="outline" className="bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-700">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-105">
                                {submitting ? "Updating Package..." : "Update Package"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}