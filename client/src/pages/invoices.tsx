import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye, Edit, FileText, Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import InvoiceForm from "@/components/forms/invoice-form";
import { Invoice } from "@/types";

export default function Invoices() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
    enabled: isAuthenticated,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setShowForm(false);
      setSelectedInvoice(null);
      toast({
        title: "Success",
        description: "Invoice created successfully",
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
        description: "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setShowForm(false);
      setSelectedInvoice(null);
      toast({
        title: "Success",
        description: "Invoice updated successfully",
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
        description: "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  const filteredInvoices = invoices?.filter((invoice: Invoice) =>
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'submitted':
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateInvoice = (invoiceData: any) => {
    createInvoiceMutation.mutate(invoiceData);
  };

  const handleUpdateInvoice = (invoiceData: any) => {
    if (selectedInvoice) {
      updateInvoiceMutation.mutate({ id: selectedInvoice.id, data: invoiceData });
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
          <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded animate-pulse"></div>
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Invoices</h1>
            <p className="text-slate-600">Manage your invoices and payment tracking</p>
          </div>
          <Button onClick={() => setShowForm(true)} data-testid="button-create-invoice">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-invoices"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        </div>

        {/* Invoices List */}
        <div className="space-y-4">
          {filteredInvoices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2" data-testid="text-no-invoices-title">No invoices found</h3>
                <p className="text-slate-600 mb-4" data-testid="text-no-invoices-description">Get started by creating your first invoice</p>
                <Button onClick={() => setShowForm(true)} data-testid="button-create-first-invoice">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredInvoices.map((invoice: Invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold text-slate-900" data-testid={`text-invoice-number-${invoice.id}`}>
                            {invoice.invoiceNumber}
                          </h3>
                          {invoice.purchaseOrderId && (
                            <p className="text-slate-600 text-sm" data-testid={`text-invoice-po-${invoice.id}`}>
                              Related to PO: {invoice.purchaseOrderId}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                            <span data-testid={`text-invoice-issue-date-${invoice.id}`}>
                              Issued: {formatDate(invoice.issueDate)}
                            </span>
                            {invoice.dueDate && (
                              <span data-testid={`text-invoice-due-date-${invoice.id}`}>
                                Due: {formatDate(invoice.dueDate)}
                              </span>
                            )}
                            {invoice.paidDate && (
                              <span className="text-green-600" data-testid={`text-invoice-paid-date-${invoice.id}`}>
                                Paid: {formatDate(invoice.paidDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold text-slate-900" data-testid={`text-invoice-amount-${invoice.id}`}>
                          {formatCurrency(Number(invoice.amount), invoice.currency)}
                        </p>
                        {invoice.taxAmount && (
                          <p className="text-sm text-slate-500" data-testid={`text-invoice-tax-${invoice.id}`}>
                            Tax: {formatCurrency(Number(invoice.taxAmount), invoice.currency)}
                          </p>
                        )}
                        <Badge className={getStatusColor(invoice.status)} data-testid={`badge-invoice-status-${invoice.id}`}>
                          {invoice.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-download-invoice-${invoice.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowForm(true);
                          }}
                          data-testid={`button-edit-invoice-${invoice.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`button-view-invoice-${invoice.id}`}
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
          <InvoiceForm
            invoice={selectedInvoice}
            onSubmit={selectedInvoice ? handleUpdateInvoice : handleCreateInvoice}
            onCancel={() => {
              setShowForm(false);
              setSelectedInvoice(null);
            }}
            isLoading={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
