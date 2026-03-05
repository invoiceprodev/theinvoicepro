import { useOne, useUpdate, useDelete } from "@refinedev/core";
import { useParams, useNavigate } from "react-router";
import { ShowView, ShowViewHeader } from "@/components/refine-ui/views/show-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Printer, CheckCircle, Send, Download, Eye, Loader2, Mail } from "lucide-react";
import type { Invoice, Profile } from "@/types";
import { downloadInvoicePDF, previewInvoicePDF } from "@/lib/pdf-generator";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useSendInvoiceEmail } from "@/hooks/use-send-invoice-email";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function InvoiceShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const { query } = useOne<Invoice>({
    resource: "invoices",
    id: id!,
    meta: {
      select: "*, items:invoice_items(*), client:clients(*)",
    },
  });

  // Fetch business profile for PDF generation
  const { query: profileQuery } = useOne<Profile>({
    resource: "profiles",
    id: user?.id || "",
    queryOptions: {
      enabled: !!user?.id,
    },
  });

  const { mutate: updateInvoice } = useUpdate();
  const { mutate: deleteInvoice } = useDelete();

  const invoice = query.data?.data;
  const businessProfile = profileQuery.data?.data;
  const isLoading = query.isLoading;

  // Email sending hook
  const {
    sendEmail,
    isSending: isSendingEmail,
    isConfigured,
  } = useSendInvoiceEmail({
    invoice: invoice!,
    onSuccess: () => {
      toast.success("Invoice sent successfully!", {
        description: `Email sent to ${invoice?.client?.email}`,
      });
      // Update invoice status to "sent" if it was "draft"
      if (invoice?.status === "draft") {
        handleStatusUpdate("sent");
      }
    },
    onError: (error) => {
      toast.error("Failed to send invoice", {
        description: error.message,
      });
    },
  });

  const handleStatusUpdate = (status: string) => {
    if (!invoice) return;

    updateInvoice(
      {
        resource: "invoices",
        id: invoice.id,
        values: { status },
      },
      {
        onSuccess: () => {
          query.refetch();
        },
      },
    );
  };

  const handleDelete = () => {
    if (!invoice) return;

    deleteInvoice(
      {
        resource: "invoices",
        id: invoice.id,
      },
      {
        onSuccess: () => {
          navigate("/invoices");
        },
      },
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    setGeneratingPDF(true);
    try {
      await downloadInvoicePDF(invoice, businessProfile);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handlePreviewPDF = async () => {
    if (!invoice) return;
    setGeneratingPDF(true);
    try {
      await previewInvoicePDF(invoice, businessProfile);
    } catch (error) {
      console.error("Error previewing PDF:", error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice?.client?.email) {
      toast.error("Cannot send invoice", {
        description: "Client email is required to send invoice",
      });
      return;
    }

    await sendEmail();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      draft: { label: "Draft", variant: "secondary" },
      sent: { label: "Sent", variant: "default" },
      paid: { label: "Paid", variant: "default" },
      pending: { label: "Pending", variant: "outline" },
      overdue: { label: "Overdue", variant: "destructive" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading || !invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ShowView>
      <ShowViewHeader title={`Invoice ${invoice.invoice_number}`}>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>

          {isConfigured && invoice.client?.email && (
            <Button variant="default" size="sm" onClick={handleSendInvoice} disabled={isSendingEmail}>
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invoice
                </>
              )}
            </Button>
          )}

          {invoice.status !== "paid" && (
            <Button variant="outline" size="sm" onClick={() => handleStatusUpdate("paid")}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Paid
            </Button>
          )}

          {invoice.status === "draft" && (
            <Button variant="outline" size="sm" onClick={() => handleStatusUpdate("sent")}>
              <Send className="w-4 h-4 mr-2" />
              Mark as Sent
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handlePreviewPDF} disabled={generatingPDF}>
            <Eye className="w-4 h-4 mr-2" />
            Preview PDF
          </Button>

          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={generatingPDF}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>

          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the invoice.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </ShowViewHeader>

      <div className="space-y-6">
        {/* Invoice Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">Invoice {invoice.invoice_number}</CardTitle>
                <CardDescription className="mt-2">
                  Invoice Date: {new Date(invoice.invoice_date).toLocaleDateString()}
                  <br />
                  Due Date: {new Date(invoice.due_date).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="text-right">
                {getStatusBadge(invoice.status)}
                <div className="text-3xl font-bold mt-2">{formatCurrency(invoice.total)}</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm font-medium">Name</div>
              <div className="text-sm text-muted-foreground">{invoice.client?.name || "N/A"}</div>
            </div>
            {invoice.client?.company && (
              <div>
                <div className="text-sm font-medium">Company</div>
                <div className="text-sm text-muted-foreground">{invoice.client.company}</div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium">Email</div>
              <div className="text-sm text-muted-foreground">{invoice.client?.email || "N/A"}</div>
            </div>
            {invoice.client?.phone && (
              <div>
                <div className="text-sm font-medium">Phone</div>
                <div className="text-sm text-muted-foreground">{invoice.client.phone}</div>
              </div>
            )}
            {invoice.client?.address && (
              <div>
                <div className="text-sm font-medium">Address</div>
                <div className="text-sm text-muted-foreground whitespace-pre-line">{invoice.client.address}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
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
                {invoice.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Separator className="my-4" />

            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({invoice.tax_percentage}%):</span>
                <span>{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ShowView>
  );
}
