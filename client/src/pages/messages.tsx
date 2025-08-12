import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, Search, Send, Plus, Bot, User, 
  AlertCircle, Clock, CheckCircle2 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatDateTime } from "@/lib/utils";
import { Message } from "@/types";

export default function Messages() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [newMessage, setNewMessage] = useState({
    subject: "",
    content: "",
    priority: "normal",
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/messages"],
    enabled: isAuthenticated,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/messages/unread-count"],
    enabled: isAuthenticated,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      setShowCompose(false);
      setNewMessage({ subject: "", content: "", priority: "normal" });
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: "PUT",
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const filteredMessages = messages?.filter((message: Message) =>
    message.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return AlertCircle;
      case 'high':
        return Clock;
      default:
        return CheckCircle2;
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.content.trim()) {
      toast({
        title: "Error",
        description: "Message content is required",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      subject: newMessage.subject || "New Message",
      content: newMessage.content,
      priority: newMessage.priority,
      messageType: "message",
    });
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead && message.recipientId === user?.id) {
      markAsReadMutation.mutate(message.id);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="lg:col-span-2">
            <div className="h-96 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Messages</h1>
            <p className="text-slate-600">
              Communicate with your procurement team
              {unreadCount && unreadCount.count > 0 && (
                <Badge className="ml-2 bg-red-100 text-red-800" data-testid="badge-unread-count">
                  {unreadCount.count} unread
                </Badge>
              )}
            </p>
          </div>
          <Button onClick={() => setShowCompose(true)} data-testid="button-compose-message">
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        {/* Messages Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <div className="relative">
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-messages"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            </div>

            {/* Messages */}
            <div className="space-y-2">
              {filteredMessages.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600" data-testid="text-no-messages">No messages found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredMessages.map((message: Message) => {
                  const PriorityIcon = getPriorityIcon(message.priority);
                  const isUnread = !message.isRead && message.recipientId === user?.id;
                  const isSelected = selectedMessage?.id === message.id;
                  
                  return (
                    <Card 
                      key={message.id} 
                      className={`cursor-pointer hover:shadow-md transition-all ${isSelected ? 'ring-2 ring-primary' : ''} ${isUnread ? 'bg-blue-50' : ''}`}
                      onClick={() => handleMessageClick(message)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          {message.senderId === 'system' ? (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Bot className="text-blue-600 text-xs" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="text-slate-600 text-xs" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`font-medium text-slate-900 truncate ${isUnread ? 'font-semibold' : ''}`} data-testid={`text-message-sender-${message.id}`}>
                                {message.senderId === 'system' ? 'System' : 'Procurement Team'}
                              </p>
                              <div className="flex items-center space-x-1">
                                {message.priority !== 'normal' && (
                                  <PriorityIcon className={`h-3 w-3 ${message.priority === 'urgent' ? 'text-red-500' : 'text-yellow-500'}`} />
                                )}
                                {isUnread && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            <p className="text-sm font-medium text-slate-700 truncate" data-testid={`text-message-subject-${message.id}`}>
                              {message.subject || 'No Subject'}
                            </p>
                            <p className="text-sm text-slate-500 truncate" data-testid={`text-message-preview-${message.id}`}>
                              {message.content}
                            </p>
                            <p className="text-xs text-slate-400 mt-1" data-testid={`text-message-time-${message.id}`}>
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Message Detail / Compose */}
          <div className="lg:col-span-2">
            {showCompose ? (
              <Card>
                <CardHeader>
                  <CardTitle>Compose New Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <div>
                      <Input
                        placeholder="Subject (optional)"
                        value={newMessage.subject}
                        onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                        data-testid="input-message-subject"
                      />
                    </div>
                    <div>
                      <Select 
                        value={newMessage.priority} 
                        onValueChange={(value) => setNewMessage({ ...newMessage, priority: value })}
                      >
                        <SelectTrigger data-testid="select-message-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Textarea
                        placeholder="Type your message here..."
                        value={newMessage.content}
                        onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                        rows={10}
                        data-testid="textarea-message-content"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowCompose(false)}
                        data-testid="button-cancel-message"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={sendMessageMutation.isPending}
                        data-testid="button-send-message"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : selectedMessage ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span data-testid={`text-selected-message-subject-${selectedMessage.id}`}>
                          {selectedMessage.subject || 'No Subject'}
                        </span>
                        {selectedMessage.priority !== 'normal' && (
                          <Badge className={getPriorityColor(selectedMessage.priority)} data-testid={`badge-selected-message-priority-${selectedMessage.id}`}>
                            {selectedMessage.priority.toUpperCase()}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-slate-500" data-testid={`text-selected-message-details-${selectedMessage.id}`}>
                        From: {selectedMessage.senderId === 'system' ? 'System' : 'Procurement Team'} • 
                        {formatDateTime(selectedMessage.createdAt)}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedMessage(null)}
                      data-testid="button-close-message-detail"
                    >
                      Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none" data-testid={`text-selected-message-content-${selectedMessage.id}`}>
                    <p>{selectedMessage.content}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2" data-testid="text-no-message-selected">No message selected</h3>
                  <p className="text-slate-600" data-testid="text-select-message-instruction">Select a message from the list to view its content</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
