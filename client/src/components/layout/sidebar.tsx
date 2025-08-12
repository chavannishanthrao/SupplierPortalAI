import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { CompanyType } from "@/types";
import {
  ChartPie,
  File,
  CalendarDays,
  ClipboardCheck,
  ListTodo,
  ProjectorIcon,
  Handshake,
  DollarSign,
  FolderOpen,
  MessageSquare,
  Shield,
  Link as LinkIcon,
  X,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  companyType: CompanyType;
  onCompanyTypeChange: (type: CompanyType) => void;
  isMobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
}

export default function Sidebar({ 
  companyType, 
  onCompanyTypeChange, 
  isMobileMenuOpen, 
  onMobileMenuClose 
}: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/messages/unread-count"],
  });

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: ChartPie,
      current: location === "/",
    },
    {
      name: "Vendor Onboarding",
      href: "/vendor-onboarding",
      icon: Handshake,
      current: location === "/vendor-onboarding",
    },
    // Manufacturing-specific navigation
    ...(companyType === 'manufacturing' ? [
      {
        name: "Purchase Orders",
        href: "/purchase-orders",
        icon: File,
        current: location === "/purchase-orders",
      },
      {
        name: "Production Schedule",
        href: "/production-schedule",
        icon: CalendarDays,
        current: location === "/production-schedule",
      },
      {
        name: "Quality Control",
        href: "/quality-control",
        icon: ClipboardCheck,
        current: location === "/quality-control",
      },
    ] : []),
    // Service-specific navigation
    ...(companyType === 'service' ? [
      {
        name: "Work Orders",
        href: "/work-orders",
        icon: ListTodo,
        current: location === "/work-orders",
      },
      {
        name: "Project Schedule",
        href: "/project-schedule",
        icon: ProjectorIcon,
        current: location === "/project-schedule",
      },
      {
        name: "SLA Tracking",
        href: "/sla-tracking",
        icon: Handshake,
        current: location === "/sla-tracking",
      },
    ] : []),
    // Common navigation items
    {
      name: "Invoices",
      href: "/invoices",
      icon: DollarSign,
      current: location === "/invoices",
    },
    {
      name: "Documents",
      href: "/documents",
      icon: FolderOpen,
      current: location === "/documents",
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageSquare,
      current: location === "/messages",
      badge: unreadCount?.count || 0,
    },
    {
      name: "Compliance",
      href: "/compliance",
      icon: Shield,
      current: location === "/compliance",
    },
    {
      name: "Admin",
      href: "/admin",
      icon: Shield,
      current: location === "/admin",
    },
  ];

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <LinkIcon className="text-white text-sm" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900" data-testid="text-app-name">
                SupplyChain Pro
              </h1>
              <p className="text-xs text-slate-500" data-testid="text-company-name">
                {user?.tenantUser?.companyName || 'My Company'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMobileMenuClose}
            data-testid="button-close-mobile-menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Company Type Selector */}
      <div className="px-6 py-4 border-b border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Company Type
        </label>
        <Select value={companyType} onValueChange={(value: CompanyType) => onCompanyTypeChange(value)}>
          <SelectTrigger data-testid="select-company-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manufacturing">Manufacturing</SelectItem>
            <SelectItem value="service">Service Provider</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-4 space-y-2">
        {navigation.map((item) => (
          <Link key={item.name} href={item.href}>
            <span
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer",
                item.current
                  ? "text-primary bg-blue-50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
              data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
              {item.badge && item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {item.badge}
                </span>
              )}
            </span>
          </Link>
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="p-6 border-t border-slate-200">
        <Link href="/profile">
          <span className="flex items-center space-x-3 hover:bg-slate-50 rounded-lg p-2 transition-colors cursor-pointer" data-testid="link-user-profile">
            <img
              src={user?.profileImageUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40`}
              alt="User avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900" data-testid="text-user-name">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.email || 'User'}
              </p>
              <p className="text-xs text-slate-500" data-testid="text-user-role">
                {user?.tenantUser?.role || 'Supplier'}
              </p>
            </div>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="bg-white w-64 min-h-screen border-r border-slate-200 flex flex-col transition-all duration-300 lg:block hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
