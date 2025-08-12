import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye, Edit, FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import PurchaseOrderForm from "@/components/forms/purchase-order-form";
import { PurchaseOrder } from "@/types";

export default function PurchaseOrders() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

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

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["/api/purchase-orders"],
    enabled: isAuthenticated,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      setShowForm(false);
      setSelectedOrder(null);
      toast({
        title: "Success",
        description: "Purchase order created successfully",
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
        description: "Failed to create purchase order",
        variant: "destructive",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      setShowForm(false);
      setSelectedOrder(null);
      toast({
        title: "Success",
        description: "Purchase order updated successfully",
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
        description: "Failed to update purchase order",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders?.filter((order: PurchaseOrder) =>
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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

  const handleCreateOrder = (orderData: any) => {
    createOrderMutation.mutate(orderData);
  };

  const handleUpdateOrder = (orderData: any) => {
    if (selectedOrder) {
      updateOrderMutation.mutate({ id: selectedOrder.id, data: orderData });
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
        <div className="space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded"></div>
            ))}
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Purchase Orders</h1>
            <p className="text-slate-600">Manage your purchase orders and work orders</p>
          </div>
          <Button onClick={() => setShowForm(true)} data-testid="button-create-order">
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-orders"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No purchase orders found</h3>
                <p className="text-slate-600 mb-4">Get started by creating your first purchase order</p>
                <Button onClick={() => setShowForm(true)} data-testid="button-create-first-order">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order: PurchaseOrder) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold text-slate-900" data-testid={`text-order-number-${order.id}`}>
                            {order.orderNumber}
                          </h3>
                          <p className="text-slate-600" data-testid={`text-order-title-${order.id}`}>
                            {order.title}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                            <span data-testid={`text-order-type-${order.id}`}>
                              {order.orderType === 'purchase_order' ? 'Purchase Order' : 'Work Order'}
                            </span>
                            <span data-testid={`text-order-date-${order.id}`}>
                              {formatDate(order.createdAt)}
                            </span>
                            {order.dueDate && (
                              <span data-testid={`text-order-due-${order.id}`}>
                                Due: {formatDate(order.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold text-slate-900" data-testid={`text-order-amount-${order.id}`}>
                          {formatCurrency(Number(order.amount), order.currency)}
                        </p>
                        <Badge className={getStatusColor(order.status)} data-testid={`badge-order-status-${order.id}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowForm(true);
                          }}
                          data-testid={`button-edit-order-${order.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-view-order-${order.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <PurchaseOrderForm
            order={selectedOrder}
            onSubmit={selectedOrder ? handleUpdateOrder : handleCreateOrder}
            onCancel={() => {
              setShowForm(false);
              setSelectedOrder(null);
            }}
            isLoading={createOrderMutation.isPending || updateOrderMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
