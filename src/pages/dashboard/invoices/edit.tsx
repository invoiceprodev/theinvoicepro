import { type HttpError, useSelect, useOne } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFieldArray } from "react-hook-form";
import { useState, useEffect } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditView, EditViewHeader } from "@/components/refine-ui/views/edit-view";
import { LoadingOverlay } from "@/components/refine-ui/layout/loading-overlay";
import { useNavigate, useParams } from "react-router";
import { Trash2, Plus } from "lucide-react";
import type { Invoice, Client } from "@/types";
import { formatCurrency } from "@/lib/utils";

// Schema for line items
const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, { message: "Description is required." }),
  quantity: z.coerce.number().min(0.01, { message: "Quantity must be at least 0.01" }),
  unit_price: z.coerce.number().min(0, { message: "Unit price must be positive" }),
});

const invoiceFormSchema = z.object({
  invoice_number: z.string().min(1, { message: "Invoice number is required." }),
  client_id: z.string().min(1, { message: "Please select a client." }),
  invoice_date: z.string().min(1, { message: "Invoice date is required." }),
  due_date: z.string().min(1, { message: "Due date is required." }),
  tax_percentage: z.coerce.number().min(0).max(100, { message: "Tax must be between 0 and 100" }),
  notes: z.string().optional(),
  items: z.array(lineItemSchema).min(1, { message: "At least one line item is required." }),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export default function EditInvoicePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);

  // Fetch existing invoice data
  const { query: invoiceQuery } = useOne<Invoice>({
    resource: "invoices",
    id: id!,
    meta: {
      select: "*, items:invoice_items(*), client:clients(*)",
    },
  });

  const invoice = invoiceQuery.data?.data;

  const {
    refineCore: { onFinish, formLoading },
    ...form
  } = useForm<Invoice, HttpError, InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoice_number: "",
      client_id: "",
      invoice_date: "",
      due_date: "",
      tax_percentage: 0,
      notes: "",
      items: [
        {
          description: "",
          quantity: 1,
          unit_price: 0,
        },
      ],
    },
    refineCoreProps: {
      resource: "invoices",
      action: "edit",
      id: id!,
      redirect: false,
      queryOptions: {
        enabled: !!id,
      },
    },
  });

  // Load existing invoice data into form
  useEffect(() => {
    if (invoice) {
      form.reset({
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_id,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        tax_percentage: invoice.tax_percentage,
        notes: invoice.notes || "",
        items: invoice.items?.length
          ? invoice.items.map((item: any) => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
            }))
          : [{ description: "", quantity: 1, unit_price: 0 }],
      });
    }
  }, [invoice, form]);

  // Fetch clients for dropdown
  const { options: clientOptions, query: clientsQuery } = useSelect<Client>({
    resource: "clients",
    optionValue: "id",
    optionLabel: "name",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Watch form values for calculations
  const watchItems = form.watch("items");
  const watchTaxPercentage = form.watch("tax_percentage");

  // Calculate totals whenever items or tax changes
  useEffect(() => {
    const calculatedSubtotal = watchItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      return sum + quantity * unitPrice;
    }, 0);

    const taxPercent = Number(watchTaxPercentage) || 0;
    const calculatedTaxAmount = (calculatedSubtotal * taxPercent) / 100;
    const calculatedTotal = calculatedSubtotal + calculatedTaxAmount;

    setSubtotal(calculatedSubtotal);
    setTaxAmount(calculatedTaxAmount);
    setTotal(calculatedTotal);
  }, [watchItems, watchTaxPercentage]);

  async function onSubmit(values: InvoiceFormValues) {
    // Prepare invoice data with calculated totals
    const invoiceData: any = {
      invoice_number: values.invoice_number,
      client_id: values.client_id,
      invoice_date: values.invoice_date,
      due_date: values.due_date,
      subtotal: subtotal,
      tax_percentage: values.tax_percentage,
      tax_amount: taxAmount,
      total: total,
      notes: values.notes || null,
    };

    try {
      // Update invoice
      await onFinish(invoiceData);

      // Delete existing line items and create new ones
      if (invoice?.items) {
        const deletePromises = invoice.items.map((item: any) =>
          fetch(`${import.meta.env.VITE_API_URL}/rest/v1/invoice_items?id=eq.${item.id}`, {
            method: "DELETE",
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_API_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_API_KEY}`,
            },
          }),
        );
        await Promise.all(deletePromises);
      }

      // Create all line items
      const itemPromises = values.items.map((item) => {
        const itemTotal = Number(item.quantity) * Number(item.unit_price);
        return fetch(`${import.meta.env.VITE_API_URL}/rest/v1/invoice_items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_API_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_API_KEY}`,
          },
          body: JSON.stringify({
            invoice_id: id,
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            total: itemTotal,
          }),
        });
      });

      await Promise.all(itemPromises);

      // Navigate to invoice detail after successful update
      navigate(`/invoices/${id}`);
    } catch (error) {
      console.error("Error updating invoice:", error);
    }
  }

  return (
    <EditView>
      <EditViewHeader title="Edit Invoice" />
      <LoadingOverlay loading={formLoading || clientsQuery.isLoading || invoiceQuery.isLoading}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 max-w-4xl">
            {/* Invoice Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Invoice Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoice_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="INV-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientOptions?.map((option: any) => (
                            <SelectItem key={option.value} value={option.value as string}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoice_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Line Items Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Line Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      description: "",
                      quantity: 1,
                      unit_price: 0,
                    })
                  }>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start border p-3 rounded-md">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2">
                      <div className="md:col-span-5">
                        <FormField
                          control={form.control}
                          name={`items.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="Qty" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="md:col-span-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.unit_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="Unit Price" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium w-20 text-right">
                        {formatCurrency(
                          (Number(form.watch(`items.${index}.quantity`)) || 0) *
                            (Number(form.watch(`items.${index}.unit_price`)) || 0),
                        )}
                      </span>
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex flex-col items-end gap-2 max-w-sm ml-auto">
                <div className="flex justify-between w-full">
                  <span className="text-sm">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="tax_percentage"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-sm whitespace-nowrap">Tax (%):</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0" max="100" className="w-20" {...field} />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <span className="font-medium w-24 text-right">{formatCurrency(taxAmount)}</span>
                </div>

                <div className="flex justify-between w-full text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes or terms..." className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/invoices/${id}`)}
                disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? "Updating..." : "Update Invoice"}
              </Button>
            </div>
          </form>
        </Form>
      </LoadingOverlay>
    </EditView>
  );
}
