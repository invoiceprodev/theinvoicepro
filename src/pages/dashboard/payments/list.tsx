import { useTable } from "@refinedev/react-table";
import { useGetIdentity } from "@refinedev/core";
import { flexRender } from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import type { Payment, Profile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ListView } from "@/components/refine-ui/views/list-view";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { RefreshButton } from "@/components/refine-ui/buttons/refresh";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Wallet, CreditCard, TrendingUp, Calendar } from "lucide-react";
import { useMemo } from "react";
import {
  DataTableFilterDropdownText,
  DataTableFilterCombobox,
} from "@/components/refine-ui/data-table/data-table-filter";
import { DataTableSorter } from "@/components/refine-ui/data-table/data-table-sorter";

const columnHelper = createColumnHelper<Payment>();

// Status badge variant mapping
const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  pending: "secondary",
  failed: "destructive",
};

export default function PaymentListPage() {
  const { data: user } = useGetIdentity<Profile>();

  const columns = [
    columnHelper.accessor("created_at", {
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>Date</span>
          <DataTableSorter column={column} />
        </div>
      ),
      cell: (info) => {
        const date = info.getValue();
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(date).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor("amount", {
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <TrendingUp className="h-4 w-4" />
          <span>Amount</span>
          <DataTableSorter column={column} />
        </div>
      ),
      cell: (info) => {
        const amount = info.getValue();
        return <span className="font-semibold text-lg">{formatCurrency(amount)}</span>;
      },
    }),
    columnHelper.accessor("status", {
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <span>Status</span>
          <DataTableFilterCombobox
            column={column}
            defaultOperator="eq"
            multiple={false}
            options={[
              { label: "Completed", value: "completed" },
              { label: "Pending", value: "pending" },
              { label: "Failed", value: "failed" },
            ]}
          />
        </div>
      ),
      cell: (info) => {
        const status = info.getValue();
        return (
          <Badge variant={statusVariants[status] || "outline"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("payment_method", {
      header: ({ column, table }) => (
        <div className="flex items-center gap-1">
          <CreditCard className="h-4 w-4" />
          <span>Payment Method</span>
          <DataTableFilterDropdownText
            defaultOperator="contains"
            column={column}
            table={table}
            placeholder="Search method..."
          />
        </div>
      ),
      cell: (info) => {
        const method = info.getValue();
        return <span className="capitalize font-medium">{method}</span>;
      },
    }),
    columnHelper.accessor("transaction_reference", {
      header: "Transaction Reference",
      cell: (info) => {
        const ref = info.getValue();
        if (!ref) return <span className="text-muted-foreground text-sm">N/A</span>;
        return <span className="font-mono text-xs">{ref}</span>;
      },
    }),
    columnHelper.accessor("payfast_payment_id", {
      header: "PayFast ID",
      cell: (info) => {
        const id = info.getValue();
        if (!id) return <span className="text-muted-foreground text-sm">N/A</span>;
        return <span className="font-mono text-xs">{id}</span>;
      },
    }),
  ];

  const table = useTable({
    columns,
    refineCoreProps: {
      resource: "payments",
      filters: {
        permanent: [{ field: "user_id", operator: "eq", value: user?.id }],
      },
      sorters: {
        initial: [{ field: "created_at", order: "desc" }],
      },
    },
  });

  // Calculate summary statistics
  const payments = table.refineCore.tableQuery.data?.data || [];
  const totalAmount = useMemo(() => {
    return payments
      .filter((p: Payment) => p.status === "completed")
      .reduce((sum: number, p: Payment) => sum + p.amount, 0);
  }, [payments]);

  const completedCount = useMemo(() => {
    return payments.filter((p: Payment) => p.status === "completed").length;
  }, [payments]);

  const pendingCount = useMemo(() => {
    return payments.filter((p: Payment) => p.status === "pending").length;
  }, [payments]);

  return (
    <ListView>
      <div className="flex flex-col gap-4">
        <div className="flex items-center relative gap-2">
          <div className="bg-background z-[2] pr-4">
            <Breadcrumb />
          </div>
          <Separator className="absolute left-0 right-0 z-[1]" />
        </div>

        <div className="flex justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Payment History</h2>
            <p className="text-muted-foreground">View all your payment transactions and invoices</p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton resource="payments" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">Lifetime payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Successful payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <CreditCard className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <DataTable table={table} />
    </ListView>
  );
}
