import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Bot } from "lucide-react";

export default function MessagesPanel() {
  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/messages"],
  });

  const recentMessages = messages?.slice(0, 3) || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-start space-x-3">
                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Messages</CardTitle>
          <Link href="/messages">
            <a className="text-sm text-primary hover:text-blue-700 font-medium" data-testid="link-view-all-messages">
              View All
            </a>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {recentMessages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500" data-testid="text-no-messages">No messages found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentMessages.map((message) => (
              <div key={message.id} className="border-b border-slate-100 last:border-b-0 pb-4 last:pb-0">
                <div className="flex items-start space-x-3">
                  {message.senderId === 'system' ? (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="text-blue-600 text-xs" />
                    </div>
                  ) : (
                    <img
                      src={`https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32`}
                      alt="Sender"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900" data-testid={`text-message-sender-${message.id}`}>
                        {message.senderId === 'system' ? 'System' : 'Procurement Team'}
                      </p>
                      <span className="text-xs text-slate-500" data-testid={`text-message-time-${message.id}`}>
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1" data-testid={`text-message-content-${message.id}`}>
                      {message.subject || message.content}
                    </p>
                    {message.priority !== 'normal' && (
                      <Badge className={`${getPriorityColor(message.priority)} mt-2`} data-testid={`badge-message-priority-${message.id}`}>
                        {message.priority.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
