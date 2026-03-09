import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Building2,
  Calculator,
  BarChart3,
  SlidersHorizontal,
  ChevronRight,
  Upload,
  X,
  Save,
  Info,
  Download,
  FileText,
  FileSpreadsheet,
  CalendarRange,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useVatSettings } from "@/providers/vat-settings";
import { useAuth } from "@/contexts/auth-context";
import { sendAuth0PasswordResetEmail } from "@/lib/auth0-db";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSubscriptionState } from "@/hooks/use-subscription-state";
import { getPlanEntitlements } from "@/lib/plan-entitlements";
import { apiRequest } from "@/lib/api-client";
import { getProfileBridgeSnapshot, setProfileBridgeSnapshot, subscribeProfileBridge } from "@/lib/profile-bridge";
import type { Profile } from "@/types";

type Tab = "company" | "tax" | "reports" | "general";

const tabs: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: "company",
    label: "Company",
    icon: <Building2 className="h-4 w-4" />,
    description: "Business details & branding",
  },
  {
    id: "tax",
    label: "Tax & VAT",
    icon: <Calculator className="h-4 w-4" />,
    description: "VAT configuration & rates",
  },
  {
    id: "reports",
    label: "Reports",
    icon: <BarChart3 className="h-4 w-4" />,
    description: "Export options & date ranges",
  },
  {
    id: "general",
    label: "General",
    icon: <SlidersHorizontal className="h-4 w-4" />,
    description: "App preferences & defaults",
  },
];

// ─── Company Tab ────────────────────────────────────────────────────────────
type CompanyInfo = {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  registrationNumber: string;
  taxId: string;
};

const defaultCompanyInfo: CompanyInfo = {
  name: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  registrationNumber: "",
  taxId: "",
};

function serializeBusinessAddress(info: CompanyInfo) {
  return [info.street, info.city, info.state, info.zip, info.country].map((value) => value.trim()).join("\n");
}

function deserializeBusinessAddress(address?: string | null) {
  const [street = "", city = "", state = "", zip = "", country = ""] = String(address || "").split("\n");
  return { street, city, state, zip, country };
}

function getCompanyInfoFromProfile(profile?: Profile | null): CompanyInfo {
  const address = deserializeBusinessAddress(profile?.business_address);

  return {
    name: profile?.company_name || "",
    email: profile?.business_email || "",
    phone: profile?.business_phone || "",
    street: address.street,
    city: address.city,
    state: address.state,
    zip: address.zip,
    country: address.country,
    registrationNumber: profile?.registration_number || "",
    taxId: "",
  };
}

function CompanyTab() {
  const { subscription } = useSubscriptionState();
  const entitlements = getPlanEntitlements(subscription?.plan);
  const [profileSnapshot, setLocalProfileSnapshot] = useState(getProfileBridgeSnapshot());
  const canRemoveBranding = entitlements.removeBranding;
  const [logo, setLogo] = useState<string | null>(profileSnapshot.profile?.logo_url || null);
  const [info, setInfo] = useState<CompanyInfo>(defaultCompanyInfo);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => subscribeProfileBridge(setLocalProfileSnapshot), []);

  useEffect(() => {
    if (!profileSnapshot.profile) return;
    setInfo(getCompanyInfoFromProfile(profileSnapshot.profile));
    setLogo(profileSnapshot.profile.logo_url || null);
  }, [profileSnapshot.profile]);

  const syncProfile = (profile: Profile) => {
    const current = getProfileBridgeSnapshot();
    setProfileBridgeSnapshot({
      ...current,
      isLoading: false,
      profile,
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) {
      toast.error("Unsupported logo format", {
        description: "Use PNG, JPG, WEBP, or SVG.",
      });
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo file too large", {
        description: "Use an image up to 2MB.",
      });
      e.target.value = "";
      return;
    }

    try {
      setIsUploadingLogo(true);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(String(event.target?.result || ""));
        reader.onerror = () => reject(new Error("Failed to read the selected image."));
        reader.readAsDataURL(file);
      });

      const response = await apiRequest<{ profile: Profile; logoUrl: string }>("/settings/company/logo", {
        method: "POST",
        body: JSON.stringify({
          dataUrl,
          fileName: file.name,
          contentType: file.type,
        }),
      });

      setLogo(response.logoUrl);
      syncProfile(response.profile);
      toast.success("Logo uploaded", {
        description: "Your company logo is now available in the dashboard.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload logo.";
      toast.error("Logo upload failed", {
        description: message,
      });
    } finally {
      setIsUploadingLogo(false);
    }

    e.target.value = "";
  };

  const handleChange = (field: keyof CompanyInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfo((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleRemoveLogo = async () => {
    try {
      setIsUploadingLogo(true);
      const response = await apiRequest<{ profile: Profile }>("/settings/company/logo", {
        method: "DELETE",
      });
      setLogo(null);
      syncProfile(response.profile);
      toast.success("Logo removed", {
        description: "The dashboard branding was updated.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to remove logo.";
      toast.error("Logo removal failed", {
        description: message,
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await apiRequest<{ profile: Profile }>("/settings/company", {
        method: "PATCH",
        body: JSON.stringify({
          companyName: info.name,
          businessEmail: info.email,
          businessPhone: info.phone,
          businessAddress: serializeBusinessAddress(info),
          registrationNumber: info.registrationNumber,
        }),
      });

      syncProfile(response.profile);
      setSaved(true);
      toast.success("Company details saved", {
        description: "Your business branding details have been updated.",
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save company details.";
      toast.error("Save failed", {
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Company Information</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This information appears on your invoices and client-facing documents.
        </p>
      </div>

      {!canRemoveBranding && (
        <Alert>
          <AlertTitle>InvoicePro footer remains on this plan</AlertTitle>
          <AlertDescription>
            You can still upload a company logo and company name for the dashboard. Pro and Enterprise remove the
            InvoicePro footer from invoice outputs.
          </AlertDescription>
        </Alert>
      )}

      {/* Logo Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Company Logo</CardTitle>
          <CardDescription>Upload your company logo. It will appear on all invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {logo ? (
                <img src={logo} alt="Company logo" className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploadingLogo}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {isUploadingLogo ? "Uploading..." : "Upload Logo"}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              {logo && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleRemoveLogo}
                  disabled={isUploadingLogo}>
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Remove
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Business Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" placeholder="Acme Corp" value={info.name} onChange={handleChange("name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-email">Email Address</Label>
              <Input
                id="company-email"
                type="email"
                placeholder="billing@acme.com"
                value={info.email}
                onChange={handleChange("email")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-phone">Phone Number</Label>
              <Input
                id="company-phone"
                placeholder="+27 11 000 0000"
                value={info.phone}
                onChange={handleChange("phone")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="registration-number">Registration Number</Label>
              <Input
                id="registration-number"
                placeholder="2020/123456/07"
                value={info.registrationNumber}
                onChange={handleChange("registrationNumber")}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="tax-id">Tax ID / VAT Number</Label>
              <Input id="tax-id" placeholder="4123456789" value={info.taxId} onChange={handleChange("taxId")} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Business Address</CardTitle>
          <CardDescription>Used on invoices and official documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="street">Street Address</Label>
            <Input id="street" placeholder="123 Main Street" value={info.street} onChange={handleChange("street")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="Johannesburg" value={info.city} onChange={handleChange("city")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State / Province</Label>
              <Input id="state" placeholder="Gauteng" value={info.state} onChange={handleChange("state")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip">Postal / ZIP Code</Label>
              <Input id="zip" placeholder="2001" value={info.zip} onChange={handleChange("zip")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="South Africa" value={info.country} onChange={handleChange("country")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        {saved ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Changes saved successfully
          </p>
        ) : (
          <span />
        )}
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// ─── Tax & VAT Tab ───────────────────────────────────────────────────────────
function TaxVatTab() {
  const { settings, saveSettings } = useVatSettings();

  const [vatEnabled, setVatEnabled] = useState(settings.vatEnabled);
  const [vatRate, setVatRate] = useState(String(settings.vatRate));
  const [vatNumber, setVatNumber] = useState(settings.vatNumber);
  const [saved, setSaved] = useState(false);

  const parsedRate = Math.max(0, Math.min(100, parseFloat(vatRate) || 0));

  const handleSave = () => {
    saveSettings({ vatEnabled, vatRate: parsedRate, vatNumber });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Tax & VAT Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure VAT rates and tax applicability for your invoices.
        </p>
      </div>

      {/* VAT Toggle Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">VAT / Tax</CardTitle>
              <CardDescription className="mt-0.5">
                Automatically apply VAT to all new invoices when enabled.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Switch id="vat-toggle" checked={vatEnabled} onCheckedChange={setVatEnabled} aria-label="Toggle VAT" />
              <Badge variant={vatEnabled ? "default" : "secondary"}>{vatEnabled ? "Enabled" : "Disabled"}</Badge>
            </div>
          </div>
        </CardHeader>

        {vatEnabled && (
          <>
            <Separator />
            <CardContent className="pt-5 space-y-5">
              {/* Notice banner */}
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-4">
                <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  VAT is <strong>enabled</strong>. All new invoices will automatically have VAT applied at the rate
                  configured below.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* VAT Rate */}
                <div className="space-y-1.5">
                  <Label htmlFor="vat-rate">Default VAT Rate (%)</Label>
                  <div className="relative">
                    <Input
                      id="vat-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={vatRate}
                      onChange={(e) => setVatRate(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Standard South African VAT rate is 15%</p>
                </div>

                {/* VAT Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="vat-number">VAT Registration Number</Label>
                  <Input
                    id="vat-number"
                    placeholder="4123456789"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Printed on invoices when provided</p>
                </div>
              </div>

              {/* Live preview */}
              <div className="rounded-lg bg-muted/50 border border-border p-4">
                <p className="text-sm font-semibold mb-3">Invoice Preview</p>
                <div className="text-sm text-muted-foreground space-y-1.5">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>ZAR 1,000.00</span>
                  </div>
                  <div className="flex justify-between text-foreground">
                    <span>VAT ({parsedRate}%)</span>
                    <span>ZAR {(parsedRate * 10).toFixed(2)}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-semibold text-foreground text-base">
                    <span>Total</span>
                    <span>ZAR {(1000 + parsedRate * 10).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {!vatEnabled && (
          <CardContent className="pt-0 pb-4">
            <p className="text-sm text-muted-foreground italic">
              VAT is currently disabled. New invoices will not include VAT charges.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Expense Tax Applicability */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Expense Tax Applicability</CardTitle>
          <CardDescription>Control which expense categories are subject to VAT.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {["Operating Costs", "Subscriptions", "Salaries", "Other Expenses"].map((category) => (
            <div key={category} className="flex items-center justify-between py-1">
              <span className="text-sm">{category}</span>
              <Switch defaultChecked={category !== "Salaries"} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        {saved ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            VAT settings saved successfully
          </p>
        ) : (
          <span />
        )}
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ─── Reports Tab ─────────────────────────────────────────────────────────────
function ReportsTab() {
  const [dateRange, setDateRange] = useState("this-month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const dateRangeLabel: Record<string, string> = {
    "this-month": "This Month",
    "last-3-months": "Last 3 Months",
    "last-6-months": "Last 6 Months",
    custom: "Custom Range",
  };

  const handleExport = (reportName: string, format: "PDF" | "CSV") => {
    const key = `${reportName}-${format}`;
    setExporting(key);
    const rangeLabel =
      dateRange === "custom" && customFrom && customTo
        ? `${customFrom} → ${customTo}`
        : (dateRangeLabel[dateRange] ?? dateRange);

    setTimeout(() => {
      setExporting(null);
      toast.success(`${reportName} exported as ${format}`, {
        description: `Period: ${rangeLabel}. Your file is ready to download.`,
        duration: 4000,
      });
    }, 1200);
  };

  const handleSave = () => {
    setSaved(true);
    toast.success("Report preferences saved", {
      description: "Your default date range has been updated.",
      duration: 3000,
    });
    setTimeout(() => setSaved(false), 3000);
  };

  const reports = [
    {
      id: "revenue-report",
      label: "Revenue Report",
      description: "Total income, invoice amounts, and payment breakdown",
      icon: <BarChart3 className="h-5 w-5 text-emerald-500" />,
    },
    {
      id: "expense-report",
      label: "Expense Report",
      description: "All outgoing payments grouped by category",
      icon: <FileText className="h-5 w-5 text-rose-500" />,
    },
    {
      id: "vat-summary",
      label: "VAT Summary",
      description: "VAT collected, VAT on expenses, and net VAT payable",
      icon: <FileSpreadsheet className="h-5 w-5 text-blue-500" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select a date range and export financial reports in your preferred format.
        </p>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Date Range</CardTitle>
          </div>
          <CardDescription>Choose the reporting period for all exports below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { value: "this-month", label: "This Month" },
              { value: "last-3-months", label: "Last 3 Months" },
              { value: "last-6-months", label: "Last 6 Months" },
              { value: "custom", label: "Custom" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                  dateRange === opt.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted",
                )}>
                {opt.label}
              </button>
            ))}
          </div>

          {dateRange === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="custom-from">From</Label>
                <Input
                  id="custom-from"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custom-to">To</Label>
                <Input id="custom-to" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Reports */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Export Reports</CardTitle>
          </div>
          <CardDescription>
            Download reports for{" "}
            <span className="font-medium text-foreground">
              {dateRange === "custom" && customFrom && customTo
                ? `${customFrom} → ${customTo}`
                : dateRangeLabel[dateRange]}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between py-3 px-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-3">
                {report.icon}
                <div>
                  <p className="text-sm font-medium">{report.label}</p>
                  <p className="text-xs text-muted-foreground">{report.description}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={exporting === `${report.label}-PDF`}
                  onClick={() => handleExport(report.label, "PDF")}>
                  <FileText className="h-3.5 w-3.5" />
                  {exporting === `${report.label}-PDF` ? "Exporting…" : "PDF"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={exporting === `${report.label}-CSV`}
                  onClick={() => handleExport(report.label, "CSV")}>
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  {exporting === `${report.label}-CSV` ? "Exporting…" : "CSV"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        {saved ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Preferences saved
          </p>
        ) : (
          <span />
        )}
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

// ─── General Tab ─────────────────────────────────────────────────────────────
type GeneralSettings = {
  currency: string;
  language: string;
  invoicePrefix: string;
  paymentTerms: string;
  defaultNotes: string;
  defaultTerms: string;
};

const defaultGeneralSettings: GeneralSettings = {
  currency: "ZAR",
  language: "en",
  invoicePrefix: "INV-",
  paymentTerms: "30",
  defaultNotes: "Thank you for your business!",
  defaultTerms: "",
};

function GeneralTab() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<GeneralSettings>(defaultGeneralSettings);
  const [saved, setSaved] = useState(false);
  const [passwordResetPending, setPasswordResetPending] = useState(false);

  const handleChange = (field: keyof GeneralSettings) => (value: string) =>
    setSettings((prev) => ({ ...prev, [field]: value }));

  const handleInputChange =
    (field: keyof GeneralSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setSettings((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = () => {
    setSaved(true);
    toast.success("General settings saved", {
      description: "Your preferences have been updated successfully.",
      duration: 3000,
    });
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast.error("No account email found", {
        description: "Your account email is missing, so a password reset link could not be sent.",
      });
      return;
    }

    try {
      setPasswordResetPending(true);
      await sendAuth0PasswordResetEmail({
        appKind: "customer",
        email: user.email,
      });
      toast.success("Password reset email sent", {
        description: `A secure password reset link was sent to ${user.email}.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send password reset email.";
      toast.error("Password reset failed", {
        description: message,
      });
    } finally {
      setPasswordResetPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">General Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure app-wide defaults for currency, language, and invoice preferences.
        </p>
      </div>

      {/* Localization */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Localization</CardTitle>
          <CardDescription>Set your preferred currency and language.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="default-currency">Default Currency</Label>
            <Select value={settings.currency} onValueChange={handleChange("currency")}>
              <SelectTrigger id="default-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ZAR">ZAR — South African Rand</SelectItem>
                <SelectItem value="USD">USD — US Dollar</SelectItem>
                <SelectItem value="EUR">EUR — Euro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="language">Language</Label>
            <Select value={settings.language} onValueChange={handleChange("language")}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account Security</CardTitle>
          <CardDescription>Manage your login email and send yourself a password reset link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="account-email">Account Email</Label>
            <Input id="account-email" value={user?.email || ""} disabled readOnly />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Passwords are managed by Auth0. Use the reset email flow to set a new password securely.
            </p>
            <Button variant="outline" onClick={handlePasswordReset} disabled={passwordResetPending || !user?.email}>
              {passwordResetPending ? "Sending link..." : "Change Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Defaults */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Invoice Defaults</CardTitle>
          <CardDescription>These values are pre-filled when creating a new invoice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="invoice-prefix">Invoice Number Prefix</Label>
              <Input
                id="invoice-prefix"
                placeholder="INV-"
                value={settings.invoicePrefix}
                onChange={handleInputChange("invoicePrefix")}
              />
              <p className="text-xs text-muted-foreground">e.g. {settings.invoicePrefix || "INV-"}0001</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-terms">Default Payment Terms</Label>
              <Select value={settings.paymentTerms} onValueChange={handleChange("paymentTerms")}>
                <SelectTrigger id="payment-terms">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Net 7 days</SelectItem>
                  <SelectItem value="14">Net 14 days</SelectItem>
                  <SelectItem value="30">Net 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="default-notes">Default Invoice Notes</Label>
            <Textarea
              id="default-notes"
              placeholder="Thank you for your business!"
              value={settings.defaultNotes}
              onChange={handleInputChange("defaultNotes")}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="default-terms">Default Terms & Conditions</Label>
            <Textarea
              id="default-terms"
              placeholder="Payment is due within the agreed payment terms…"
              value={settings.defaultTerms}
              onChange={handleInputChange("defaultTerms")}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        {saved ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Changes saved successfully
          </p>
        ) : (
          <span />
        )}
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ─── Main Settings Page ──────────────────────────────────────────────────────
export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("company");

  const activeTabInfo = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className="flex h-full min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-card/40">
        <div className="p-5 border-b border-border">
          <h1 className="text-base font-semibold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your preferences</p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                activeTab === tab.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-foreground hover:bg-muted",
              )}>
              <span
                className={cn(
                  "shrink-0",
                  activeTab === tab.id ? "text-sidebar-primary-foreground" : "text-muted-foreground",
                )}>
                {tab.icon}
              </span>
              <span className="truncate">{tab.label}</span>
              {activeTab === tab.id && <ChevronRight className="h-3.5 w-3.5 ml-auto shrink-0" />}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-card border-t border-border flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
              activeTab === tab.id ? "text-primary font-medium" : "text-muted-foreground",
            )}>
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="md:hidden px-4 pt-4 pb-2 border-b border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            {activeTabInfo.icon}
            <span className="text-sm font-medium text-foreground">{activeTabInfo.label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{activeTabInfo.description}</p>
        </div>

        <div className="p-6 max-w-3xl pb-24 md:pb-6">
          {activeTab === "company" && <CompanyTab />}
          {activeTab === "tax" && <TaxVatTab />}
          {activeTab === "reports" && <ReportsTab />}
          {activeTab === "general" && <GeneralTab />}
        </div>
      </main>
    </div>
  );
}
