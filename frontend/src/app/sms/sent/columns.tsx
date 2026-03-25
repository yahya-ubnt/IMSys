"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { SmsLog } from "./page"
import { CheckCircle, XCircle, Eye, RefreshCw, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// --- Sub-components (redefined from SmsTab for local use) ---
const StatusBadge = ({ status }: { status: 'Success' | 'Failed' | 'Pending' | 'Submitted' | 'RequiresManualIntervention' }) => {
  const statusConfig = {
    Success: { icon: CheckCircle, color: 'bg-green-500/20 text-green-400', label: 'Success' },
    Failed: { icon: XCircle, color: 'bg-red-500/20 text-red-400', label: 'Failed' },
    Pending: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending' },
    Submitted: { icon: Clock, color: 'bg-blue-500/20 text-blue-400', label: 'Submitted' }, // Assuming 'Submitted' is similar to Pending
    RequiresManualIntervention: { icon: RefreshCw, color: 'bg-orange-500/20 text-orange-400', label: 'Failed' },
  };
  const { icon: Icon, color, label } = statusConfig[status];
  return (
    <Badge variant="outline" className={`border-0 ${color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
};

export const columns = (
  onViewDetails: (sms: SmsLog) => void,
  onRetry: (logId: string) => void,
  retryingId: string | null
): ColumnDef<SmsLog>[] => [
  {
    id: "id", // Added unique ID
    header: ({ column }) => (
      <Button variant="ghost">
        ID
      </Button>
    ),
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "mobileNumber",
    id: "mobileNumber", // Added unique ID
    header: ({ column }) => (
      <Button variant="ghost">
        Mobile Number
      </Button>
    ),
  },
  {
    accessorKey: "message",
    id: "message", // Added unique ID
    header: ({ column }) => (
      <Button variant="ghost">
        Message
      </Button>
    ),
    cell: ({ row }) => <div className="truncate max-w-xs">{row.original.message}</div>,
  },
  {
    accessorKey: "smsStatus",
    id: "smsStatus", // Added unique ID
    header: ({ column }) => (
      <Button variant="ghost">
        Status
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.original.smsStatus;
      return <StatusBadge status={status} />;
    },
  },
  {
    accessorKey: "messageType",
    id: "messageType", // Added unique ID
    header: ({ column }) => (
      <Button variant="ghost">
        Message Type
      </Button>
    ),
    cell: ({ row }) => {
      const messageType = row.original.messageType;
      return (
        <div className="flex items-center">
          <span>{messageType}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    id: "createdAt", // Added unique ID
    header: ({ column }) => (
      <Button variant="ghost">
        Sent At
      </Button>
    ),
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        {(row.original.smsStatus === 'RequiresManualIntervention' || row.original.smsStatus === 'Failed') && (
          <Button
            size="sm"
            variant="outline"
            className="border-orange-400 text-orange-400 hover:bg-orange-400/10 hover:text-orange-300"
            onClick={() => onRetry(row.original._id)}
            disabled={retryingId === row.original._id}
          >
            {retryingId === row.original._id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => onViewDetails(row.original)}>
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];
