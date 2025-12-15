import { Notification } from '@/types/notification';
import { format } from 'date-fns'; // Changed from formatDistanceToNow
import { Wifi, WifiOff, Bell, X, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onItemClick: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationIcon = ({ type, message }: { type: Notification['type'], message: string }) => {
  // Add more specific icons based on message content
  if (type === 'device_status') {
    if (message.includes('UP')) {
      return <Wifi className="h-5 w-5 text-green-500" />;
    }
    return <WifiOff className="h-5 w-5 text-red-500" />;
  }
  if (type === 'system') {
    return <Server className="h-5 w-5 text-blue-400" />;
  }
  return <Bell className="h-5 w-5 text-gray-400" />;
};

const NotificationItem = ({ notification, onItemClick, onDelete }: NotificationItemProps) => {
  const isUnread = notification.status === 'unread';

  return (
    <div
      className={cn(
        "group relative flex items-start p-3 border-b border-zinc-700 cursor-pointer transition-all duration-200 ease-in-out",
        isUnread ? "bg-zinc-800 hover:bg-zinc-700" : "bg-zinc-900 hover:bg-zinc-800",
        "rounded-lg shadow-sm mb-2" // Added for a lifted look
      )}
      onClick={() => onItemClick(notification._id)}
    >
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1",
        isUnread && "bg-blue-500"
      )}></div>
      <div className="flex-shrink-0 mt-1">
        <NotificationIcon type={notification.type} message={notification.message} />
      </div>
      <div className="flex-grow mx-3">
        <p className="text-sm text-gray-200">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">
          {format(new Date(notification.createdAt), 'MMM dd, yyyy hh:mm a')}
        </p>
      </div>
      <div className="absolute top-2 right-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-50 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification._id);
          }}
          title="Remove notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default NotificationItem;
