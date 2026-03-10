import { useMemo, useState } from "react";
import { useTable } from "@refinedev/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useMany, useUpdate, useInvalidate } from "@refinedev/core";
import { format } from "date-fns";
import { MoreHorizontal, Eye, Pencil, CheckCircle } from "lucide-react";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { ShowButton } from "@/components/refine-ui/buttons/show";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
import { DataTableSorter } from "@/components/refine-ui/data-table/data-table-sorter";

import type { Invoice, Client } from "@/types";
import { formatInvoiceStatus, getCurrencySymbol, normalizeInvoiceStatus } from "@/types";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  paid: "bg-green-500",
  overdue: "bg-red-500",
  pending: "bg-amber-500",
};

export function InvoiceListPage() {
  const [markPaidTarget, setMarkPaidTarget] = useState<Invoice | null>(null);
  const { mutate: updateInvoice, mutation: updateMutation } = useUpdate<Invoice>();
  const invalidate = useInvalidate();

  const table = useTable<Invoice>({
    columns: [],
    refineCoreProps: { resource: "invoices" },
  });

  const invoicesData = table.refineCore.tableQuery.data?.data || [];
  const clientIds = invoicesData
    .map((invoice) => invoice.client_id || invoice.clientId)
    .filter((id): id is string => Boolean(id));
  const { query: clientsQuery } = useMany<Client>({
    resource: "clients",
    ids: clientIds,
    queryOptions: { enabled: clientIds.length > 0 },
  });

  const clientsMap = useMemo(() => {
    const map = new Map<string, Client>();
    ((clientsQuery.data?.data || []) as Client[]).forEach((client) => map.set(client.id, client));
    return map;
  }, [clientsQuery.data]);

  function handleMarkAsPaid() {
    if (!markPaidTarget) return;
    updateInvoice(
      { resource: "invoices", id: markPaidTarget.id, values: { ...markPaidTarget, status: "paid" } },
      {
        onSuccess: () => {
          invalidate({ resource: "invoices", invalidates: ["list", "detail"] });
          setMarkPaidTarget(null);
        },
      },
    );
  }

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        id: "invoice_number",
        accessorKey: "invoice_number",
        header: ({ column }) => <DataTableSorter column={column} title="Invoice #" />,
        cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
      },
      {
        id: "client",
        accessorKey: "client_id",
        header: "Client",
        cell: ({ getValue }) => {
          const client = clientsMap.get(getValue<string>());
          return <span>{client?.name || "-"}</span>;
        },
        enableSorting: false,
      },
      {
        id: "invoice_date",
        accessorKey: "invoice_date",
        header: ({ column }) => <DataTableSorter column={column} title="Invoice Date" />,
        cell: ({ getValue }) => <span>{format(new Date(getValue<string>()), "MMM dd, yyyy")}</span>,
      },
      {
        id: "due_date",
        accessorKey: "due_date",
        header: ({ column }) => <DataTableSorter column={column} title="Due Date" />,
        cell: ({ getValue }) => (
          <span className="font-medium">{format(new Date(getValue<string>()), "MMM dd, yyyy")}</span>
        ),
      },
      {
        id: "total",
        accessorKey: "total",
        header: ({ column }) => <DataTableSorter column={column} title="Total" />,
        cell: ({ getValue, row }) => {
          const value = getValue<number>();
          const sym = getCurrencySymbol(row.original.currency || "ZAR");
          return (
            <span className="font-medium">
              {sym}
              {value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataTableSorter column={column} title="Status" />,
        cell: ({ getValue }) => {
          const status = normalizeInvoiceStatus(getValue<string>());
          return <Badge className={`${statusColors[status]} text-white`}>{formatInvoiceStatus(status)}</Badge>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const record = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="p-0" onSelect={(e) => e.preventDefault()}>
                  <ShowButton
                    resource="invoices"
                    recordItemId={record.id}
                    variant="ghost"
                    className="w-full justify-start">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </ShowButton>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-0" onSelect={(e) => e.preventDefault()}>
                  <EditButton
                    resource="invoices"
                    recordItemId={record.id}
                    variant="ghost"
                    className="w-full justify-start">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </EditButton>
                </DropdownMenuItem>
                {normalizeInvoiceStatus(record.status) !== "paid" && (
                  <DropdownMenuItem
                    className="text-green-600 focus:text-green-700 cursor-pointer"
                    onSelect={() => setMarkPaidTarget(record)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [clientsMap, setMarkPaidTarget],
  );

  const tableWithColumns = useTable<Invoice>({
    columns,
    refineCoreProps: { resource: "invoices" },
  });

  return (
    <>
      <ListView>
        <ListViewHeader title="Invoices / Quotes" />
        <DataTable table={tableWithColumns} />
      </ListView>

      <AlertDialog open={!!markPaidTarget} onOpenChange={(open) => !open && setMarkPaidTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Invoice as Paid?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update invoice <strong>{markPaidTarget?.invoice_number}</strong> status to <strong>Paid</strong>.
              This action can be reversed by editing the invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAsPaid} className="bg-green-600 hover:bg-green-700 text-white">
              {updateMutation?.isPending ? "Updating..." : "Mark as Paid"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
