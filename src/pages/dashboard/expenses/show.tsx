import { useState } from "react";
import { useShow, useDelete, useNavigation } from "@refinedev/core";
import { format } from "date-fns";
import { Calendar, CreditCard, DollarSign, FileText, Mail, Printer, Tag, User } from "lucide-react";
import { toast } from "sonner";

import { ShowView, ShowViewHeader } from "@/components/refine-ui/views/show-view";
import { LoadingOverlay } from "@/components/refine-ui/layout/loading-overlay";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { ListButton } from "@/components/refine-ui/buttons/list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import type { Expense, ExpenseCategory, ExpenseStatus } from "@/types";
import { getCurrencySymbol } from "@/types";
import { Trash2 } from "lucide-react";
import { getProfileBridgeSnapshot } from "@/lib/profile-bridge";
import { downloadExpenseReceiptPDF } from "@/lib/pdf-generator";
import { sendExpenseReceiptEmail } from "@/services/expense-email.service";

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  "Pay Client": "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  "Pay Salary": "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  Subscription: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "Operating Cost": "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  Other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const STATUS_COLORS: Record<ExpenseStatus, string> = {
  Paid: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  "Pay Client": "💸",
  "Pay Salary": "👤",
  Subscription: "🔄",
  "Operating Cost": "🏢",
  Other: "📋",
};

// ─── Field Row ──────────────────────────────────────────────────────────────────

function FieldRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex-shrink-0 mt-0.5 p-2 rounded-lg bg-muted text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="font-medium">{children}</div>
      </div>
    </div>
  );
}

// ─── Show Page ─────────────────────────────────────────────────────────────────

export function ExpenseShowPage() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { query } = useShow<Expense>();
  const expense = query.data?.data;

  const { mutate: deleteExpense } = useDelete();
  const { list } = useNavigation();
  const [isSending, setIsSending] = useState(false);
  const businessProfile = getProfileBridgeSnapshot().profile;

  const symbol = getCurrencySymbol(expense?.currency ?? "ZAR");

  function handleDelete() {
    if (!expense) return;
    deleteExpense(
      { resource: "expenses", id: expense.id },
      {
        onSuccess: () => {
          list("expenses");
        },
      },
    );
  }

  async function handleDownloadReceipt() {
    if (!expense) return;
    await downloadExpenseReceiptPDF(expense, businessProfile || undefined);
  }

  async function handleSendReceipt() {
    if (!expense) return;
    const recipientEmail = expense.recipient_email || expense.recipientEmail;
    if (!recipientEmail) {
      toast.error("Recipient email is required", {
        description: "Add an email address to this expense before sending the receipt.",
      });
      return;
    }

    try {
      setIsSending(true);
      await sendExpenseReceiptEmail({
        expense,
        businessProfile: businessProfile || undefined,
        recipientEmail,
        recipientName: expense.recipient,
        includeAttachment: true,
      });
      toast.success("Receipt email sent");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send receipt email.";
      toast.error("Could not send receipt", { description: message });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <ShowView>
        <ShowViewHeader title="Expense Details">
          <ListButton resource="expenses" />
          <EditButton resource="expenses" recordItemId={expense?.id} />
          <Button variant="outline" size="sm" onClick={handleSendReceipt} disabled={!expense || isSending}>
            <Mail className="h-4 w-4 mr-2" />
            {isSending ? "Sending..." : "Send Email"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadReceipt} disabled={!expense}>
            <Printer className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} disabled={!expense}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </ShowViewHeader>

        <LoadingOverlay loading={query.isLoading}>
          {expense && (
            <div className="space-y-6">
              {/* Status & Category Header */}
              <Card>
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={`${CATEGORY_COLORS[expense.category]} border-0 text-sm font-semibold px-3 py-1`}>
                      {CATEGORY_ICONS[expense.category]} {expense.category}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={`${STATUS_COLORS[expense.status]} border-0 text-sm font-semibold px-3 py-1`}>
                      {expense.status}
                    </Badge>
                    {expense.vatApplicable ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 text-sm font-semibold px-3 py-1">
                        VAT Applicable
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-0 text-sm px-3 py-1">
                        No VAT
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Core Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense Details</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border px-6">
                  <FieldRow icon={<User className="h-4 w-4" />} label="Recipient">
                    {expense.recipient}
                  </FieldRow>

                  {(expense.recipient_company || expense.recipientCompany) && (
                    <FieldRow icon={<User className="h-4 w-4" />} label="Company / Department">
                      {expense.recipient_company || expense.recipientCompany}
                    </FieldRow>
                  )}

                  {(expense.recipient_email || expense.recipientEmail) && (
                    <FieldRow icon={<Mail className="h-4 w-4" />} label="Email">
                      {expense.recipient_email || expense.recipientEmail}
                    </FieldRow>
                  )}

                  {(expense.recipient_phone || expense.recipientPhone) && (
                    <FieldRow icon={<User className="h-4 w-4" />} label="Phone">
                      {expense.recipient_phone || expense.recipientPhone}
                    </FieldRow>
                  )}

                  <FieldRow icon={<DollarSign className="h-4 w-4" />} label="Amount">
                    <span className="text-lg font-bold tabular-nums">
                      {symbol}
                      {expense.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-sm font-normal text-muted-foreground">{expense.currency}</span>
                    </span>
                  </FieldRow>

                  <FieldRow icon={<Tag className="h-4 w-4" />} label="Category">
                    <Badge variant="secondary" className={`${CATEGORY_COLORS[expense.category]} border-0`}>
                      {CATEGORY_ICONS[expense.category]} {expense.category}
                    </Badge>
                  </FieldRow>

                  <FieldRow icon={<CreditCard className="h-4 w-4" />} label="Payment Method">
                    {expense.paymentMethod}
                  </FieldRow>

                  <FieldRow icon={<Calendar className="h-4 w-4" />} label="Date">
                    {format(new Date(expense.date), "MMMM dd, yyyy")}
                  </FieldRow>
                </CardContent>
              </Card>

              {/* Notes */}
              {expense.notes && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {expense.notes}
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Summary Footer */}
              <Card className="bg-muted/30">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold tabular-nums mt-0.5">
                        {symbol}
                        {expense.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{expense.currency}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="secondary"
                        className={`${STATUS_COLORS[expense.status]} border-0 text-base font-semibold px-4 py-1.5`}>
                        {expense.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </LoadingOverlay>
      </ShowView>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the expense for <strong>{expense?.recipient}</strong> ({expense?.category})
              dated {expense?.date ? format(new Date(expense.date), "MMM dd, yyyy") : ""}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={false}>
              {"Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
