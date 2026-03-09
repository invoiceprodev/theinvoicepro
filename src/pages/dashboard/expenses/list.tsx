import { useMemo } from "react";
import { useTable } from "@refinedev/react-table";
import { useList } from "@refinedev/core";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Edit, Trash2, DollarSign, Calendar, Tag, TrendingDown } from "lucide-react";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { DeleteButton } from "@/components/refine-ui/buttons/delete";
import { DataTableSorter } from "@/components/refine-ui/data-table/data-table-sorter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { Expense, ExpenseCategory, ExpenseStatus } from "@/types";
import { getCurrencySymbol } from "@/types";

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

const ALL_CATEGORIES: ExpenseCategory[] = ["Pay Client", "Pay Salary", "Subscription", "Operating Cost", "Other"];

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  "Pay Client": "💸",
  "Pay Salary": "👤",
  Subscription: "🔄",
  "Operating Cost": "🏢",
  Other: "📋",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string) {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Normalize amounts to ZAR for summary (rough approximation)
const APPROX_RATES: Record<string, number> = { ZAR: 1, USD: 18.5, EUR: 20 };

function toZAR(amount: number, currency: string): number {
  return amount * (APPROX_RATES[currency] ?? 1);
}

// ─── Summary Cards ─────────────────────────────────────────────────────────────

interface SummaryCardsProps {
  expenses: Expense[];
}

function SummaryCards({ expenses }: SummaryCardsProps) {
  const thisMonth = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return expenses.filter((e) => e.date.startsWith(ym));
  }, [expenses]);

  const totalAllTime = useMemo(() => expenses.reduce((sum, e) => sum + toZAR(e.amount, e.currency), 0), [expenses]);

  const totalThisMonth = useMemo(() => thisMonth.reduce((sum, e) => sum + toZAR(e.amount, e.currency), 0), [thisMonth]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    ALL_CATEGORIES.forEach((c) => (map[c] = 0));
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + toZAR(e.amount, e.currency);
    });
    return map;
  }, [expenses]);

  return (
    <div className="space-y-4">
      {/* Top row: Total All Time + This Month */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses (All Time)</CardTitle>
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">
              R{totalAllTime.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{expenses.length} expense records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950">
              <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">
              R{totalThisMonth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {thisMonth.length} expense{thisMonth.length !== 1 ? "s" : ""} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-3 space-y-0">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
            <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-sm font-medium">Breakdown by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ALL_CATEGORIES.map((category) => {
              const amount = byCategory[category] ?? 0;
              const count = expenses.filter((e) => e.category === category).length;
              return (
                <div key={category} className="flex flex-col gap-1 rounded-lg border p-3 bg-muted/30">
                  <span className="text-lg leading-none">{CATEGORY_ICONS[category]}</span>
                  <span className="text-xs font-medium text-muted-foreground mt-1 leading-tight">{category}</span>
                  <span className="text-sm font-bold tabular-nums">
                    R{amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {count} item{count !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── List Page ─────────────────────────────────────────────────────────────────

export function ExpenseListPage() {
  // Fetch all expenses for summary cards
  const { query: allExpensesQuery } = useList<Expense>({
    resource: "expenses",
    pagination: { pageSize: 1000 },
  });
  const allExpenses: Expense[] = allExpensesQuery.data?.data ?? [];

  const columns = useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        id: "date",
        accessorKey: "date",
        header: ({ column }) => <DataTableSorter column={column} title="Date" />,
        cell: ({ getValue }) => (
          <span className="text-sm whitespace-nowrap">{format(new Date(getValue<string>()), "MMM dd, yyyy")}</span>
        ),
        size: 120,
      },
      {
        id: "category",
        accessorKey: "category",
        header: ({ column }) => <DataTableSorter column={column} title="Category" />,
        cell: ({ getValue }) => {
          const cat = getValue<ExpenseCategory>();
          return (
            <Badge variant="secondary" className={`${CATEGORY_COLORS[cat]} border-0 font-medium`}>
              {CATEGORY_ICONS[cat]} {cat}
            </Badge>
          );
        },
        size: 160,
      },
      {
        id: "recipient",
        accessorKey: "recipient",
        header: ({ column }) => <DataTableSorter column={column} title="Recipient" />,
        cell: ({ getValue }) => <span className="text-sm font-medium">{getValue<string>()}</span>,
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: ({ column }) => <DataTableSorter column={column} title="Amount" />,
        cell: ({ getValue, row }) => (
          <span className="text-sm font-semibold tabular-nums">
            {formatAmount(getValue<number>(), row.original.currency)}
          </span>
        ),
        size: 130,
      },
      {
        id: "paymentMethod",
        accessorKey: "payment_method",
        header: "Payment Method",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.payment_method || row.original.paymentMethod}</span>
        ),
        size: 140,
      },
      {
        id: "vatApplicable",
        accessorKey: "vat_applicable",
        header: "VAT",
        enableSorting: false,
        cell: ({ row }) => {
          const applicable = Boolean(row.original.vat_applicable ?? row.original.vatApplicable);
          return applicable ? (
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 text-xs">
              Yes
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-0 text-xs">
              No
            </Badge>
          );
        },
        size: 70,
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataTableSorter column={column} title="Status" />,
        cell: ({ getValue }) => {
          const status = getValue<ExpenseStatus>();
          return (
            <Badge variant="secondary" className={`${STATUS_COLORS[status]} border-0 font-medium`}>
              {status}
            </Badge>
          );
        },
        size: 100,
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        size: 90,
        cell: ({ row }) => {
          const recordItemId = row.original.id;
          return (
            <div className="flex gap-1">
              <EditButton recordItemId={recordItemId} size="icon-sm" variant="secondary">
                <Edit className="h-4 w-4" />
              </EditButton>
              <DeleteButton recordItemId={recordItemId} size="icon-sm" variant="destructive">
                <Trash2 className="h-4 w-4" />
              </DeleteButton>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useTable<Expense>({
    columns,
    refineCoreProps: { resource: "expenses" },
  });

  return (
    <ListView>
      <ListViewHeader title="Expenses" canCreate={true} />
      <div className="px-4 pb-4 space-y-6">
        <SummaryCards expenses={allExpenses} />
        <DataTable table={table} />
      </div>
    </ListView>
  );
}
