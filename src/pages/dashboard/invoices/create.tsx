import React, { useEffect, useMemo, useState } from "react";
import { type BaseRecord, type HttpError, useBack, useCreate, useInvalidate, useList } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { useForm as useReactHookForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Send, FileText, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CreateView } from "@/components/refine-ui/views/create-view";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePlanEntitlements } from "@/hooks/use-plan-entitlements";
import { CURRENCIES, getCurrencySymbol, type Client, type Currency } from "@/types";
import { apiRequest } from "@/lib/api-client";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Unit price must be positive"),
});

const invoiceFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.enum(["Draft", "Sent", "Paid", "Overdue"]),
  currency: z.enum(["ZAR", "USD", "EUR"]),
  discountType: z.enum(["percentage", "fixed"]),
  discount: z.coerce.number().min(0, "Discount must be 0 or greater"),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

const clientQuickCreateSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  company: z.string().optional(),
  phone: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
type ClientQuickCreateValues = z.infer<typeof clientQuickCreateSchema>;

type LineItemRow = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export const InvoiceCreatePage: React.FC = () => {
  const back = useBack();
  const invalidate = useInvalidate();
  const [searchParams] = useSearchParams();

  const [lineItems, setLineItems] = useState<LineItemRow[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [attachPdf, setAttachPdf] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isNumberLoading, setIsNumberLoading] = useState(false);
  const { entitlements, usage, canCreateClient, canCreateInvoice, canUseQuotes } = usePlanEntitlements();
  const isQuoteFlow = searchParams.get("type") === "quote";

  const { result: clientsResult, query: clientsQuery } = useList<Client>({
    resource: "clients",
  });
  const { mutateAsync: createClient, mutation: createClientMutation } = useCreate<BaseRecord>();
  const isCreatingClient = createClientMutation?.isPending || false;

  const clientOptions = useMemo(
    () =>
      (clientsResult?.data || []).map((client) => ({
        label: client.company ? `${client.name} (${client.company})` : client.name,
        value: client.id,
      })),
    [clientsResult?.data],
  );

  const {
    refineCore: { onFinish, formLoading },
    ...form
  } = useForm<any, HttpError, InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      clientId: searchParams.get("clientId") || "",
      invoiceNumber: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "Draft",
      currency: "ZAR",
      discountType: "percentage",
      discount: 0,
      notes: "",
      lineItems: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
    refineCoreProps: {
      resource: "invoices",
      action: "create",
      redirect: "list",
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadNextDocumentNumber() {
      try {
        setIsNumberLoading(true);
        const response = await apiRequest<{ data: { number: string } }>(
          `/documents/next-number?type=${encodeURIComponent(isQuoteFlow ? "quote" : "invoice")}`,
        );
        if (!cancelled) {
          form.setValue("invoiceNumber", response.data.number, { shouldDirty: false });
        }
      } catch (error) {
        const fallbackPrefix = isQuoteFlow ? "QUO-" : "INV-";
        if (!cancelled) {
          form.setValue("invoiceNumber", `${fallbackPrefix}0001`, { shouldDirty: false });
        }
        console.error("[InvoiceCreate] failed to load next document number", error);
      } finally {
        if (!cancelled) {
          setIsNumberLoading(false);
        }
      }
    }

    void loadNextDocumentNumber();

    return () => {
      cancelled = true;
    };
  }, [form, isQuoteFlow]);

  const selectedCurrency = (form.watch("currency") || "ZAR") as Currency;
  const symbol = getCurrencySymbol(selectedCurrency);
  const discountType = form.watch("discountType") || "percentage";
  const discountValue = Number(form.watch("discount")) || 0;

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount =
    discountType === "percentage" ? (subtotal * discountValue) / 100 : Math.min(discountValue, subtotal);
  const total = Math.max(0, subtotal - discountAmount);

  const addLineItem = () => {
    const newItems = [...lineItems, { description: "", quantity: 1, unitPrice: 0 }];
    setLineItems(newItems);
    form.setValue("lineItems", newItems);
  };

  const removeLineItem = (index: number) => {
    const newItems = lineItems.filter((_, i) => i !== index);
    setLineItems(newItems);
    form.setValue("lineItems", newItems);
  };

  const updateLineItem = (index: number, field: keyof LineItemRow, value: string | number) => {
    const newItems = lineItems.map((item, i) =>
      i === index ? { ...item, [field]: field === "description" ? value : Number(value) } : item,
    );
    setLineItems(newItems);
    form.setValue("lineItems", newItems);
  };

  function onSubmit(values: InvoiceFormValues, overrideStatus?: "Draft" | "Sent") {
    const computedLineItems = lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));

    const sub = computedLineItems.reduce((s, i) => s + i.total, 0);
    const disc = values.discountType === "percentage" ? (sub * values.discount) / 100 : Math.min(values.discount, sub);
    const tot = Math.max(0, sub - disc);
    const status = overrideStatus ?? values.status;

    onFinish({
      invoiceNumber: values.invoiceNumber,
      clientId: String(values.clientId),
      invoiceDate: values.invoiceDate,
      dueDate: values.dueDate,
      status,
      currency: values.currency,
      discountType: values.discountType,
      discount: values.discount,
      notes: values.notes || "",
      subtotal: sub,
      total: tot,
      lineItems: computedLineItems,
      createdAt: new Date().toISOString(),
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

  const clientQuickCreateForm = useReactHookForm<ClientQuickCreateValues>({
    resolver: zodResolver(clientQuickCreateSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
    },
  });

  const handleQuickCreateClient = clientQuickCreateForm.handleSubmit(async (values) => {
    if (!canCreateClient) {
      toast.error("Client limit reached", {
        description: `Your plan allows ${entitlements.maxSavedClients} saved clients.`,
      });
      return;
    }

    try {
      const result = await createClient({
        resource: "clients",
        values: {
          name: values.name,
          email: values.email,
          company: values.company || "",
          phone: values.phone || "",
          status: "Active",
          created_at: new Date().toISOString(),
        },
      });

      const createdClient = result.data as Client;
      await invalidate({ resource: "clients", invalidates: ["list"] });
      await clientsQuery.refetch();
      form.setValue("clientId", createdClient.id);
      clientQuickCreateForm.reset();
      setIsClientDialogOpen(false);
      toast.success("Client created", {
        description: `${createdClient.name} has been added and selected for this invoice.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create client.";
      toast.error("Could not create client", { description: message });
    }
  });

  return (
    <CreateView>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{isQuoteFlow ? "Create Quote" : "Create Invoice"}</h1>
          <p className="text-sm text-muted-foreground">
            {isQuoteFlow ? "Prepare a quote for your client" : "Fill in the details to create a new invoice"}
          </p>
        </div>

        {isQuoteFlow && !canUseQuotes && (
          <Alert className="mb-6" variant="destructive">
            <AlertTitle>Quotes unavailable on current plan</AlertTitle>
            <AlertDescription>Your current plan does not allow quote creation.</AlertDescription>
          </Alert>
        )}

        {!canCreateInvoice && (
          <Alert className="mb-6" variant="destructive">
            <AlertTitle>Monthly invoice/quote limit reached</AlertTitle>
            <AlertDescription>
              Your plan allows {entitlements.maxInvoicesPerMonth} invoices/quotes per month. You have already created{" "}
              {usage.invoicesThisMonth} this month.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form className="space-y-8">
            {/* Invoice Details */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold">Invoice Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="INV-001" {...field} />
                      </FormControl>
                      {isNumberLoading ? <p className="text-xs text-muted-foreground">Generating next number...</p> : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between gap-3">
                        <FormLabel>Client *</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsClientDialogOpen(true)}
                          disabled={!canCreateClient}>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add Client
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Select onValueChange={field.onChange} value={String(field.value)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientOptions.map((option) => (
                              <SelectItem key={option.value} value={String(option.value)}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoiceDate"
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
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Due Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="border-primary/50 focus-visible:ring-primary" />
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
            </div>

            <Separator />

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Line Items</h2>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {/* Header row */}
              <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price ({symbol})</div>
                <div className="col-span-2 text-right">Total ({symbol})</div>
                <div className="col-span-1" />
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => {
                  const lineTotal = item.quantity * item.unitPrice;
                  return (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-12 md:col-span-5">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, "description", e.target.value)}
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                          className="text-right"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, "unitPrice", e.target.value)}
                          className="text-right"
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2 text-right text-sm font-medium px-2">
                        {symbol}
                        {lineTotal.toFixed(2)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLineItem(index)}
                          disabled={lineItems.length === 1}
                          className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Discount Row */}
              <div className="flex justify-end pt-2">
                <div className="w-full max-w-sm space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>
                      {symbol}
                      {subtotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Discount field */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">Discount</span>
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
                            className="w-24 h-8 text-right text-sm"
                            {...field}
                          />
                        )}
                      />
                      <span className="text-sm text-muted-foreground w-20 text-right">
                        -{symbol}
                        {discountAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between font-semibold text-base pt-2 border-t">
                    <span>Total</span>
                    <span>
                      {symbol}
                      {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold">Notes</h2>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <textarea
                        placeholder="Add any notes or payment terms..."
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 pt-4">
              {/* Attach PDF toggle */}
              <div className="flex flex-col gap-1.5 items-start sm:items-end">
                <div className="flex items-center gap-2">
                  <Switch id="attach-pdf" checked={attachPdf} onCheckedChange={setAttachPdf} />
                  <Label htmlFor="attach-pdf" className="text-sm cursor-pointer">
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveAsDraft}
                  disabled={formLoading || !canCreateInvoice || (isQuoteFlow && !canUseQuotes)}>
                  {formLoading ? "Saving..." : "Save as Draft"}
                </Button>
                <Button
                  type="button"
                  onClick={handleSendInvoice}
                  disabled={formLoading || !canCreateInvoice || (isQuoteFlow && !canUseQuotes)}>
                  <Send className="h-4 w-4 mr-2" />
                  {formLoading ? "Sending..." : isQuoteFlow ? "Send Quote" : "Send Invoice"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>

      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
            <DialogDescription>Create a new client without leaving the invoice form.</DialogDescription>
          </DialogHeader>

          <Form {...clientQuickCreateForm}>
            <form className="space-y-4" onSubmit={handleQuickCreateClient}>
              <FormField
                control={clientQuickCreateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Smith" {...field} disabled={isCreatingClient} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={clientQuickCreateForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" {...field} disabled={isCreatingClient} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={clientQuickCreateForm.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} disabled={isCreatingClient} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientQuickCreateForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+27 11 000 0000" {...field} disabled={isCreatingClient} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    clientQuickCreateForm.reset();
                    setIsClientDialogOpen(false);
                  }}
                  disabled={isCreatingClient}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingClient}>
                  {isCreatingClient ? "Creating..." : "Create Client"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </CreateView>
  );
};
