"use client"

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, Wifi } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/topbar";

// --- Interface Definition ---
interface MikrotikRouter {
  _id: string;
  name: string;
  ipAddress: string;
  apiUsername: string;
  apiPassword?: string;
  apiPort: number;
  location?: string;
}

// --- Main Component ---
export default function EditMikrotikRouterPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const { id } = params;
  const [name, setName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [apiUsername, setApiUsername] = useState("");
  const [apiPassword, setApiPassword] = useState("");
  const [apiPort, setApiPort] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchRouter = async () => {
      if (!token) {
        setError("Authentication token not found.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/mikrotik/routers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("Failed to fetch router");
        const data: MikrotikRouter = await response.json();
        setName(data.name);
        setIpAddress(data.ipAddress);
        setApiUsername(data.apiUsername);
        setApiPort(data.apiPort.toString());
        setLocation(data.location || "");
      } catch (err) {
        setError((err instanceof Error) ? err.message : "Failed to load router data.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRouter();
  }, [id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (!token) {
      toast({ title: "Authentication Error", variant: "destructive" });
      setSubmitting(false);
      return;
    }
    try {
      const response = await fetch(`/api/mikrotik/routers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, ipAddress, apiUsername, apiPassword: apiPassword || undefined, apiPort: parseInt(apiPort), location }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update router");
      }
      toast({ title: "Router Updated", description: "Mikrotik router updated successfully." });
      router.push("/mikrotik/routers");
    } catch (error) {
      toast({ title: "Error", description: (error instanceof Error) ? error.message : "Failed to update router.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    if (!token) {
      toast({ title: "Authentication Error", variant: "destructive" });
      setTestLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/mikrotik/routers/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ipAddress, apiUsername, apiPassword, apiPort: parseInt(apiPort) }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Connection test failed");
      }
      toast({ title: "Connection Test", description: "Connection test successful!" });
    } catch (error) {
      toast({ title: "Connection Test Failed", description: (error instanceof Error) ? error.message : "Check details.", variant: "destructive" });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Loading...</div>;
  }
  if (error) {
    return <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white">
      <Topbar />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/mikrotik/routers"><Button variant="ghost" size="icon" className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Edit Mikrotik Router</h1>
            <p className="text-sm text-zinc-400">Update router information and API credentials.</p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit}>
              <Card className="bg-zinc-900/50 backdrop-blur-lg border-zinc-700 shadow-2xl shadow-blue-500/10 rounded-xl">
                <CardHeader className="border-b border-zinc-800 pb-4">
                  <CardTitle className="text-base text-cyan-400 flex items-center gap-2">Router Details</CardTitle>
                  <CardDescription className="text-xs text-zinc-400">Update the basic details and API credentials for this router.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Router Name</Label><Input value={name} onChange={e => setName(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                  <div className="space-y-1"><Label className="text-xs">IP Address</Label><Input value={ipAddress} onChange={e => setIpAddress(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                  <div className="space-y-1"><Label className="text-xs">API Username</Label><Input value={apiUsername} onChange={e => setApiUsername(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                  <div className="space-y-1"><Label className="text-xs">API Password</Label><Input type="password" value={apiPassword} onChange={e => setApiPassword(e.target.value)} placeholder="Leave blank to keep current" className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                  <div className="space-y-1"><Label className="text-xs">API Port</Label><Input type="number" value={apiPort} onChange={e => setApiPort(e.target.value)} required className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                  <div className="space-y-1"><Label className="text-xs">Location (Optional)</Label><Input value={location} onChange={e => setLocation(e.target.value)} className="h-9 bg-zinc-800 border-zinc-700 text-sm" /></div>
                </CardContent>
                <CardFooter className="p-4 flex items-center justify-between border-t border-zinc-800">
                  <Button type="button" variant="outline" size="sm" onClick={handleTestConnection} disabled={testLoading}>
                    {testLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}
                    Test Connection
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => router.push("/mikrotik/routers")}>Cancel</Button>
                    <Button type="submit" size="sm" disabled={submitting} className="bg-gradient-to-r from-blue-600 to-cyan-500">
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {submitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
