"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Plug, PlugZap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ConnectDisconnectButtonsProps {
  userId: string;
  isManuallyDisconnected: boolean;
  onStatusChange: () => void; // Callback to refresh user data
  isIconOnly?: boolean; // New prop for icon-only display
}

export function ConnectDisconnectButtons({ userId, isManuallyDisconnected, onStatusChange, isIconOnly = false }: ConnectDisconnectButtonsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: 'connect' | 'disconnect') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/mikrotik/users/${userId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${action} user.`);
      }

      toast({
        title: 'Success',
        description: `User ${action}ed successfully.`,
      });
      onStatusChange(); // Refresh user data
    } catch (error: any) {
      toast({
        title: `Error ${action === 'connect' ? 'Connecting' : 'Disconnecting'} User`,
        description: error.message || `Failed to ${action} user.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isManuallyDisconnected ? (
        <Button
          onClick={() => handleAction('connect')}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 text-white"
          size={isIconOnly ? "icon" : "default"} // Adjust size for icon-only
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plug className={isIconOnly ? "h-4 w-4" : "mr-2 h-4 w-4"} />
          )}
          {!isIconOnly && "Connect"}
        </Button>
      ) : (
        <Button
          onClick={() => handleAction('disconnect')}
          disabled={isLoading}
          className="bg-red-500 hover:bg-red-600 text-white"
          size={isIconOnly ? "icon" : "default"} // Adjust size for icon-only
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PlugZap className={isIconOnly ? "h-4 w-4" : "mr-2 h-4 w-4"} />
          )}
          {!isIconOnly && "Disconnect"}
        </Button>
      )}
    </>
  );
}
