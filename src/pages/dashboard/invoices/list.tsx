import { useMemo } from "react";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { DataTableSorter } from "@/components/refine-ui/data-table/data-table-sorter";
import { CreateButton } from "@/components/refine-ui/buttons/create";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@/types";
import { format } from "date-fns";
import { useNavigate } from "react-router";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { formatCurrency } from "@/lib/utils";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default",
  pending: "secondary",
  overdue: "destructive",
};

export const InvoiceListPage = () => {
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "invoice_number",
        header: ({ column }) => <DataTableSorter column={column} title="Invoice Number" />,
        cell: ({ row }) => (
          <button
            onClick={() => navigate(`/invoices/${row.original.id}`)}
            className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
            {row.original.invoice_number}
          </button>
        ),
      },
      {
        accessorKey: "client",
        header: "Client",
        cell: ({ row }) => {
          const client = row.original.client;
          return client?.name || "Unknown";
        },
      },
      {
        accessorKey: "invoice_date",
        header: "Date",
        cell: ({ row }) => {
          return format(new Date(row.original.invoice_date), "MMM dd, yyyy");
        },
      },
      {
        accessorKey: "due_date",
        header: "Due Date",
        cell: ({ row }) => {
          return format(new Date(row.original.due_date), "MMM dd, yyyy");
        },
      },
      {
        accessorKey: "total",
        header: "Amount",
        cell: ({ row }) => {
          return formatCurrency(row.original.total);
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant={statusVariant[status]} className="capitalize">
              {status}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  const table = useTable<Invoice>({
    columns,
    refineCoreProps: {
      resource: "invoices",
      meta: {
        select: "*, client:clients(*)",
      },
    },
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage and track your invoices</p>
        </div>
        <CreateButton resource="invoices" />
      </div>

      <DataTable table={table} />
    </div>
  );
};
