import { useState, useEffect } from "react";
import { useGetIdentity, useNotification } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings, User, Bell, AlertTriangle, Download, Shield, Lock } from "lucide-react";

type Identity = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export default function AdminSettingsPage() {
  const { data: identity } = useGetIdentity<Identity>();
  const { open } = useNotification();

  // ── Platform Settings State ──────────────────────────────────────────────
  const [platformSettings, setPlatformSettings] = useState({
    platformName: "TheInvoicePro",
    supportEmail: "support@theinvoicepro.co.za",
    defaultCurrency: "ZAR",
    platformUrl: "https://theinvoicepro.co.za",
  });

  // ── Change Password State ────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  // ── Notification Preferences State ──────────────────────────────────────
  const [notifications, setNotifications] = useState({
    newTenantSignup: true,
    subscriptionChange: true,
    failedPayment: true,
    trialExpiry: false,
  });

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSavePlatformSettings = () => {
    open?.({
      type: "success",
      message: "Platform settings saved",
      description: "Your platform configuration has been updated.",
    });
  };

  const handleSavePassword = () => {
    setPasswordError("");
    if (!passwordForm.currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    open?.({
      type: "success",
      message: "Password updated",
      description: "Your admin password has been changed successfully.",
    });
  };

  const handleSaveNotifications = () => {
    open?.({
      type: "success",
      message: "Notification preferences saved",
      description: "Your notification settings have been updated.",
    });
  };

  const handleExportData = () => {
    const mockData = {
      exportedAt: new Date().toISOString(),
      platform: platformSettings.platformName,
      note: "This is a mock export — full data export will be available in a future release.",
    };
    const blob = new Blob([JSON.stringify(mockData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `platform-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    open?.({
      type: "success",
      message: "Export started",
      description: "Platform data export has been downloaded.",
    });
  };

  return (
    <TooltipProvider>
      <div className="p-6 max-w-3xl">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-7 w-7" />
          <h1 className="text-3xl font-bold">Admin Settings</h1>
        </div>
        <p className="text-muted-foreground mb-8">Platform-wide configuration and preferences</p>

        <div className="space-y-8">
          {/* ── 1. Platform Settings ───────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Platform Settings</CardTitle>
              </div>
              <CardDescription>Core configuration for the InvoicePro platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                  value={platformSettings.platformName}
                  onChange={(e) => setPlatformSettings((s) => ({ ...s, platformName: e.target.value }))}
                  placeholder="TheInvoicePro"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={platformSettings.supportEmail}
                  onChange={(e) => setPlatformSettings((s) => ({ ...s, supportEmail: e.target.value }))}
                  placeholder="support@theinvoicepro.co.za"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <Select
                  value={platformSettings.defaultCurrency}
                  onValueChange={(val) => setPlatformSettings((s) => ({ ...s, defaultCurrency: val }))}>
                  <SelectTrigger id="defaultCurrency" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ZAR">ZAR — South African Rand</SelectItem>
                    <SelectItem value="USD">USD — US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR — Euro</SelectItem>
                    <SelectItem value="GBP">GBP — British Pound</SelectItem>
                    <SelectItem value="AUD">AUD — Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="platformUrl">Platform URL</Label>
                <Input
                  id="platformUrl"
                  type="url"
                  value={platformSettings.platformUrl}
                  onChange={(e) => setPlatformSettings((s) => ({ ...s, platformUrl: e.target.value }))}
                  placeholder="https://theinvoicepro.co.za"
                />
              </div>

              <div className="pt-2">
                <Button onClick={handleSavePlatformSettings}>Save Platform Settings</Button>
              </div>
            </CardContent>
          </Card>

          {/* ── 2. Admin Account ───────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Admin Account</CardTitle>
              </div>
              <CardDescription>Your admin identity and password management.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Identity */}
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{identity?.name ?? "—"}</span>
                    {identity?.role === "admin" && (
                      <Badge className="text-xs shrink-0 bg-purple-600 hover:bg-purple-700">Admin</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{identity?.email ?? "—"}</p>
                </div>
              </div>

              <Separator />

              {/* Change Password */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm">Change Password</h3>
                </div>

                <div className="mt-3 space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                  {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                  <Button onClick={handleSavePassword} variant="outline">
                    Update Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── 3. Notification Preferences ────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
              <CardDescription>Choose which platform events you want to be notified about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* New Tenant Signup */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">New tenant signup</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive an alert when a new business registers on the platform.
                  </p>
                </div>
                <Switch
                  checked={notifications.newTenantSignup}
                  onCheckedChange={(val) => setNotifications((n) => ({ ...n, newTenantSignup: val }))}
                />
              </div>

              <Separator />

              {/* Subscription upgrade/downgrade */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Subscription upgrade / downgrade</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when a tenant changes their subscription plan.
                  </p>
                </div>
                <Switch
                  checked={notifications.subscriptionChange}
                  onCheckedChange={(val) => setNotifications((n) => ({ ...n, subscriptionChange: val }))}
                />
              </div>

              <Separator />

              {/* Failed payment */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Failed payment</Label>
                  <p className="text-xs text-muted-foreground">
                    Alert when a subscription payment fails or is declined.
                  </p>
                </div>
                <Switch
                  checked={notifications.failedPayment}
                  onCheckedChange={(val) => setNotifications((n) => ({ ...n, failedPayment: val }))}
                />
              </div>

              <Separator />

              {/* Trial expiry alerts */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Trial expiry alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive a digest of trials expiring in the next 7 days.
                  </p>
                </div>
                <Switch
                  checked={notifications.trialExpiry}
                  onCheckedChange={(val) => setNotifications((n) => ({ ...n, trialExpiry: val }))}
                />
              </div>

              <div className="pt-2">
                <Button onClick={handleSaveNotifications}>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>

          {/* ── 4. Danger Zone ─────────────────────────────────────────────── */}
          <Card className="border-destructive/40">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription>Irreversible or sensitive platform actions. Use with caution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Export All Data */}
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span className="font-medium text-sm">Export All Data</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Download a full JSON export of platform configuration and analytics data.
                  </p>
                </div>
                <Button variant="outline" className="shrink-0" onClick={handleExportData}>
                  Export All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
