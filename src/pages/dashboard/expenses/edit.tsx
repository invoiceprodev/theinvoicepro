import React from "react";
import { type HttpError, useBack } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { EditView } from "@/components/refine-ui/views/edit-view";
import { LoadingOverlay } from "@/components/refine-ui/layout/loading-overlay";
import type { Expense } from "@/types";

const expenseFormSchema = z.object({
  category: z.enum(["Pay Client", "Pay Salary", "Subscription", "Operating Cost", "Other"], {
    required_error: "Category is required",
  }),
  recipient: z.string().min(1, { message: "Recipient is required" }),
  recipientEmail: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  recipientPhone: z.string().optional(),
  recipientCompany: z.string().optional(),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .positive({ message: "Amount must be greater than 0" }),
  currency: z.enum(["ZAR", "USD", "EUR"]),
  paymentMethod: z.enum(["Bank Transfer", "Cash", "Card", "EFT"], {
    required_error: "Payment method is required",
  }),
  date: z.string().min(1, { message: "Date is required" }),
  status: z.enum(["Pending", "Paid", "Cancelled"]),
  notes: z.string().optional(),
  vatApplicable: z.boolean(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const ExpenseEditPage: React.FC = () => {
  const back = useBack();

  const {
    refineCore: { onFinish, formLoading, query },
    ...form
  } = useForm<Expense, HttpError, ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: undefined,
      recipient: "",
      recipientEmail: "",
      recipientPhone: "",
      recipientCompany: "",
      amount: undefined,
      currency: "ZAR",
      paymentMethod: undefined,
      date: "",
      status: "Pending",
      notes: "",
      vatApplicable: false,
    },
    refineCoreProps: {
      resource: "expenses",
      action: "edit",
      redirect: "list",
    },
  });

  const isLoading = formLoading || query?.isLoading;

  React.useEffect(() => {
    const record = query?.data?.data as Expense | undefined;
    if (!record) return;
    form.reset({
      category: record.category,
      recipient: record.recipient,
      recipientEmail: record.recipient_email || record.recipientEmail || "",
      recipientPhone: record.recipient_phone || record.recipientPhone || "",
      recipientCompany: record.recipient_company || record.recipientCompany || "",
      amount: record.amount,
      currency: record.currency,
      paymentMethod: record.payment_method || record.paymentMethod || "Bank Transfer",
      date: record.date,
      status: record.status,
      notes: record.notes || "",
      vatApplicable: Boolean(record.vat_applicable ?? record.vatApplicable),
    });
  }, [form, query?.data?.data]);

  function onSubmit(values: ExpenseFormValues) {
    onFinish({
      ...values,
      recipient_email: values.recipientEmail || "",
      recipient_phone: values.recipientPhone || "",
      recipient_company: values.recipientCompany || "",
    } as any);
  }

  const selectedCategory = form.watch("category");
  const recipientLabel = selectedCategory === "Pay Salary" ? "Employee" : selectedCategory === "Pay Client" ? "Client" : "Recipient";

  return (
    <EditView>
      <LoadingOverlay loading={isLoading}>
        <div className="px-4 py-6 max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Edit Expense</h1>
            <p className="text-sm text-muted-foreground">Update this expense record</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Core Details */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold">Expense Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pay Client">Pay Client</SelectItem>
                            <SelectItem value="Pay Salary">Pay Salary</SelectItem>
                            <SelectItem value="Subscription">Subscription</SelectItem>
                            <SelectItem value="Operating Cost">Operating Cost</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                  control={form.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{recipientLabel} Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. John Doe, Acme Corp" {...field} />
                      </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                />
              </div>
            </div>

            {(selectedCategory === "Pay Client" || selectedCategory === "Pay Salary") && (
              <>
                <Separator />

                <div className="space-y-4">
                  <h2 className="text-base font-semibold">
                    {selectedCategory === "Pay Salary" ? "Employee Details" : "Client Details"}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="recipientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="name@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recipientPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+27 11 000 0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recipientCompany"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>{selectedCategory === "Pay Salary" ? "Department / Company" : "Company"}</FormLabel>
                          <FormControl>
                            <Input placeholder={selectedCategory === "Pay Salary" ? "Operations" : "Acme Corp"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </>
            )}

              <Separator />

              {/* Amount & Payment */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold">Amount & Payment</h2>

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          type="single"
                          value={field.value}
                          onValueChange={(val) => {
                            if (val) field.onChange(val);
                          }}
                          className="justify-start gap-2">
                          <ToggleGroupItem
                            value="ZAR"
                            className="px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                            ZAR (R)
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="USD"
                            className="px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                            USD ($)
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="EUR"
                            className="px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                            EUR (€)
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Card">Card</SelectItem>
                            <SelectItem value="EFT">EFT</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Additional */}
              <div className="space-y-4">
                <h2 className="text-base font-semibold">Additional</h2>

                <FormField
                  control={form.control}
                  name="vatApplicable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 max-w-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">VAT Applicable</FormLabel>
                        <p className="text-sm text-muted-foreground">Does this expense include VAT?</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes or reference details..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => back()} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </LoadingOverlay>
    </EditView>
  );
};
