import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatInvoiceStatus, getCurrencySymbol, normalizeInvoiceStatus, type Client, type Currency, type Profile } from "@/types";

type PreviewLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

type InvoiceTemplateId = "classic" | "studio" | "executive";

interface InvoiceTemplatePreviewProps {
  documentType?: "invoice" | "quote";
  invoiceNumber?: string;
  invoiceDate?: string | Date;
  dueDate?: string | Date;
  currency?: Currency;
  status?: string;
  discountType?: "percentage" | "fixed";
  discount?: number;
  notes?: string;
  lineItems: PreviewLineItem[];
  client?: Partial<Client> | null;
  businessProfile?: Partial<Profile> | null;
}

const TEMPLATE_OPTIONS: Array<{
  id: InvoiceTemplateId;
  label: string;
  plan: "Core" | "Pro" | "Enterprise";
  description: string;
}> = [
  {
    id: "classic",
    label: "Classic",
    plan: "Core",
    description: "Straightforward and familiar for everyday invoices.",
  },
  {
    id: "studio",
    label: "Studio",
    plan: "Pro",
    description: "Brand-forward layout with stronger hierarchy and color.",
  },
  {
    id: "executive",
    label: "Executive",
    plan: "Enterprise",
    description: "Premium presentation for polished client-facing billing.",
  },
];

function formatDate(value?: string | Date) {
  if (!value) {
    return "Not set";
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not set";
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(value: number, currency?: Currency) {
  const symbol = getCurrencySymbol(currency || "ZAR");
  return `${symbol}${value.toFixed(2)}`;
}

function getInitials(value?: string) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "IP";
  }

  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

function getPreviewStatusBadgeClass(status: string) {
  switch (normalizeInvoiceStatus(status)) {
    case "paid":
      return "border border-emerald-600/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-50";
    case "overdue":
      return "border border-rose-600/30 bg-rose-50 text-rose-700 hover:bg-rose-50";
    case "sent":
      return "border border-sky-600/30 bg-sky-50 text-sky-700 hover:bg-sky-50";
    case "draft":
      return "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-100";
    case "pending":
    default:
      return "border border-amber-600/30 bg-amber-50 text-amber-700 hover:bg-amber-50";
  }
}

function BrandIdentity({
  businessProfile,
  className,
  logoClassName,
  initialsClassName,
  detailsClassName,
  detailTextClassName,
}: {
  businessProfile?: Partial<Profile> | null;
  className?: string;
  logoClassName?: string;
  initialsClassName?: string;
  detailsClassName?: string;
  detailTextClassName?: string;
}) {
  const companyName = businessProfile?.company_name || "Your Business";

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {businessProfile?.logo_url ? (
        <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-background/70", logoClassName)}>
          <img
            src={businessProfile.logo_url}
            alt={`${companyName} logo`}
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-lg font-semibold text-white shadow-sm",
            initialsClassName,
          )}>
          {getInitials(companyName)}
        </div>
      )}

      <div className={cn("space-y-1 min-w-0", detailsClassName)}>
        <p className={cn("truncate text-lg font-semibold", detailTextClassName)}>{companyName}</p>
        {businessProfile?.business_email ? (
          <p className={cn("truncate text-sm text-muted-foreground", detailTextClassName)}>{businessProfile.business_email}</p>
        ) : null}
      </div>
    </div>
  );
}

export function InvoiceTemplatePreview({
  documentType = "invoice",
  invoiceNumber,
  invoiceDate,
  dueDate,
  currency = "ZAR",
  status,
  discountType = "percentage",
  discount = 0,
  notes,
  lineItems,
  client,
  businessProfile,
}: InvoiceTemplatePreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplateId>("classic");

  const activeTemplate = TEMPLATE_OPTIONS.find((template) => template.id === selectedTemplate) || TEMPLATE_OPTIONS[0];
  const normalizedStatus = normalizeInvoiceStatus(status);
  const documentLabel = documentType === "quote" ? "Quote" : "Invoice";
  const safeLineItems =
    lineItems.length > 0
      ? lineItems.map((item) => ({
          description: item.description || "Untitled item",
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
        }))
      : [{ description: "Consulting services", quantity: 1, unitPrice: 0 }];

  const subtotal = safeLineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount =
    discountType === "percentage" ? (subtotal * (Number(discount) || 0)) / 100 : Math.min(Number(discount) || 0, subtotal);
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3 border-b bg-muted/20">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Invoice Template Preview</CardTitle>
            <CardDescription>
              Review how this {documentLabel.toLowerCase()} will look across planned template tiers before we persist
              template selection.
            </CardDescription>
          </div>
          <Badge variant="secondary">{activeTemplate.plan}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4 md:p-6">
        <Tabs value={selectedTemplate} onValueChange={(value) => setSelectedTemplate(value as InvoiceTemplateId)}>
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 md:grid-cols-3">
            {TEMPLATE_OPTIONS.map((template) => (
              <TabsTrigger
                key={template.id}
                value={template.id}
                className="h-auto flex-col items-start border bg-muted/40 px-4 py-3 text-left data-[state=active]:border-primary data-[state=active]:bg-background">
                <span className="flex w-full items-center justify-between gap-3">
                  <span>{template.label}</span>
                  <Badge variant={template.plan === "Core" ? "outline" : "secondary"}>{template.plan}</Badge>
                </span>
                <span className="text-xs font-normal text-muted-foreground">{template.description}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {TEMPLATE_OPTIONS.map((template) => (
            <TabsContent key={template.id} value={template.id} className="mt-4">
              <div className={cn("rounded-2xl border bg-background shadow-sm", template.id === "classic" && "rounded-none")}>
                <div
                  className={cn(
                    "space-y-6 rounded-2xl p-5 md:p-8",
                    template.id === "classic" && "rounded-none bg-white",
                    template.id === "studio" &&
                      "bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_35%),linear-gradient(180deg,#f8fbff_0%,#ffffff_70%)]",
                    template.id === "executive" &&
                      "bg-[linear-gradient(180deg,#0f172a_0%,#111827_22%,#ffffff_22%,#ffffff_100%)] text-slate-900",
                  )}>
                  {template.id === "classic" && (
                    <ClassicPreview
                      businessProfile={businessProfile}
                      client={client}
                      documentLabel={documentLabel}
                      invoiceNumber={invoiceNumber}
                      invoiceDate={invoiceDate}
                      dueDate={dueDate}
                      currency={currency}
                      normalizedStatus={normalizedStatus}
                      safeLineItems={safeLineItems}
                      subtotal={subtotal}
                      discountAmount={discountAmount}
                      discountType={discountType}
                      discount={discount}
                      total={total}
                      notes={notes}
                    />
                  )}
                  {template.id === "studio" && (
                    <StudioPreview
                      businessProfile={businessProfile}
                      client={client}
                      documentLabel={documentLabel}
                      invoiceNumber={invoiceNumber}
                      invoiceDate={invoiceDate}
                      dueDate={dueDate}
                      currency={currency}
                      normalizedStatus={normalizedStatus}
                      safeLineItems={safeLineItems}
                      subtotal={subtotal}
                      discountAmount={discountAmount}
                      discountType={discountType}
                      discount={discount}
                      total={total}
                      notes={notes}
                    />
                  )}
                  {template.id === "executive" && (
                    <ExecutivePreview
                      businessProfile={businessProfile}
                      client={client}
                      documentLabel={documentLabel}
                      invoiceNumber={invoiceNumber}
                      invoiceDate={invoiceDate}
                      dueDate={dueDate}
                      currency={currency}
                      normalizedStatus={normalizedStatus}
                      safeLineItems={safeLineItems}
                      subtotal={subtotal}
                      discountAmount={discountAmount}
                      discountType={discountType}
                      discount={discount}
                      total={total}
                      notes={notes}
                    />
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface TemplateBodyProps {
  businessProfile?: Partial<Profile> | null;
  client?: Partial<Client> | null;
  documentLabel: string;
  invoiceNumber?: string;
  invoiceDate?: string | Date;
  dueDate?: string | Date;
  currency: Currency;
  normalizedStatus: string;
  safeLineItems: PreviewLineItem[];
  subtotal: number;
  discountAmount: number;
  discountType: "percentage" | "fixed";
  discount: number;
  total: number;
  notes?: string;
}

function ClassicPreview({
  businessProfile,
  client,
  documentLabel,
  invoiceNumber,
  invoiceDate,
  dueDate,
  currency,
  normalizedStatus,
  safeLineItems,
  subtotal,
  discountAmount,
  discountType,
  discount,
  total,
  notes,
}: TemplateBodyProps) {
  return (
    <>
      <div className="border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{documentLabel}</div>
            <BrandIdentity
              businessProfile={businessProfile}
              logoClassName="h-16 w-16 rounded-none border-slate-200 p-3"
              initialsClassName="h-16 w-16 rounded-none bg-slate-900"
            />
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{businessProfile?.business_phone || "+27 00 000 0000"}</p>
              <p>{businessProfile?.business_address || "Business address will appear here"}</p>
            </div>
          </div>

          <div className="min-w-[240px] border border-slate-300 bg-slate-50/80 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">{documentLabel} Number</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{invoiceNumber || "INV-0001"}</p>
              </div>
              <Badge className={getPreviewStatusBadgeClass(normalizedStatus)}>{formatInvoiceStatus(normalizedStatus)}</Badge>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-200 pb-3">
                <span className="text-muted-foreground">Issued</span>
                <span className="font-medium text-slate-900">{formatDate(invoiceDate)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Due</span>
                <span className="font-medium text-slate-900">{formatDate(dueDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PreviewPartyBlock
          label="Bill To"
          title={client?.name || "Client name"}
          subtitle={client?.company}
          lines={[client?.email, client?.phone, client?.address]}
          className="rounded-none border-slate-200 bg-slate-50/40 p-5"
        />
        <PreviewPartyBlock
          label="From"
          title={businessProfile?.company_name || "Your business"}
          subtitle={businessProfile?.registration_number ? `Reg ${businessProfile.registration_number}` : undefined}
          lines={[businessProfile?.business_email, businessProfile?.business_phone, businessProfile?.business_address]}
          className="rounded-none border-slate-200 bg-white p-5"
        />
      </div>

      <PreviewItemsTable currency={currency} items={safeLineItems} variant="classic" />

      <div className="grid gap-4 md:grid-cols-[1fr_320px] md:items-start">
        <div className="rounded-none border border-slate-200 bg-slate-50/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Payment Reference</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Please use <span className="font-semibold text-slate-900">{invoiceNumber || "INV-0001"}</span> as your payment reference.
          </p>
        </div>
        <PreviewTotals
          currency={currency}
          subtotal={subtotal}
          discountAmount={discountAmount}
          discountType={discountType}
          discount={discount}
          total={total}
          className="rounded-none border-slate-900 bg-white"
        />
      </div>

      {notes ? <PreviewNotes notes={notes} className="rounded-none border-slate-200 bg-white" /> : null}
    </>
  );
}

function StudioPreview({
  businessProfile,
  client,
  documentLabel,
  invoiceNumber,
  invoiceDate,
  dueDate,
  currency,
  normalizedStatus,
  safeLineItems,
  subtotal,
  discountAmount,
  discountType,
  discount,
  total,
  notes,
}: TemplateBodyProps) {
  return (
    <>
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <BrandIdentity
            businessProfile={businessProfile}
            logoClassName="h-16 w-16 border-sky-100 bg-white/90 p-3"
            initialsClassName="h-16 w-16 bg-sky-500"
          />
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700">Template Preview</div>
            <div className="text-3xl font-semibold tracking-tight">{documentLabel}</div>
            <div className="text-sm text-muted-foreground">
              {businessProfile?.company_name || "Your Business Name"} for {client?.name || "your client"}
            </div>
          </div>
        </div>

        <div className="grid min-w-[250px] gap-3 rounded-[28px] border border-sky-100 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Reference</p>
              <p className="text-xl font-semibold">{invoiceNumber || "INV-0001"}</p>
            </div>
            <Badge className="bg-sky-600 text-white hover:bg-sky-600">{formatInvoiceStatus(normalizedStatus)}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Invoice date</p>
              <p className="font-medium">{formatDate(invoiceDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Due date</p>
              <p className="font-medium">{formatDate(dueDate)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-sky-100 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Client</p>
          <div className="mt-4 space-y-1">
            <p className="text-lg font-semibold">{client?.name || "Client name"}</p>
            <p className="text-sm text-muted-foreground">{client?.company || "Client company"}</p>
            <p className="text-sm text-muted-foreground">{client?.email || "client@email.com"}</p>
            <p className="text-sm text-muted-foreground">{client?.phone || "+27 00 000 0000"}</p>
          </div>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Brand Block</p>
          <div className="mt-4">
            <BrandIdentity
              businessProfile={businessProfile}
              logoClassName="h-14 w-14 border-white/10 bg-white/5 p-2"
              initialsClassName="h-14 w-14 bg-white/10"
              detailTextClassName="text-white"
            />
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-sm text-slate-300">{businessProfile?.business_phone || "+27 00 000 0000"}</p>
            <p className="text-sm text-slate-300">{businessProfile?.business_address || "Business address will appear here"}</p>
          </div>
        </div>
      </div>

      <PreviewItemsTable currency={currency} items={safeLineItems} variant="studio" />

      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        {notes ? <PreviewNotes notes={notes} className="border-sky-100 bg-white/90" /> : <div />}
        <PreviewTotals
          currency={currency}
          subtotal={subtotal}
          discountAmount={discountAmount}
          discountType={discountType}
          discount={discount}
          total={total}
          className="border-sky-100 bg-white/90"
        />
      </div>
    </>
  );
}

function ExecutivePreview({
  businessProfile,
  client,
  documentLabel,
  invoiceNumber,
  invoiceDate,
  dueDate,
  currency,
  normalizedStatus,
  safeLineItems,
  subtotal,
  discountAmount,
  discountType,
  discount,
  total,
  notes,
}: TemplateBodyProps) {
  return (
    <>
      <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Enterprise Template</p>
            <BrandIdentity
              businessProfile={businessProfile}
              logoClassName="h-16 w-16 border-white/10 bg-white/5 p-3"
              initialsClassName="h-16 w-16 bg-white/10"
              detailTextClassName="text-white"
            />
            <p className="text-3xl font-semibold">{documentLabel}</p>
          </div>
          <div className="grid gap-3 md:text-right">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{documentLabel} Number</p>
              <p className="text-xl font-semibold">{invoiceNumber || "INV-0001"}</p>
            </div>
            <div className="flex items-center gap-3 md:justify-end">
              <Badge className="border border-white/20 bg-white/10 text-white hover:bg-white/10">
                {formatInvoiceStatus(normalizedStatus)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr_220px]">
        <PreviewPartyBlock
          label="Prepared For"
          title={client?.name || "Client name"}
          subtitle={client?.company}
          lines={[client?.email, client?.phone, client?.address]}
          className="border-slate-200 bg-white"
        />
        <PreviewPartyBlock
          label="Prepared By"
          title={businessProfile?.company_name || "Your business"}
          subtitle={businessProfile?.registration_number ? `Reg ${businessProfile.registration_number}` : undefined}
          lines={[businessProfile?.business_email, businessProfile?.business_phone, businessProfile?.business_address]}
          className="border-slate-200 bg-white"
        />
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Schedule</p>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Issued</p>
              <p className="font-semibold">{formatDate(invoiceDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Due</p>
              <p className="font-semibold">{formatDate(dueDate)}</p>
            </div>
          </div>
        </div>
      </div>

      <PreviewItemsTable currency={currency} items={safeLineItems} variant="executive" />

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        {notes ? <PreviewNotes notes={notes} className="border-slate-200 bg-slate-50" /> : <div />}
        <PreviewTotals
          currency={currency}
          subtotal={subtotal}
          discountAmount={discountAmount}
          discountType={discountType}
          discount={discount}
          total={total}
          className="border-slate-200 bg-slate-950 text-white"
          invert
        />
      </div>
    </>
  );
}

function PreviewPartyBlock({
  label,
  title,
  subtitle,
  lines,
  className,
}: {
  label: string;
  title?: string;
  subtitle?: string;
  lines: Array<string | undefined>;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border bg-muted/20 p-4", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <div className="mt-3 space-y-1">
        <p className="font-semibold">{title || "-"}</p>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        {lines.filter(Boolean).map((line, index) => (
          <p key={`${line}-${index}`} className="text-sm text-muted-foreground">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function PreviewItemsTable({
  items,
  currency,
  variant,
}: {
  items: PreviewLineItem[];
  currency: Currency;
  variant: "classic" | "studio" | "executive";
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border",
        variant === "classic" && "rounded-none border-border",
        variant === "studio" && "border-sky-100 bg-white/90 shadow-sm",
        variant === "executive" && "border-slate-200 bg-white",
      )}>
      <div
        className={cn(
          "grid grid-cols-12 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]",
          variant === "classic" && "border-b border-slate-200 bg-slate-50 text-slate-500",
          variant === "studio" && "bg-sky-600 text-white",
          variant === "executive" && "bg-slate-100 text-slate-600",
        )}>
        <div className="col-span-6">Description</div>
        <div className="col-span-2 text-right">Qty</div>
        <div className="col-span-2 text-right">Rate</div>
        <div className="col-span-2 text-right">Amount</div>
      </div>
      <div className="divide-y">
        {items.map((item, index) => {
          const amount = item.quantity * item.unitPrice;
          return (
            <div key={`${item.description}-${index}`} className="grid grid-cols-12 items-center px-4 py-4 text-sm">
              <div className="col-span-6">
                <p className="font-medium">{item.description}</p>
              </div>
              <div className="col-span-2 text-right text-muted-foreground">{item.quantity}</div>
              <div className="col-span-2 text-right text-muted-foreground">{formatMoney(item.unitPrice, currency)}</div>
              <div className="col-span-2 text-right font-semibold">{formatMoney(amount, currency)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PreviewTotals({
  currency,
  subtotal,
  discountAmount,
  discountType,
  discount,
  total,
  className,
  invert = false,
}: {
  currency: Currency;
  subtotal: number;
  discountAmount: number;
  discountType: "percentage" | "fixed";
  discount: number;
  total: number;
  className?: string;
  invert?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border bg-muted/20 p-5", className)}>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className={cn(!invert && "text-muted-foreground", invert && "text-slate-300")}>Subtotal</span>
          <span className="font-medium">{formatMoney(subtotal, currency)}</span>
        </div>
        {discountAmount > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <span className={cn(!invert && "text-muted-foreground", invert && "text-slate-300")}>
              Discount{discountType === "percentage" ? ` (${discount}%)` : ""}
            </span>
            <span className={cn("font-medium", invert ? "text-white" : "text-destructive")}>
              -{formatMoney(discountAmount, currency)}
            </span>
          </div>
        ) : null}
      </div>
      <Separator className={cn("my-4", invert && "bg-white/15")} />
      <div className="flex items-center justify-between gap-4">
        <span className="text-base font-semibold">Total</span>
        <span className="text-xl font-semibold">{formatMoney(total, currency)}</span>
      </div>
    </div>
  );
}

function PreviewNotes({ notes, className }: { notes: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl border bg-muted/20 p-5", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Notes</p>
      <p className="mt-3 text-sm leading-6">{notes}</p>
    </div>
  );
}
