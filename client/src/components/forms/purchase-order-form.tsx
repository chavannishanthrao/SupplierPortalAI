import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Calendar } from "lucide-react";
import { PurchaseOrder, LineItem } from "@/types";
import { generateOrderNumber } from "@/lib/utils";

const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  total: z.number(),
  sku: z.string().optional(),
});

const purchaseOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  orderType: z.enum(["purchase_order", "work_order"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().default("USD"),
  status: z.string().default("draft"),
  dueDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderFormProps {
  order?: PurchaseOrder | null;
  onSubmit: (data: PurchaseOrderFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function PurchaseOrderForm({ 
  order, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: PurchaseOrderFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      orderNumber: order?.orderNumber || generateOrderNumber(),
      orderType: (order?.orderType as "purchase_order" | "work_order") || "purchase_order",
      title: order?.title || "",
      description: order?.description || "",
      amount: order?.amount || "",
      currency: order?.currency || "USD",
      status: order?.status || "draft",
      dueDate: order?.dueDate || "",
      deliveryDate: order?.deliveryDate || "",
      lineItems: order?.lineItems || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const watchedLineItems = form.watch("lineItems");

  // Calculate total amount from line items
  useEffect(() => {
    if (watchedLineItems && watchedLineItems.length > 0) {
      const total = watchedLineItems.reduce((sum, item) => sum + (item.total || 0), 0);
      form.setValue("amount", total.toString());
    }
  }, [watchedLineItems, form]);

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
      sku: "",
    });
  };

  const handleSubmit = (data: PurchaseOrderFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-form-title">
            {order ? 'Edit Purchase Order' : 'Create New Purchase Order'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Number</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="PO-2024-0001"
                        data-testid="input-order-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-order-type">
                          <SelectValue placeholder="Select order type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="purchase_order">Purchase Order</SelectItem>
                        <SelectItem value="work_order">Work Order</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Order title or description"
                      data-testid="input-order-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Additional details about the order"
                      rows={3}
                      data-testid="textarea-order-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        data-testid="input-order-amount"
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
                        <SelectTrigger data-testid="select-order-currency">
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
                        <SelectTrigger data-testid="select-order-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="acknowledged">Acknowledged</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Advanced Fields Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                data-testid="button-toggle-advanced"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {showAdvanced ? 'Hide' : 'Show'} Dates & Line Items
              </Button>
            </div>

            {showAdvanced && (
              <>
                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            data-testid="input-order-due-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Date</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="datetime-local"
                            data-testid="input-order-delivery-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-slate-900">Line Items</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addLineItem}
                      data-testid="button-add-line-item"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <Card key={field.id}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
                                      data-testid={`input-line-item-description-${index}`}
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
                              name={`lineItems.${index}.sku`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>SKU</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="SKU"
                                      data-testid={`input-line-item-sku-${index}`}
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
                                      data-testid={`input-line-item-quantity-${index}`}
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
                                      data-testid={`input-line-item-unit-price-${index}`}
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
                              <div className="text-sm font-medium text-slate-900 p-2 bg-slate-50 rounded" data-testid={`text-line-item-total-${index}`}>
                                ${form.watch(`lineItems.${index}.total`)?.toFixed(2) || '0.00'}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => remove(index)}
                              data-testid={`button-remove-line-item-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                data-testid="button-cancel-order"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                data-testid="button-save-order"
              >
                {isLoading ? 'Saving...' : order ? 'Update Order' : 'Create Order'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
