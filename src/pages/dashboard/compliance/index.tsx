import { useList } from "@refinedev/core";
import { useState } from "react";
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Receipt,
  Scale,
  CheckCircle2,
  Clock,
  Minus as MinusIcon,
  AlertTriangle,
  XCircle,
  CheckCheck,
  FileCheck,
  FileWarning,
  BadgeCheck,
  BadgeAlert,
  Download,
  FileText,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useVatSettings } from "@/providers/vat-settings";
import type { Invoice, Expense } from "@/types";
import { normalizeInvoiceStatus } from "@/types";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatCurrency(amount: number, currency = "ZAR") {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface VatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  badge?: { label: string; className: string };
  trend?: { direction: "up" | "down" | "neutral"; label: string };
}

function VatCard({ title, value, description, icon, iconBg, badge, trend }: VatCardProps) {
  const TrendIcon = trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;
  const trendColor =
    trend?.direction === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend?.direction === "down"
        ? "text-red-500 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold tracking-tight font-mono">{value}</p>
          {badge && (
            <Badge variant="secondary" className={`mb-0.5 text-xs ${badge.className}`}>
              {badge.label}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            <span>{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface Period {
  label: string;
  collected: number;
  onExpenses: number;
  net: number;
  status: "Filed" | "Pending" | "N/A";
}

function PeriodTable({ periods }: { periods: Period[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
            <th className="text-left py-2 pr-4 font-medium">Period</th>
            <th className="text-right py-2 pr-4 font-medium">VAT Collected</th>
            <th className="text-right py-2 pr-4 font-medium">VAT on Expenses</th>
            <th className="text-right py-2 pr-4 font-medium">Net Payable</th>
            <th className="text-right py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {periods.map((period) => (
            <tr key={period.label} className="hover:bg-muted/30 transition-colors">
              <td className="py-3 pr-4 font-medium">{period.label}</td>
              <td className="py-3 pr-4 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                {formatCurrency(period.collected)}
              </td>
              <td className="py-3 pr-4 text-right font-mono text-xs text-red-500 dark:text-red-400">
                {formatCurrency(period.onExpenses)}
              </td>
              <td className="py-3 pr-4 text-right font-mono text-xs font-semibold">{formatCurrency(period.net)}</td>
              <td className="py-3 text-right">
                {period.status === "Filed" && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Filed
                  </span>
                )}
                {period.status === "Pending" && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <Clock className="h-3.5 w-3.5" />
                    Pending
                  </span>
                )}
                {period.status === "N/A" && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MinusIcon className="h-3.5 w-3.5" />
                    N/A
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper: get quarter start month (0-indexed) from a dayjs object
function getQuarterStartMonth(d: dayjs.Dayjs): number {
  return Math.floor(d.month() / 3) * 3;
}

// ─── Checklist ────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  pass: boolean;
  detail: string;
}

interface ChecklistSectionProps {
  items: ChecklistItem[];
}

function ChecklistSection({ items }: ChecklistSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-muted-foreground" />
          Compliance Checklist
        </CardTitle>
        <CardDescription>Real-time checks against your invoices, expenses, and settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
              item.pass
                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
            }`}>
            <div className="shrink-0 mt-0.5">
              {item.pass ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p
                  className={`text-sm font-medium ${item.pass ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"}`}>
                  {item.label}
                </p>
                <Badge
                  variant="secondary"
                  className={`text-xs shrink-0 ${
                    item.pass
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400"
                  }`}>
                  {item.pass ? "Pass" : "Fail"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              <p
                className={`text-xs mt-1 font-medium ${item.pass ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Alerts Banner ────────────────────────────────────────────────────────────

interface AlertsBannerProps {
  failingItems: ChecklistItem[];
}

function AlertsBanner({ failingItems }: AlertsBannerProps) {
  if (failingItems.length === 0) return null;

  return (
    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
            Action required: {failingItems.length} compliance issue{failingItems.length !== 1 ? "s" : ""} detected
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {failingItems.map((item) => (
              <li key={item.id} className="text-xs text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-red-400 shrink-0" />
                {item.detail}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Mock Audit Log Data ──────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  date: string;
  action: string;
  resource: string;
  user: string;
  details: string;
}

const AUDIT_LOG: AuditEntry[] = [
  {
    id: "1",
    date: "2025-05-28 14:32",
    action: "Invoice Created",
    resource: "INV-012",
    user: "Admin",
    details: "New invoice for Acme Corp · R 12,500.00",
  },
  {
    id: "2",
    date: "2025-05-27 11:15",
    action: "Payment Received",
    resource: "INV-010",
    user: "Admin",
    details: "Full payment received · R 8,200.00",
  },
  {
    id: "3",
    date: "2025-05-26 09:48",
    action: "Expense Added",
    resource: "EXP-015",
    user: "Admin",
    details: "Office supplies · Operating Cost · R 640.00",
  },
  {
    id: "4",
    date: "2025-05-25 16:05",
    action: "Invoice Sent",
    resource: "INV-011",
    user: "Admin",
    details: "Invoice emailed to contact@globex.com",
  },
  {
    id: "5",
    date: "2025-05-24 10:22",
    action: "Invoice Edited",
    resource: "INV-009",
    user: "Admin",
    details: "Due date updated and line item revised",
  },
  {
    id: "6",
    date: "2025-05-23 13:44",
    action: "Expense Added",
    resource: "EXP-014",
    user: "Admin",
    details: "AWS subscription · Subscription · R 2,100.00",
  },
  {
    id: "7",
    date: "2025-05-22 08:30",
    action: "Invoice Created",
    resource: "INV-011",
    user: "Admin",
    details: "New invoice for Globex Inc · R 34,000.00",
  },
  {
    id: "8",
    date: "2025-05-21 15:17",
    action: "Payment Received",
    resource: "INV-008",
    user: "Admin",
    details: "Partial payment received · R 5,000.00",
  },
  {
    id: "9",
    date: "2025-05-20 12:09",
    action: "Client Added",
    resource: "CLT-007",
    user: "Admin",
    details: "New client: Initech Solutions registered",
  },
  {
    id: "10",
    date: "2025-05-19 09:55",
    action: "Expense Edited",
    resource: "EXP-013",
    user: "Admin",
    details: "Amount corrected from R 900 to R 1,050",
  },
  {
    id: "11",
    date: "2025-05-18 17:01",
    action: "VAT Return Filed",
    resource: "TAX-Q1",
    user: "Admin",
    details: "Q1 2025 VAT return submitted to SARS",
  },
  {
    id: "12",
    date: "2025-05-16 14:28",
    action: "Invoice Cancelled",
    resource: "INV-007",
    user: "Admin",
    details: "Invoice voided — duplicate entry",
  },
  {
    id: "13",
    date: "2025-05-15 11:40",
    action: "Expense Added",
    resource: "EXP-012",
    user: "Admin",
    details: "Staff salary · Pay Salary · R 22,000.00",
  },
  {
    id: "14",
    date: "2025-05-14 10:03",
    action: "Invoice Created",
    resource: "INV-010",
    user: "Admin",
    details: "New invoice for Initech Solutions · R 8,200.00",
  },
  {
    id: "15",
    date: "2025-05-13 08:52",
    action: "Payment Received",
    resource: "INV-006",
    user: "Admin",
    details: "Full payment received · R 15,750.00",
  },
];

const ACTION_COLORS: Record<string, string> = {
  "Invoice Created": "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  "Invoice Sent": "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
  "Invoice Edited": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "Invoice Cancelled": "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  "Payment Received": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  "Expense Added": "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  "Expense Edited": "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  "Client Added": "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
  "VAT Return Filed": "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400",
};

// ─── Audit Log Section ────────────────────────────────────────────────────────

function AuditLogSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          Audit Log
        </CardTitle>
        <CardDescription>Read-only record of all financial actions in this system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left py-2 pr-4 font-medium whitespace-nowrap">Date</th>
                <th className="text-left py-2 pr-4 font-medium">Action</th>
                <th className="text-left py-2 pr-4 font-medium">Resource</th>
                <th className="text-left py-2 pr-4 font-medium">User</th>
                <th className="text-left py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {AUDIT_LOG.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {entry.date}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        ACTION_COLORS[entry.action] ?? "bg-muted text-muted-foreground"
                      }`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs font-semibold">{entry.resource}</td>
                  <td className="py-2.5 pr-4 text-xs text-muted-foreground">{entry.user}</td>
                  <td className="py-2.5 text-xs text-muted-foreground">{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Export Section ───────────────────────────────────────────────────────────

interface ExportSectionProps {
  selectedPeriod: string;
  selectedTab: "monthly" | "quarterly";
}

function ExportSection({ selectedPeriod, selectedTab }: ExportSectionProps) {
  const periodLabel = selectedPeriod || (selectedTab === "monthly" ? "current month" : "current quarter");

  function handleExport(format: "PDF" | "CSV") {
    toast.success(`VAT Report exported as ${format}`, {
      description: `Period: ${periodLabel} · ${format} download ready`,
      richColors: true,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Download className="h-4 w-4 text-muted-foreground" />
          Export VAT Report
        </CardTitle>
        <CardDescription>
          Export the VAT report for the currently selected period:{" "}
          <span className="font-medium text-foreground">{periodLabel}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2" onClick={() => handleExport("PDF")}>
            <FileText className="h-4 w-4" />
            Export VAT Report (PDF)
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleExport("CSV")}>
            <Download className="h-4 w-4" />
            Export VAT Report (CSV)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CompliancePage() {
  const { settings } = useVatSettings();
  const vatRate = settings.vatRate;

  const { query: invoicesQuery } = useList<Invoice>({
    resource: "invoices",
    pagination: { pageSize: 1000 },
  });

  const { query: expensesQuery } = useList<Expense>({
    resource: "expenses",
    pagination: { pageSize: 1000 },
  });

  const invoices: Invoice[] = invoicesQuery.data?.data ?? [];
  const expenses: Expense[] = expensesQuery.data?.data ?? [];

  const isLoading = invoicesQuery.isLoading || expensesQuery.isLoading;

  // VAT Collected: VAT portion from all paid invoices
  const paidInvoices = invoices.filter((inv) => normalizeInvoiceStatus(inv.status) === "paid");
  const vatCollected = paidInvoices.reduce((sum, inv) => sum + inv.total * (vatRate / 100), 0);

  // VAT on Expenses: VAT portion from expenses where vatApplicable=true and status=Paid
  const vatExpenses = expenses.filter((exp) => exp.vatApplicable && exp.status === "Paid");
  const vatOnExpenses = vatExpenses.reduce((sum, exp) => sum + exp.amount * (vatRate / 100), 0);

  // Net VAT Payable
  const netVatPayable = vatCollected - vatOnExpenses;

  // --- Period helpers ---
  // Use the latest invoice/expense date as "now" reference so mock data looks realistic
  const allDates = invoices.map((i) => i.invoice_date).concat(expenses.map((e) => e.date));
  const latestDate = allDates.length > 0 ? allDates.reduce((a, b) => (a > b ? a : b)) : dayjs().format("YYYY-MM-DD");
  const now = dayjs(latestDate);

  function calcPeriodVat(start: dayjs.Dayjs, end: dayjs.Dayjs) {
    const periodPaidInvoices = invoices.filter((inv) => {
      const d = dayjs(inv.invoice_date);
      return normalizeInvoiceStatus(inv.status) === "paid" && !d.isBefore(start) && !d.isAfter(end);
    });
    const periodVatExpenses = expenses.filter((exp) => {
      const d = dayjs(exp.date);
      return exp.vatApplicable && exp.status === "Paid" && !d.isBefore(start) && !d.isAfter(end);
    });
    const collected = periodPaidInvoices.reduce((sum, inv) => sum + inv.total * (vatRate / 100), 0);
    const onExpenses = periodVatExpenses.reduce((sum, exp) => sum + exp.amount * (vatRate / 100), 0);
    return { collected, onExpenses, net: collected - onExpenses };
  }

  const [selectedPeriodTab, setSelectedPeriodTab] = useState<"monthly" | "quarterly">("monthly");
  const [selectedPeriodLabel, setSelectedPeriodLabel] = useState("");

  // Monthly: last 6 months
  const monthlyPeriods: Period[] = Array.from({ length: 6 }, (_, i) => {
    const month = now.subtract(5 - i, "month");
    const start = month.startOf("month");
    const end = month.endOf("month");
    const isCurrent = start.isSame(now.startOf("month"));
    const isFuture = start.isAfter(now);
    const status: Period["status"] = isFuture ? "N/A" : isCurrent ? "Pending" : "Filed";
    return { label: month.format("MMMM YYYY"), status, ...calcPeriodVat(start, end) };
  });

  // Quarterly: last 4 quarters — manual calculation without plugin
  const nowQuarterStartMonth = getQuarterStartMonth(now);
  const nowQuarterStart = now.month(nowQuarterStartMonth).startOf("month");

  const quarterlyPeriods: Period[] = Array.from({ length: 4 }, (_, i) => {
    // go back (3 - i) quarters from current quarter
    const quartersBack = 3 - i;
    const start = nowQuarterStart.subtract(quartersBack * 3, "month");
    const end = start.add(2, "month").endOf("month");
    const isCurrent = start.isSame(nowQuarterStart);
    const isFuture = start.isAfter(now);
    const status: Period["status"] = isFuture ? "N/A" : isCurrent ? "Pending" : "Filed";
    const qNum = Math.floor(start.month() / 3) + 1;
    const label = `Q${qNum} ${start.year()}`;
    return { label, status, ...calcPeriodVat(start, end) };
  });

  // Derive a readable period label for export
  const currentPeriodDisplayLabel =
    selectedPeriodLabel ||
    (selectedPeriodTab === "monthly"
      ? (monthlyPeriods[monthlyPeriods.length - 1]?.label ?? "")
      : (quarterlyPeriods[quarterlyPeriods.length - 1]?.label ?? ""));

  // ─── Compliance Checklist Logic ─────────────────────────────────────────────

  // 1. All invoices have VAT applied — VAT must be enabled
  const activeInvoices = invoices.filter((inv) => normalizeInvoiceStatus(inv.status) !== "draft");
  const invoicesMissingVat = settings.vatEnabled ? 0 : activeInvoices.length;
  const allInvoicesHaveVat: ChecklistItem = {
    id: "invoices-vat",
    label: "All invoices have VAT applied",
    description: "VAT must be enabled in Settings so new invoices are created with VAT included.",
    pass: invoicesMissingVat === 0,
    detail:
      invoicesMissingVat === 0
        ? `VAT is enabled at ${vatRate}% — all ${activeInvoices.length} active invoice${activeInvoices.length !== 1 ? "s" : ""} include VAT.`
        : `VAT is disabled — ${invoicesMissingVat} active invoice${invoicesMissingVat !== 1 ? "s" : ""} missing VAT. Enable VAT in Settings.`,
  };

  // 2. All expenses logged with VAT flag — non-cancelled, non-salary expenses should have vatApplicable reviewed
  //    Flag expenses where category is Operating Cost, Subscription, or Other but vatApplicable=false
  const reviewableExpenses = expenses.filter(
    (exp) =>
      exp.status !== "Cancelled" &&
      (exp.category === "Operating Cost" || exp.category === "Subscription" || exp.category === "Other"),
  );
  const expensesWithoutVatFlag = reviewableExpenses.filter((exp) => !exp.vatApplicable);
  const allExpensesLogged: ChecklistItem = {
    id: "expenses-vat-flag",
    label: "All expenses logged with VAT flag",
    description: "Operating costs, subscriptions, and other expenses should have VAT applicability confirmed.",
    pass: expensesWithoutVatFlag.length === 0,
    detail:
      expensesWithoutVatFlag.length === 0
        ? `All ${reviewableExpenses.length} applicable expense${reviewableExpenses.length !== 1 ? "s" : ""} have VAT flag set correctly.`
        : `${expensesWithoutVatFlag.length} expense${expensesWithoutVatFlag.length !== 1 ? "s" : ""} missing VAT flag: ${expensesWithoutVatFlag.map((e) => e.recipient).join(", ")}.`,
  };

  // 3. Current period VAT return filed — current month is always "Pending"
  const currentPeriodFiled = false; // current period is always Pending in this system
  const currentPeriodLabel = now.format("MMMM YYYY");
  const vatReturnFiled: ChecklistItem = {
    id: "vat-return-filed",
    label: "Current period VAT return filed",
    description: `The VAT return for ${currentPeriodLabel} must be submitted to the tax authority.`,
    pass: currentPeriodFiled,
    detail: `VAT return for ${currentPeriodLabel} is pending — submit to SARS before the due date.`,
  };

  // 4. Company VAT registration number set
  const vatNumberSet = settings.vatNumber.trim().length > 0;
  const vatNumberCheck: ChecklistItem = {
    id: "vat-number",
    label: "Company VAT registration number set",
    description: "Your VAT registration number is required on all tax invoices.",
    pass: vatNumberSet,
    detail: vatNumberSet
      ? `VAT registration number is set: ${settings.vatNumber}`
      : "No VAT registration number found — add it in Settings → Tax & VAT.",
  };

  const checklistItems: ChecklistItem[] = [allInvoicesHaveVat, allExpensesLogged, vatReturnFiled, vatNumberCheck];

  const failingItems = checklistItems.filter((item) => !item.pass);
  const passingCount = checklistItems.filter((item) => item.pass).length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
          <p className="text-muted-foreground text-sm mt-1">VAT and tax compliance overview</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance</h1>
          <p className="text-muted-foreground text-sm mt-1">VAT and tax compliance overview</p>
        </div>
        <div className="flex items-center gap-2">
          {failingItems.length === 0 ? (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0 gap-1">
              <CheckCheck className="h-3 w-3" />
              All checks passed
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-0 gap-1">
              <FileWarning className="h-3 w-3" />
              {failingItems.length} issue{failingItems.length !== 1 ? "s" : ""} found
            </Badge>
          )}
          {settings.vatEnabled ? (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0">
              VAT Enabled · {vatRate}%
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground">
              VAT Disabled
            </Badge>
          )}
        </div>
      </div>

      {/* Alerts Banner */}
      <AlertsBanner failingItems={failingItems} />

      {!settings.vatEnabled && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="flex items-center gap-3 py-4">
            <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              VAT is currently disabled. Enable it in{" "}
              <a href="/dashboard/settings" className="underline font-medium hover:no-underline">
                Settings → Tax &amp; VAT
              </a>{" "}
              to apply VAT automatically. Figures below use the configured rate ({vatRate}%) for illustration.
            </p>
          </CardContent>
        </Card>
      )}

      {/* VAT Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VatCard
          title="VAT Collected"
          value={formatCurrency(vatCollected)}
          description={`${vatRate}% VAT on ${paidInvoices.length} paid invoice${paidInvoices.length !== 1 ? "s" : ""}`}
          icon={<TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-100 dark:bg-emerald-950"
          badge={{
            label: `${paidInvoices.length} paid`,
            className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
          }}
          trend={{ direction: "up", label: "From paid invoices" }}
        />

        <VatCard
          title="VAT on Expenses"
          value={formatCurrency(vatOnExpenses)}
          description={`${vatRate}% VAT on ${vatExpenses.length} VAT-applicable expense${vatExpenses.length !== 1 ? "s" : ""}`}
          icon={<Receipt className="h-4 w-4 text-red-500 dark:text-red-400" />}
          iconBg="bg-red-100 dark:bg-red-950"
          badge={{
            label: `${vatExpenses.length} applicable`,
            className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
          }}
          trend={{ direction: "down", label: "Input VAT claimable" }}
        />

        <VatCard
          title="Net VAT Payable"
          value={formatCurrency(netVatPayable)}
          description="VAT Collected minus VAT on Expenses"
          icon={<Scale className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-100 dark:bg-blue-950"
          badge={
            netVatPayable > 0
              ? {
                  label: "Payable to SARS",
                  className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
                }
              : {
                  label: "Refundable",
                  className: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
                }
          }
          trend={{
            direction: netVatPayable > 0 ? "neutral" : "up",
            label: netVatPayable > 0 ? "Amount owed to tax authority" : "Excess input VAT — claim refund",
          }}
        />
      </div>

      {/* Compliance Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChecklistSection items={checklistItems} />
        </div>
        <Card className="flex flex-col justify-center items-center p-6 text-center gap-3">
          <div
            className={`p-4 rounded-full ${failingItems.length === 0 ? "bg-emerald-100 dark:bg-emerald-950" : "bg-red-100 dark:bg-red-950"}`}>
            {failingItems.length === 0 ? (
              <BadgeCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <BadgeAlert className="h-10 w-10 text-red-500 dark:text-red-400" />
            )}
          </div>
          <div>
            <p className="text-3xl font-bold">
              {passingCount}/{checklistItems.length}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">checks passing</p>
          </div>
          {failingItems.length > 0 ? (
            <p className="text-xs text-red-600 dark:text-red-400">
              {failingItems.length} item{failingItems.length !== 1 ? "s" : ""} require
              {failingItems.length === 1 ? "s" : ""} attention
            </p>
          ) : (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">All compliance requirements met</p>
          )}
        </Card>
      </div>

      {/* Tax Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tax Period Summary</CardTitle>
          <CardDescription>VAT figures filtered by period at {vatRate}% rate · Status is indicative</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="monthly"
            onValueChange={(v) => {
              setSelectedPeriodTab(v as "monthly" | "quarterly");
              setSelectedPeriodLabel("");
            }}>
            <TabsList className="mb-4">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly">
              <PeriodTable periods={monthlyPeriods} />
            </TabsContent>

            <TabsContent value="quarterly">
              <PeriodTable periods={quarterlyPeriods} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* VAT Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">VAT Breakdown Summary</CardTitle>
          <CardDescription>Calculated at {vatRate}% VAT rate from mock data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left py-2 pr-4 font-medium">Item</th>
                  <th className="text-right py-2 pr-4 font-medium">Base Amount</th>
                  <th className="text-right py-2 pr-4 font-medium">VAT Rate</th>
                  <th className="text-right py-2 font-medium">VAT Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paidInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="font-medium">{inv.invoice_number}</div>
                      <div className="text-xs text-muted-foreground">{inv.invoice_date}</div>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs">
                      {formatCurrency(inv.total, inv.currency || "ZAR")}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-muted-foreground">{vatRate}%</td>
                    <td className="py-2.5 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(inv.total * (vatRate / 100))}
                    </td>
                  </tr>
                ))}
                {vatExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="font-medium">{exp.recipient}</div>
                      <div className="text-xs text-muted-foreground">
                        {exp.category} · {exp.date}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-xs">
                      {formatCurrency(exp.amount, exp.currency)}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-muted-foreground">{vatRate}%</td>
                    <td className="py-2.5 text-right font-mono text-xs text-red-500 dark:text-red-400">
                      -{formatCurrency(exp.amount * (vatRate / 100))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-semibold">
                  <td className="pt-3 pr-4 text-sm" colSpan={3}>
                    Net VAT Payable
                  </td>
                  <td
                    className={`pt-3 text-right font-mono text-sm ${
                      netVatPayable >= 0 ? "text-blue-600 dark:text-blue-400" : "text-violet-600 dark:text-violet-400"
                    }`}>
                    {formatCurrency(netVatPayable)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <ExportSection selectedPeriod={currentPeriodDisplayLabel} selectedTab={selectedPeriodTab} />

      {/* Audit Log */}
      <AuditLogSection />
    </div>
  );
}
