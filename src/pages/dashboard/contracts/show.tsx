import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { FileDown, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { downloadContractPdf, getContract, type Contract } from "@/services/contractApi";

export function ContractShowPage() {
  const { id = "" } = useParams();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadContract() {
      try {
        setIsLoading(true);
        const response = await getContract(id);
        if (!cancelled) {
          setContract(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load contract");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadContract();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDownload() {
    try {
      setIsDownloading(true);
      const blob = await downloadContractPdf(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contract-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download PDF");
    } finally {
      setIsDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-sm text-muted-foreground">Loading contract...</CardContent>
      </Card>
    );
  }

  if (!contract) {
    return (
      <Card>
        <CardContent className="py-10 text-sm text-muted-foreground">Contract not found.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{contract.contract_type}</h1>
          <p className="text-sm text-muted-foreground">
            {contract.company_name} and {contract.client_name}
          </p>
        </div>
        <Button variant="outline" onClick={() => void handleDownload()} disabled={isDownloading}>
          {isDownloading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
          Download PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generated Contract</CardTitle>
          <CardDescription>Saved draft from your AI Contracts workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[70vh] rounded-lg border bg-muted/20 p-6">
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: contract.generated_content }} />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
