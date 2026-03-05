import { useMemo } from "react";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { Client } from "@/types";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { CreateButton } from "@/components/refine-ui/buttons/create";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { DeleteButton } from "@/components/refine-ui/buttons/delete";
import { Edit, Trash2 } from "lucide-react";

export const ClientListPage = () => {
  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "company",
        header: "Company",
        cell: ({ row }) => row.original.company || "—",
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => row.original.phone || "—",
      },
      {
        id: "invoice_count",
        header: "Invoices",
        cell: ({ row }) => {
          const invoiceCount = (row.original as Client & { invoice_count?: number })?.invoice_count || 0;
          return <span className="text-muted-foreground">{invoiceCount}</span>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        size: 100,
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

  const table = useTable<Client>({
    columns,
    refineCoreProps: {
      resource: "clients",
      meta: {
        select: "*, invoices(count)",
      },
    },
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your client information</p>
        </div>
        <CreateButton />
      </div>

      <DataTable table={table} />
    </div>
  );
};
