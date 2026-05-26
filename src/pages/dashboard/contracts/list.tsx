import { useList } from "@refinedev/core";
import { Link } from "react-router";
import { format } from "date-fns";
import { Plus, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Contract } from "@/services/contractApi";

export function ContractListPage() {
  const { result, query } = useList<Contract>({
    resource: "contracts",
  });

  const contracts = result?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Contracts</h1>
          <p className="text-sm text-muted-foreground">Generate, save, and revisit contract drafts from your dashboard.</p>
        </div>
        <Button asChild>
          <Link to="/contracts/create">
            <Plus className="mr-2 h-4 w-4" />
            New Contract
          </Link>
        </Button>
      </div>

      {query.isLoading ? (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground">Loading contracts...</CardContent>
        </Card>
      ) : contracts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">No contracts yet</p>
              <p className="text-sm text-muted-foreground">Create your first AI-generated contract to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {contracts.map((contract) => (
            <Card key={contract.id} className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">{contract.contract_type}</CardTitle>
                <CardDescription>
                  {contract.company_name} to {contract.client_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm text-muted-foreground">{contract.services_description}</p>
                <div className="text-xs text-muted-foreground">
                  Created {format(new Date(contract.created_at), "PPP p")}
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/contracts/${contract.id}`}>View Contract</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
