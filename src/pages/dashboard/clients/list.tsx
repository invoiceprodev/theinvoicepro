import { useMemo } from "react";
import { useTable } from "@refinedev/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { CreateButton } from "@/components/refine-ui/buttons/create";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableSorter } from "@/components/refine-ui/data-table/data-table-sorter";
import { ChevronDown, FileText, Pencil } from "lucide-react";

import type { Client } from "@/types";
import { usePlanEntitlements } from "@/hooks/use-plan-entitlements";

export function ClientListPage() {
  const navigate = useNavigate();
  const { canCreateClient, canUseQuotes } = usePlanEntitlements();

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => <DataTableSorter column={column} title="Name" />,
        cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
      },
      {
        id: "email",
        accessorKey: "email",
        header: ({ column }) => <DataTableSorter column={column} title="Email" />,
        cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>()}</span>,
      },
      {
        id: "company",
        accessorKey: "company",
        header: ({ column }) => <DataTableSorter column={column} title="Company" />,
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
      },
      {
        id: "phone",
        accessorKey: "phone",
        header: "Phone",
        cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>()}</span>,
        enableSorting: false,
      },
      {
        id: "actions",
        header: "Actions",
        size: 140,
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div className="flex gap-1">
              <EditButton resource="clients" recordItemId={record.id} size="icon-sm" variant="secondary">
                <Pencil className="h-4 w-4" />
              </EditButton>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 h-7 px-2 text-xs">
                    <FileText className="h-3.5 w-3.5" />
                    New Invoice
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => navigate(`/dashboard/invoices/create?clientId=${record.id}&type=invoice`)}>
                    Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!canUseQuotes}
                    onClick={() => canUseQuotes && navigate(`/dashboard/invoices/create?clientId=${record.id}&type=quote`)}>
                    Quote
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [navigate],
  );

  const table = useTable<Client>({
    columns,
    refineCoreProps: {
      resource: "clients",
    },
  });

  return (
    <ListView>
      <ListViewHeader title="Clients">
        <CreateButton resource="clients" disabled={!canCreateClient} />
      </ListViewHeader>
      <DataTable table={table} />
    </ListView>
  );
}
