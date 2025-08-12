import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function RecentOrders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/purchase-orders"],
  });

  const recentOrders = orders?.slice(0, 3) || [];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'default';
      case 'in_progress':
      case 'acknowledged':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
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
          <CardTitle>Recent Orders</CardTitle>
          <Link href="/purchase-orders">
            <a className="text-sm text-primary hover:text-blue-700 font-medium" data-testid="link-view-all-orders">
              View All
            </a>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {recentOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500" data-testid="text-no-orders">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="border-b border-slate-100 last:border-b-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900" data-testid={`text-order-number-${order.id}`}>
                      {order.orderNumber}
                    </p>
                    <p className="text-sm text-slate-500" data-testid={`text-order-title-${order.id}`}>
                      {order.title}
                    </p>
                    <p className="text-xs text-slate-400" data-testid={`text-order-date-${order.id}`}>
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900" data-testid={`text-order-amount-${order.id}`}>
                      {formatCurrency(Number(order.amount), order.currency)}
                    </p>
                    <Badge className={getStatusColor(order.status)} data-testid={`badge-order-status-${order.id}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </Badge>
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
