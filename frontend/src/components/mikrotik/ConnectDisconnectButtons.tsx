"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Loader2, Plug, PlugZap } from "lucide-react";
import { useState } from "react";

interface ConnectDisconnectButtonsProps {
  userId: string;
  isManuallyDisconnected: boolean;
  onStatusChange: () => void; // Callback to refresh user data
  isIconOnly?: boolean;
  isDropdownItem?: boolean; // New prop for dropdown rendering
}

export function ConnectDisconnectButtons({ userId, isManuallyDisconnected, onStatusChange, isIconOnly = false, isDropdownItem = false }: ConnectDisconnectButtonsProps) {
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

      toast.success(`User ${action}ed successfully.`);
      onStatusChange(); // Refresh user data
    } catch (error: unknown) {
      toast.error(`Error ${action === 'connect' ? 'Connecting' : 'Disconnecting'} User: ${(error as Error).message || `Failed to ${action} user.`}`);
    } finally {
      setIsLoading(false);
    }
  };

  const content = (action: 'connect' | 'disconnect') => (
    <>
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : action === 'connect' ? (
        <Plug className="mr-2 h-4 w-4" />
      ) : (
        <PlugZap className="mr-2 h-4 w-4" />
      )}
      {action === 'connect' ? 'Connect' : 'Disconnect'}
    </>
  );

  if (isDropdownItem) {
    return (
      <DropdownMenuItem
        onClick={() => handleAction(isManuallyDisconnected ? 'connect' : 'disconnect')}
        disabled={isLoading}
        className={isManuallyDisconnected ? "text-green-500 focus:text-green-500" : "text-red-500 focus:text-red-500"}
      >
        {content(isManuallyDisconnected ? 'connect' : 'disconnect')}
      </DropdownMenuItem>
    );
  }

  return (
    <>
      {isManuallyDisconnected ? (
        <Button
          onClick={() => handleAction('connect')}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 text-white"
          size={isIconOnly ? "icon" : "default"}
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
          size={isIconOnly ? "icon" : "default"}
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
