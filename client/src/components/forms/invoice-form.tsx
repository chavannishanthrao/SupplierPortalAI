import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, FileText } from "lucide-react";
import { Invoice, PurchaseOrder, LineItem } from "@/types";
import { generateInvoiceNumber } from "@/lib/utils";

const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  total: z.number(),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  purchaseOrderId: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().default("USD"),
  status: z.string().default("draft"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().optional(),
  taxAmount: z.string().optional(),
  discountAmount: z.string().optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: Invoice | null;
  onSubmit: (data: InvoiceFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function InvoiceForm({ 
  invoice, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: InvoiceFormProps) {
  const [showLineItems, setShowLineItems] = useState(false);

  // Fetch purchase orders for dropdown
  const { data: purchaseOrders } = useQuery({
    queryKey: ["/api/purchase-orders"],
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: invoice?.invoiceNumber || generateInvoiceNumber(),
      purchaseOrderId: invoice?.purchaseOrderId || "",
      amount: invoice?.amount || "",
      currency: invoice?.currency || "USD",
      status: invoice?.status || "draft",
      issueDate: invoice?.issueDate ? new Date(invoice.issueDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().slice(0, 16) : "",
      taxAmount: invoice?.taxAmount || "",
      discountAmount: invoice?.discountAmount || "",
      lineItems: invoice?.lineItems || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const watchedLineItems = form.watch("lineItems");
  const watchedTaxAmount = form.watch("taxAmount");
  const watchedDiscountAmount = form.watch("discountAmount");

  // Calculate total amount from line items, tax, and discount
  useEffect(() => {
    if (watchedLineItems && watchedLineItems.length > 0) {
      const subtotal = watchedLineItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const tax = parseFloat(watchedTaxAmount || "0");
      const discount = parseFloat(watchedDiscountAmount || "0");
      const total = subtotal + tax - discount;
      form.setValue("amount", total.toString());
    }
  }, [watchedLineItems, watchedTaxAmount, watchedDiscountAmount, form]);

  // Update line item totals
  const updateLineItemTotal = (index: number) => {
    const quantity = form.getValues(`lineItems.${index}.quantity`) || 0;
    const unitPrice = form.getValues(`lineItems.${index}.unitPrice`) || 0;
    const total = quantity * unitPrice;
    form.setValue(`lineItems.${index}.total`, total);
  };

  const addLineItem = () => {
    append({
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    });
  };

  const loadFromPO = (poId: string) => {
    const selectedPO = purchaseOrders?.find((po: PurchaseOrder) => po.id === poId);
    if (selectedPO) {
      form.setValue("amount", selectedPO.amount);
      form.setValue("currency", selectedPO.currency);
      
      if (selectedPO.lineItems && selectedPO.lineItems.length > 0) {
        // Clear existing line items and load from PO
        form.setValue("lineItems", []);
        selectedPO.lineItems.forEach((item) => {
          append({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          });
        });
        setShowLineItems(true);
      }
    }
  };

  const handleSubmit = (data: InvoiceFormData) => {
    // Convert date strings to proper format
    const submissionData = {
      ...data,
      issueDate: new Date(data.issueDate).toISOString(),
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    };
    onSubmit(submissionData);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-form-title">
            {invoice ? 'Edit Invoice' : 'Create New Invoice'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="INV-2024-0001"
                        data-testid="input-invoice-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchaseOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Purchase Order</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value) loadFromPO(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-purchase-order">
                          <SelectValue placeholder="Select a purchase order" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {purchaseOrders?.map((po: PurchaseOrder) => (
                          <SelectItem key={po.id} value={po.id}>
                            {po.orderNumber} - {po.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-invoice-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-invoice-currency">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-invoice-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="datetime-local"
                        data-testid="input-invoice-issue-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="datetime-local"
                        data-testid="input-invoice-due-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tax and Discount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taxAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Amount</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-invoice-tax-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Amount</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-invoice-discount-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Line Items Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLineItems(!showLineItems)}
                data-testid="button-toggle-line-items"
              >
                <FileText className="h-4 w-4 mr-2" />
                {showLineItems ? 'Hide' : 'Show'} Line Items
              </Button>
            </div>

            {showLineItems && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-slate-900">Line Items</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addLineItem}
                    data-testid="button-add-invoice-line-item"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="Item description"
                                    data-testid={`input-invoice-line-item-description-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div>
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number"
                                    min="1"
                                    onChange={(e) => {
                                      field.onChange(Number(e.target.value));
                                      updateLineItemTotal(index);
                                    }}
                                    data-testid={`input-invoice-line-item-quantity-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div>
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unit Price</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    onChange={(e) => {
                                      field.onChange(Number(e.target.value));
                                      updateLineItemTotal(index);
                                    }}
                                    data-testid={`input-invoice-line-item-unit-price-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex items-end space-x-2">
                          <div className="flex-1">
                            <FormLabel>Total</FormLabel>
                            <div className="text-sm font-medium text-slate-900 p-2 bg-slate-50 rounded" data-testid={`text-invoice-line-item-total-${index}`}>
                              ${form.watch(`lineItems.${index}.total`)?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => remove(index)}
                            data-testid={`button-remove-invoice-line-item-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                data-testid="button-cancel-invoice"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                data-testid="button-save-invoice"
              >
                {isLoading ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
