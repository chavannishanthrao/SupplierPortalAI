import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Bell, X } from "lucide-react";

interface NotificationModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationModal({ open, onClose }: NotificationModalProps) {
  const { data: messages } = useQuery({
    queryKey: ["/api/messages"],
    enabled: open,
  });

  const notifications = messages?.filter(msg => !msg.isRead).slice(0, 10) || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-notifications">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500" data-testid="text-no-notifications">No new notifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bell className="text-primary text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900" data-testid={`text-notification-title-${notification.id}`}>
                        {notification.subject || 'New Message'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1" data-testid={`text-notification-content-${notification.id}`}>
                        {notification.content}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-400" data-testid={`text-notification-time-${notification.id}`}>
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        {notification.priority !== 'normal' && (
                          <Badge variant="secondary" className="text-xs">
                            {notification.priority.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
