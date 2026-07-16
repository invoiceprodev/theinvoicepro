import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { LoaderCircle, RefreshCw, Upload, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type Contract,
  type ContractAiStatus,
  type ContractFormValues,
  type UploadedDocument,
  downloadContractPdf,
  generateContract,
  getContractStatus,
  uploadContractDocument,
} from "@/services/contractApi";

const initialValues: ContractFormValues = {
  companyName: "",
  clientName: "",
  contractType: "Service Agreement",
  servicesDescription: "",
  paymentTerms: "",
  contractDuration: "",
  jurisdiction: "",
  additionalNotes: "",
  uploadedDocumentId: null,
};

export function ContractCreatePage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<ContractFormValues>(initialValues);
  const [generatedContract, setGeneratedContract] = useState<Contract | null>(
    null,
  );
  const [uploadedDocument, setUploadedDocument] =
    useState<UploadedDocument | null>(null);
  const [contractStatus, setContractStatus] = useState<ContractAiStatus | null>(
    null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const response = await getContractStatus();
        if (!cancelled) {
          setContractStatus(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[Contracts] failed to load AI status", error);
        }
      }
    }

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateValue<Key extends keyof ContractFormValues>(
    key: Key,
    value: ContractFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleUpload(file: File | null) {
    if (!file) {
      return;
    }

    try {
      setIsUploading(true);
      const response = await uploadContractDocument(file);
      setUploadedDocument(response.data);
      updateValue("uploadedDocumentId", response.data.id);
      toast.success("Supporting document uploaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload document",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleGenerate() {
    try {
      setIsGenerating(true);
      const response = await generateContract(values);
      setGeneratedContract(response.data);
      if (response.uploadedDocument) {
        setUploadedDocument(response.uploadedDocument);
      }
      toast.success("Contract generated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate contract",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownload(contractId: string) {
    try {
      setIsDownloading(true);
      const blob = await downloadContractPdf(contractId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contract-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to download PDF",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create AI Contract
          </h1>
          <p className="text-sm text-muted-foreground">
            Fill in the essentials, optionally attach source documents, and
            generate a contract draft.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/contracts")}>
          Back to Contracts
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
            <CardDescription>
              Keep the input concise and factual so the generated draft stays
              usable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contractStatus &&
            (!contractStatus.openAiConfigured ||
              !contractStatus.llamaParseConfigured) ? (
              <Alert>
                <AlertTitle>AI readiness check</AlertTitle>
                <AlertDescription>
                  {!contractStatus.openAiConfigured
                    ? "OpenAI is not configured, so contract generation will use the fallback template."
                    : null}
                  {!contractStatus.openAiConfigured &&
                  !contractStatus.llamaParseConfigured
                    ? " "
                    : null}
                  {!contractStatus.llamaParseConfigured
                    ? "LlamaParse is not configured, so uploaded documents will be stored but not parsed for prompt context."
                    : null}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Company Name">
                <Input
                  value={values.companyName}
                  onChange={(event) =>
                    updateValue("companyName", event.target.value)
                  }
                />
              </Field>
              <Field label="Client Name">
                <Input
                  value={values.clientName}
                  onChange={(event) =>
                    updateValue("clientName", event.target.value)
                  }
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Contract Type">
                <Input
                  value={values.contractType}
                  onChange={(event) =>
                    updateValue("contractType", event.target.value)
                  }
                />
              </Field>
              <Field label="Jurisdiction">
                <Input
                  value={values.jurisdiction}
                  onChange={(event) =>
                    updateValue("jurisdiction", event.target.value)
                  }
                />
              </Field>
            </div>

            <Field label="Services Description">
              <Textarea
                rows={5}
                value={values.servicesDescription}
                onChange={(event) =>
                  updateValue("servicesDescription", event.target.value)
                }
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Payment Terms">
                <Textarea
                  rows={4}
                  value={values.paymentTerms}
                  onChange={(event) =>
                    updateValue("paymentTerms", event.target.value)
                  }
                />
              </Field>
              <Field label="Contract Duration">
                <Textarea
                  rows={4}
                  value={values.contractDuration}
                  onChange={(event) =>
                    updateValue("contractDuration", event.target.value)
                  }
                />
              </Field>
            </div>

            <Field label="Additional Notes">
              <Textarea
                rows={4}
                value={values.additionalNotes}
                onChange={(event) =>
                  updateValue("additionalNotes", event.target.value)
                }
              />
            </Field>

            <Field label="Supporting Document">
              <div className="rounded-lg border border-dashed p-4">
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) =>
                    void handleUpload(event.target.files?.[0] || null)
                  }
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Accepted formats: PDF or DOCX. Files are uploaded to secure
                  storage and parsed for extra drafting context.
                </p>
                {uploadedDocument ? (
                  <p className="mt-3 text-sm font-medium">
                    Uploaded: {uploadedDocument.name}
                  </p>
                ) : null}
              </div>
            </Field>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => void handleGenerate()}
                disabled={isGenerating || isUploading}
              >
                {isGenerating ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Generate Contract
              </Button>
              {generatedContract ? (
                <Button
                  variant="outline"
                  onClick={() => void handleGenerate()}
                  disabled={isGenerating}
                >
                  Regenerate
                </Button>
              ) : null}
              {isUploading ? (
                <span className="inline-flex items-center text-sm text-muted-foreground">
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  Uploading document...
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[640px]">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Review the generated HTML draft before downloading or opening the
              saved contract page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                disabled={!generatedContract || isDownloading}
                onClick={() =>
                  generatedContract && void handleDownload(generatedContract.id)
                }
              >
                {isDownloading ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                Download PDF
              </Button>
              {generatedContract ? (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/contracts/${generatedContract.id}`)}
                >
                  Open Saved Contract
                </Button>
              ) : null}
            </div>

            <ScrollArea className="h-[520px] rounded-lg border bg-muted/20 p-6">
              {generatedContract ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: generatedContract.generated_content,
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Your generated contract preview will appear here.
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
