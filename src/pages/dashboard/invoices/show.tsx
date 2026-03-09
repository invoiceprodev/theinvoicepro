import { useState } from "react";
import { useShow, useOne, useList, useUpdate, useInvalidate } from "@refinedev/core";
import { format } from "date-fns";
import { Printer, CheckCircle, Send } from "lucide-react";
import { toast } from "sonner";

import { ShowView, ShowViewHeader } from "@/components/refine-ui/views/show-view";
import { LoadingOverlay } from "@/components/refine-ui/layout/loading-overlay";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { ListButton } from "@/components/refine-ui/buttons/list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { Invoice, Client, LineItem } from "@/types";
import { formatInvoiceStatus, getCurrencySymbol, normalizeInvoiceStatus } from "@/types";
import { useSendInvoiceEmail } from "@/hooks/use-send-invoice-email";
import { useSubscriptionState } from "@/hooks/use-subscription-state";
import { getPlanEntitlements } from "@/lib/plan-entitlements";
import { downloadInvoicePDF } from "@/lib/pdf-generator";
import { getProfileBridgeSnapshot } from "@/lib/profile-bridge";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  paid: "bg-green-500",
  overdue: "bg-red-500",
  pending: "bg-amber-500",
};

export function InvoiceShowPage() {
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);

  const { query } = useShow<Invoice>();
  const invoice = query.data?.data;
  const businessProfile = getProfileBridgeSnapshot().profile;

  const { mutate: updateInvoice, mutation: updateMutation } = useUpdate<Invoice>();
  const isUpdating = updateMutation?.isPending || false;
  const invalidate = useInvalidate();
  const invoiceStatus = normalizeInvoiceStatus(invoice?.status);
  const { subscription } = useSubscriptionState();
  const entitlements = getPlanEntitlements(subscription?.plan);

  const { query: clientQuery } = useOne<Client>({
    resource: "clients",
    id: invoice?.client_id || invoice?.clientId || "",
    queryOptions: { enabled: !!(invoice?.client_id || invoice?.clientId) },
  });
  const client = clientQuery.data?.data;

  const { query: lineItemsQuery } = useList<LineItem>({
    resource: "invoice_items",
    filters: [{ field: "invoice_id", operator: "eq", value: invoice?.id }],
    queryOptions: { enabled: !!invoice?.id },
  });
  const lineItems = lineItemsQuery.data?.data || [];
  const invoiceWithClient = invoice && client ? { ...invoice, client } : invoice;
  const { sendEmail, isSending } = useSendInvoiceEmail({
    invoice: invoiceWithClient as Invoice,
    onSuccess: () => {
      toast.success("Invoice email sent successfully");
    },
    onError: (error) => {
      toast.error("Failed to send invoice", { description: error.message });
    },
  });

  const isLoading = query.isLoading || clientQuery.isLoading || lineItemsQuery.isLoading;

  const symbol = getCurrencySymbol(invoice?.currency || "ZAR");
  const isQuote = String(invoice?.invoice_number || "").toUpperCase().startsWith("QUO-");
  const documentLabel = isQuote ? "Quote" : "Invoice";

  const discountType = (invoice as any)?.discountType || "percentage";
  const discountValue = Number((invoice as any)?.discount) || 0;
  const discountAmount =
    discountValue > 0
      ? discountType === "percentage"
        ? (invoice!.subtotal * discountValue) / 100
        : Math.min(discountValue, invoice!.subtotal)
      : 0;

  function handleMarkAsPaid() {
    if (!invoice) return;
    updateInvoice(
      { resource: "invoices", id: invoice.id, values: { ...invoice, status: "paid" } },
      {
        onSuccess: () => {
          invalidate({ resource: "invoices", invalidates: ["list", "detail"] });
          setShowMarkPaidDialog(false);
        },
      },
    );
  }

  async function handleDownloadPDF() {
    if (!invoice) return;

    await downloadInvoicePDF(invoice, businessProfile || undefined, {
      includePlatformBranding: !entitlements.removeBranding,
    });
  }

  async function handleSendInvoice() {
    if (!invoice || !client) {
      toast.error("Client email is required before sending this invoice.");
      return;
    }

    await sendEmail({
      recipientEmail: client.email,
      recipientName: client.name,
      includeAttachment: true,
    });

    if (invoiceStatus === "draft" || invoiceStatus === "pending") {
      updateInvoice(
        { resource: "invoices", id: invoice.id, values: { ...invoice, status: "sent" } },
        {
          onSuccess: () => {
            invalidate({ resource: "invoices", invalidates: ["list", "detail"] });
          },
        },
      );
    }
  }

  return (
    <>
      <ShowView>
        <ShowViewHeader title={invoice?.invoice_number || `${documentLabel} Details`}>
          <ListButton resource="invoices" />
          <Button variant="outline" size="sm" onClick={handleSendInvoice} disabled={!invoice || !client || isSending}>
            <Send className="h-4 w-4 mr-2" />
            {isSending ? "Sending..." : isQuote ? "Send Quote" : "Send Email"}
          </Button>
          {invoiceStatus !== "paid" && (
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={() => setShowMarkPaidDialog(true)}
              disabled={isUpdating}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Printer className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <EditButton resource="invoices" recordItemId={invoice?.id} />
        </ShowViewHeader>

        <LoadingOverlay loading={isLoading}>
          {invoice && (
            <div className="space-y-6">
              {/* Header Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {businessProfile?.logo_url ? (
                        <img
                          src={businessProfile.logo_url}
                          alt={businessProfile.company_name || "Company logo"}
                          className="h-10 w-10 rounded-md border border-border bg-background object-contain"
                        />
                      ) : null}
                      <div>
                        <CardTitle className="text-2xl">{invoice.invoice_number}</CardTitle>
                        {businessProfile?.company_name ? (
                          <p className="text-sm text-muted-foreground">{businessProfile.company_name}</p>
                        ) : null}
                      </div>
                    </div>
                    <Badge className={`${statusColors[invoiceStatus]} text-white`}>{formatInvoiceStatus(invoiceStatus)}</Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Client Details Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{client.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Company</p>
                        <p className="font-medium">{client.company}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{client.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{client.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{client.address}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Client information not available</p>
                  )}
                </CardContent>
              </Card>

              {/* Invoice Dates Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Dates</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Date</p>
                    <p className="font-medium">{format(new Date(invoice.invoice_date), "MMMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-bold text-base">{format(new Date(invoice.due_date), "MMMM dd, yyyy")}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {lineItems.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map((item: LineItem) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {symbol}
                              {(item.unit_price ?? item.unitPrice ?? 0).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              {symbol}
                              {item.total.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground">No line items found</p>
                  )}

                  <Separator className="my-4" />

                  {/* Totals Section */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">
                          {symbol}
                          {invoice.subtotal.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Discount{discountType === "percentage" ? ` (${discountValue}%)` : ""}
                          </span>
                          <span className="text-destructive font-medium">
                            -{symbol}
                            {discountAmount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total</span>
                        <span>
                          {symbol}
                          {invoice.total.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes Section */}
              {invoice.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{invoice.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </LoadingOverlay>
      </ShowView>

      {/* Mark as Paid Confirmation Dialog */}
      <AlertDialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Invoice as Paid?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update invoice <strong>{invoice?.invoice_number}</strong> status to <strong>Paid</strong>. This
              action can be reversed by editing the invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAsPaid} className="bg-green-600 hover:bg-green-700 text-white">
              {isUpdating ? "Updating..." : "Mark as Paid"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
