import React, { useEffect, useRef, useState } from "react";
import { type HttpError, useBack } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, Send, FileText } from "lucide-react";
import { useSelect } from "@refinedev/core";
import { toast } from "sonner";
import { useParams } from "react-router";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EditView } from "@/components/refine-ui/views/edit-view";
import { LoadingOverlay } from "@/components/refine-ui/layout/loading-overlay";
import { cn } from "@/lib/utils";
import { CURRENCIES, getCurrencySymbol, type Currency, type Invoice, type Client } from "@/types";

const invoiceFormSchema = z.object({
  clientId: z.string().min(1, { message: "Please select a client" }),
  invoiceDate: z.date({ required_error: "Invoice date is required" }),
  dueDate: z.date({ required_error: "Due date is required" }),
  currency: z.enum(["ZAR", "USD", "EUR"]),
  discountType: z.enum(["percentage", "fixed"]),
  discount: z.coerce.number().min(0, "Discount must be 0 or greater"),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1, { message: "Description is required" }),
        quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1" }),
        unitPrice: z.coerce.number().min(0, { message: "Unit price must be 0 or greater" }),
      }),
    )
    .min(1, { message: "At least one line item is required" }),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export const InvoiceEditPage: React.FC = () => {
  const back = useBack();
  const [attachPdf, setAttachPdf] = useState(false);
  const { id } = useParams<{ id: string }>();
  const hydratedInvoiceIdRef = useRef<string | null>(null);

  const {
    refineCore: { onFinish, formLoading, query },
    ...form
  } = useForm<Invoice, HttpError, InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: "",
      invoiceDate: new Date(),
      dueDate: new Date(),
      currency: "ZAR",
      discountType: "percentage",
      discount: 0,
      lineItems: [{ description: "", quantity: 1, unitPrice: 0 }],
      notes: "",
    },
    refineCoreProps: {
      resource: "invoices",
      action: "edit",
      id,
      redirect: "show",
    },
  });

  const invoice = query?.data?.data;
  const isInvoiceLoading = query?.isLoading || false;
  const invoiceLoadError = query?.error;

  const { options: clientOptions } = useSelect<Client>({
    resource: "clients",
    optionValue: "id",
    optionLabel: "name",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const lineItems = form.watch("lineItems");
  const selectedCurrency = (form.watch("currency") || "ZAR") as Currency;
  const symbol = getCurrencySymbol(selectedCurrency);
  const discountType = form.watch("discountType") || "percentage";
  const discountValue = Number(form.watch("discount")) || 0;

  const subtotal =
    lineItems?.reduce((sum, item) => {
      return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    }, 0) || 0;

  const discountAmount =
    discountType === "percentage" ? (subtotal * discountValue) / 100 : Math.min(discountValue, subtotal);
  const total = Math.max(0, subtotal - discountAmount);

  useEffect(() => {
    if (!invoice?.id || hydratedInvoiceIdRef.current === invoice.id) {
      return;
    }

    const invoiceLineItems = Array.isArray((invoice as any).lineItems)
      ? (invoice as any).lineItems
      : Array.isArray((invoice as any).items)
        ? (invoice as any).items
        : [];

    form.reset({
      clientId: invoice.client_id || invoice.clientId || "",
      invoiceDate: new Date(invoice.invoice_date || invoice.invoiceDate || new Date().toISOString()),
      dueDate: new Date(invoice.due_date || invoice.dueDate || new Date().toISOString()),
      currency: (invoice.currency as Currency) || "ZAR",
      discountType: ((invoice as any).discount_type || (invoice as any).discountType || "percentage") as
        | "percentage"
        | "fixed",
      discount: Number((invoice as any).discount || 0),
      notes: invoice.notes || "",
      lineItems:
        invoiceLineItems.length > 0
          ? invoiceLineItems.map((item: any) => ({
              description: item.description ?? "",
              quantity: Number(item.quantity ?? 1),
              unitPrice: Number(item.unit_price ?? item.unitPrice ?? 0),
            }))
          : [{ description: "", quantity: 1, unitPrice: 0 }],
    });
    hydratedInvoiceIdRef.current = invoice.id;
  }, [invoice, form]);

  function onSubmit(values: InvoiceFormValues, overrideStatus?: "Draft" | "Sent") {
    const lineItemsData = values.lineItems.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.quantity) * Number(item.unitPrice),
    }));
    const sub = lineItemsData.reduce((s, i) => s + i.total, 0);
    const disc = values.discountType === "percentage" ? (sub * values.discount) / 100 : Math.min(values.discount, sub);
    const tot = Math.max(0, sub - disc);

    onFinish({
      clientId: values.clientId,
      invoiceDate: format(values.invoiceDate, "yyyy-MM-dd"),
      dueDate: format(values.dueDate, "yyyy-MM-dd"),
      currency: values.currency,
      discountType: values.discountType,
      discount: values.discount,
      subtotal: sub,
      total: tot,
      notes: values.notes || "",
      lineItems: lineItemsData,
      ...(overrideStatus ? { status: overrideStatus } : {}),
    } as any);
  }

  const handleSaveAsDraft = () => {
    form.handleSubmit((values) => onSubmit(values, "Draft"))();
  };

  const handleSendInvoice = () => {
    form.handleSubmit((values) => {
      onSubmit(values, "Sent");
      toast.success("Invoice sent successfully");
    })();
  };

  return (
    <EditView>
      <LoadingOverlay loading={isInvoiceLoading}>
        <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Edit Invoice</h1>
          <p className="text-sm text-muted-foreground">Update invoice information</p>
        </div>

        {invoiceLoadError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Failed to load this invoice for editing.
          </div>
        ) : null}

        <Form {...form}>
          <form className="space-y-8">
            {/* Client & Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value ?? "")}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientOptions?.map((client) => (
                          <SelectItem key={client.value} value={String(client.value)}>
                            {client.label}
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
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value ?? "ZAR")}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.symbol} — {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="invoiceDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Invoice Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-base font-semibold">Due Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal border-primary/50",
                              !field.value && "text-muted-foreground",
                            )}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base">Line Items *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium text-sm">Description</th>
                        <th className="text-right p-3 font-medium text-sm w-24">Quantity</th>
                        <th className="text-right p-3 font-medium text-sm w-32">Unit Price ({symbol})</th>
                        <th className="text-right p-3 font-medium text-sm w-32">Total ({symbol})</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field: any, index) => {
                        const quantity = Number(lineItems?.[index]?.quantity) || 0;
                        const unitPrice = Number(lineItems?.[index]?.unitPrice) || 0;
                        const lineTotal = quantity * unitPrice;

                        return (
                          <tr key={field.id} className="border-t">
                            <td className="p-3">
                              <FormField
                                control={form.control}
                                name={`lineItems.${index}.description`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input placeholder="Description" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="p-3">
                              <FormField
                                control={form.control}
                                name={`lineItems.${index}.quantity`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input type="number" min="1" placeholder="1" className="text-right" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="p-3">
                              <FormField
                                control={form.control}
                                name={`lineItems.${index}.unitPrice`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="text-right"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="p-3 text-right font-medium">
                              {symbol}
                              {lineTotal.toFixed(2)}
                            </td>
                            <td className="p-3">
                              {fields.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="border-t bg-muted/20 p-4">
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex justify-between w-72">
                      <span className="text-sm text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">
                        {symbol}
                        {subtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Discount row */}
                    <div className="flex items-center gap-2 w-72">
                      <span className="text-sm text-muted-foreground shrink-0">Discount:</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <FormField
                          control={form.control}
                          name="discountType"
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">% Pct</SelectItem>
                                <SelectItem value="fixed">{symbol} Fixed</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="discount"
                          render={({ field }) => (
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              className="w-20 h-8 text-right text-sm"
                              {...field}
                            />
                          )}
                        />
                      </div>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between w-72 text-sm text-muted-foreground">
                        <span>Discount amount:</span>
                        <span className="text-destructive">
                          -{symbol}
                          {discountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between w-72 text-lg border-t pt-2">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold">
                        {symbol}
                        {total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Add any notes or additional information" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 pt-4">
              {/* Attach PDF toggle */}
              <div className="flex flex-col gap-1.5 items-start sm:items-end">
                <div className="flex items-center gap-2">
                  <Switch id="attach-pdf-edit" checked={attachPdf} onCheckedChange={setAttachPdf} />
                  <Label htmlFor="attach-pdf-edit" className="text-sm cursor-pointer">
                    Attach PDF to email
                  </Label>
                </div>
                {attachPdf && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />A PDF copy will be attached when sending
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => back()} disabled={formLoading}>
                  Cancel
                </Button>
                <Button type="button" variant="secondary" onClick={handleSaveAsDraft} disabled={formLoading}>
                  {formLoading ? "Saving..." : "Save as Draft"}
                </Button>
                <Button type="button" onClick={handleSendInvoice} disabled={formLoading}>
                  <Send className="h-4 w-4 mr-2" />
                  {formLoading ? "Sending..." : "Send Invoice"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
        </div>
      </LoadingOverlay>
    </EditView>
  );
};
