import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Menu, Search, Bell, Plus } from "lucide-react";
import { useState } from "react";
import NotificationModal from "@/components/modals/notification-modal";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/messages/unread-count"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onMobileMenuToggle}
              data-testid="button-mobile-menu-toggle"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-slate-900" data-testid="text-page-title">
                Dashboard
              </h2>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Live
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <Input
                type="text"
                placeholder="Search orders, invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10"
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            </form>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => setShowNotifications(true)}
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount && unreadCount.count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount.count}
                </span>
              )}
            </Button>

            {/* Quick Actions */}
            <Button data-testid="button-new-invoice">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>
      </header>

      <NotificationModal 
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
