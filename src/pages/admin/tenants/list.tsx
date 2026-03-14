import { useList, useUpdate } from "@refinedev/core";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { Profile, Subscription, Plan } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListView } from "@/components/refine-ui/views/list-view";
import { RefreshButton } from "@/components/refine-ui/buttons/refresh";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminRoute } from "@/lib/admin-routing";
import { downloadCsv } from "@/lib/csv";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Calendar, Mail, Building, Eye, ShieldBan, ShieldCheck, Trash2, Search, X, Download } from "lucide-react";
import { toast } from "sonner";

export function TenantListPage() {
  const navigate = useNavigate();
  const { mutate: updateProfile } = useUpdate();
  const { mutate: updateSubscription } = useUpdate();

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Local state for optimistic status overrides: tenantId -> status
  const [statusOverrides, setStatusOverrides] = useState<Record<string, "active" | "suspended" | "deleted">>({});

  // Confirmation dialog state
  const [pendingSuspend, setPendingSuspend] = useState<Profile | null>(null);
  const [pendingCancelPlan, setPendingCancelPlan] = useState<{ profile: Profile; subscription: Subscription } | null>(null);

  // Delete dialog state
  const [pendingDelete, setPendingDelete] = useState<Profile | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

  const getEffectiveStatus = (profile: Profile): "active" | "suspended" | "deleted" => {
    if (profile.id in statusOverrides) return statusOverrides[profile.id];
    return (profile.account_status as "active" | "suspended" | "deleted") ?? "active";
  };

  const handleSuspend = (profile: Profile) => setPendingSuspend(profile);

  const confirmSuspend = () => {
    if (!pendingSuspend) return;
    setStatusOverrides((prev) => ({
      ...prev,
      [pendingSuspend.id]: "suspended",
    }));
    updateProfile(
      {
        resource: "profiles",
        id: pendingSuspend.id,
        values: { account_status: "suspended" },
      },
      {
        onError: () => {
          setStatusOverrides((prev) => {
            const copy = { ...prev };
            delete copy[pendingSuspend.id];
            return copy;
          });
          toast.error("Failed to suspend account. Please try again.");
        },
      },
    );
    toast.success(`${pendingSuspend.full_name || "Tenant"}'s account has been suspended.`);
    setPendingSuspend(null);
  };

  const handleReactivate = (profile: Profile) => {
    setStatusOverrides((prev) => ({ ...prev, [profile.id]: "active" }));
    updateProfile(
      {
        resource: "profiles",
        id: profile.id,
        values: { account_status: "active" },
      },
      {
        onError: () => {
          setStatusOverrides((prev) => {
            const copy = { ...prev };
            delete copy[profile.id];
            return copy;
          });
          toast.error("Failed to reactivate account. Please try again.");
        },
      },
    );
    toast.success(`${profile.full_name || "Tenant"}'s account has been reactivated.`);
  };

  const handleDeleteOpen = (profile: Profile) => {
    setDeleteConfirmInput("");
    setPendingDelete(profile);
  };

  const confirmCancelPlan = () => {
    if (!pendingCancelPlan) return;
    const { profile, subscription } = pendingCancelPlan;

    updateSubscription(
      {
        resource: "subscriptions",
        id: subscription.id,
        values: {
          auto_renew: false,
          updated_at: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          const expiryDate = subscription.renewal_date || subscription.trial_end_date || subscription.end_date;
          toast.success(
            expiryDate
              ? `${profile.full_name || "Tenant"}'s plan will end on ${new Date(expiryDate).toLocaleDateString()}.`
              : `${profile.full_name || "Tenant"}'s plan has been cancelled at expiry.`,
          );
        },
        onError: () => {
          toast.error("Failed to cancel plan. Please try again.");
        },
      },
    );

    setPendingCancelPlan(null);
  };

  const deleteConfirmValue = pendingDelete?.full_name || pendingDelete?.business_email || "";
  const isDeleteConfirmed = deleteConfirmInput.trim().toLowerCase() === deleteConfirmValue.trim().toLowerCase();

  const confirmDelete = () => {
    if (!pendingDelete || !isDeleteConfirmed) return;
    setStatusOverrides((prev) => ({ ...prev, [pendingDelete.id]: "deleted" }));
    updateProfile(
      {
        resource: "profiles",
        id: pendingDelete.id,
        values: { account_status: "deleted" },
      },
      {
        onError: () => {
          setStatusOverrides((prev) => {
            const copy = { ...prev };
            delete copy[pendingDelete.id];
            return copy;
          });
          toast.error("Failed to delete tenant. Please try again.");
        },
      },
    );
    toast.success(`${pendingDelete.full_name || "Tenant"}'s account has been deleted.`);
    setPendingDelete(null);
  };

  // Fetch all profiles
  const { query: profilesQuery } = useList<Profile>({
    resource: "profiles",
    pagination: { pageSize: 1000 },
  });
  const profilesData = profilesQuery.data;
  const profilesLoading = profilesQuery.isLoading;

  // Fetch all subscriptions
  const { query: subscriptionsQuery } = useList<Subscription>({
    resource: "subscriptions",
    pagination: { pageSize: 1000 },
  });
  const subscriptionsData = subscriptionsQuery.data;
  const subscriptionsLoading = subscriptionsQuery.isLoading;

  // Collect unique plan IDs
  const planIds = useMemo(
    () => Array.from(new Set((subscriptionsData?.data ?? []).map((s: Subscription) => s.plan_id).filter(Boolean))),
    [subscriptionsData?.data],
  );

  // Fetch all plans
  const { query: plansQuery } = useList<Plan>({
    resource: "plans",
    pagination: { pageSize: 100 },
    queryOptions: { enabled: planIds.length > 0 },
  });
  const plansData = plansQuery.data;
  const plansLoading = plansQuery.isLoading;

  // Build lookup maps
  const subscriptionByUserId = useMemo(() => {
    const map: Record<string, Subscription> = {};
    (subscriptionsData?.data ?? []).forEach((s: Subscription) => {
      map[s.user_id] = s;
    });
    return map;
  }, [subscriptionsData?.data]);

  const planById = useMemo(() => {
    const map: Record<string, Plan> = {};
    (plansData?.data ?? []).forEach((p: Plan) => {
      map[p.id] = p;
    });
    return map;
  }, [plansData?.data]);

  const getPlanName = (profileId: string): string => {
    const sub = subscriptionByUserId[profileId];
    if (!sub) return "No Plan";
    return planById[sub.plan_id]?.name || "Unknown";
  };

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    const profiles = profilesData?.data ?? [];
    const q = searchQuery.toLowerCase().trim();

    return profiles.filter((profile: Profile) => {
      // Search filter
      if (q) {
        const nameMatch = (profile.full_name ?? "").toLowerCase().includes(q);
        const emailMatch = (profile.business_email ?? "").toLowerCase().includes(q);
        if (!nameMatch && !emailMatch) return false;
      }

      // Plan filter
      if (planFilter !== "all") {
        const planName = getPlanName(profile.id).toLowerCase();
        if (planName !== planFilter.toLowerCase()) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        const effective = getEffectiveStatus(profile);
        if (effective !== statusFilter) return false;
      }

      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilesData?.data, searchQuery, planFilter, statusFilter, subscriptionByUserId, planById, statusOverrides]);

  const hasActiveFilters = searchQuery !== "" || planFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setPlanFilter("all");
    setStatusFilter("all");
  };

  const exportUsersAsCsv = () => {
    if (filteredProfiles.length === 0) {
      toast.error("There are no tenants to export.");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Company",
      "Plan",
      "Subscription Status",
      "Auto Renew",
      "Account Status",
      "Role",
      "Phone",
      "Address",
      "Registration Number",
      "Currency",
      "Joined",
    ];

    const rows = filteredProfiles.map((profile) => {
      const subscription = subscriptionByUserId[profile.id];

      return [
        profile.full_name || "",
        profile.business_email || "",
        profile.company_name || "",
        getPlanName(profile.id),
        subscription?.status || "No Subscription",
        subscription ? (subscription.auto_renew === false ? "Disabled" : "Enabled") : "N/A",
        getEffectiveStatus(profile),
        profile.role,
        profile.business_phone || "",
        profile.business_address || "",
        profile.registration_number || "",
        profile.currency || "",
        profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "",
      ];
    });

    downloadCsv(`tenants_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
    toast.success(`Exported ${filteredProfiles.length} ${filteredProfiles.length === 1 ? "tenant" : "tenants"} to CSV.`);
  };

  const isLoading = profilesLoading || subscriptionsLoading || plansLoading;

  return (
    <ListView>
      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={!!pendingSuspend} onOpenChange={(open) => !open && setPendingSuspend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Account?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to suspend{" "}
              <strong>{pendingSuspend?.full_name || pendingSuspend?.business_email || "this tenant"}</strong>
              's account. They will immediately lose access to their dashboard and all platform features. You can
              reactivate their account at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmSuspend}>
              Suspend Account
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Tenant Account?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will soft-delete the account for{" "}
                  <strong>{pendingDelete?.full_name || pendingDelete?.business_email || "this tenant"}</strong>. Data is
                  retained for 30 days before permanent removal.
                </p>
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  ⚠ The tenant will immediately lose access to their dashboard and all platform features.
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-foreground">
                    Type <strong>{deleteConfirmValue}</strong> to confirm:
                  </p>
                  <Input
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder={deleteConfirmValue}
                    className="border-destructive/50 focus-visible:ring-destructive"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmInput("")}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={!isDeleteConfirmed} onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Tenant
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Plan Confirmation Dialog */}
      <AlertDialog open={!!pendingCancelPlan} onOpenChange={(open) => !open && setPendingCancelPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Plan at Expiry?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to cancel{" "}
              <strong>{pendingCancelPlan?.profile.full_name || pendingCancelPlan?.profile.business_email || "this tenant"}</strong>
              's plan. Their subscription will remain active until the current trial or billing period ends. No refund
              will be issued, and auto-renew will be turned off.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Plan Active</AlertDialogCancel>
            <Button variant="destructive" onClick={confirmCancelPlan}>
              Cancel Plan
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center relative gap-2">
          <div className="bg-background z-[2] pr-4">
            <Breadcrumb />
          </div>
          <Separator className="absolute left-0 right-0 z-[1]" />
        </div>
        <div className="flex justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Tenants
            </h2>
            <p className="text-muted-foreground">All registered businesses and users on the platform</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportUsersAsCsv} disabled={isLoading || filteredProfiles.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <RefreshButton resource="profiles" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="Trial">Trial</SelectItem>
            <SelectItem value="Starter">Starter</SelectItem>
            <SelectItem value="Pro">Pro</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}

        <p className="text-sm text-muted-foreground sm:ml-auto">
          {isLoading ? (
            "Loading..."
          ) : (
            <>
              <span className="font-medium">{filteredProfiles.length}</span>{" "}
              {filteredProfiles.length === 1 ? "tenant" : "tenants"} found
            </>
          )}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-5 bg-muted animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                  {hasActiveFilters ? "No tenants match your filters." : "No tenants found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredProfiles.map((profile: Profile) => {
                const effective = getEffectiveStatus(profile);
                const isDeleted = effective === "deleted";
                const sub = subscriptionByUserId[profile.id];
                const planName = getPlanName(profile.id);
                const canCancelPlan =
                  !!sub && (sub.status === "active" || sub.status === "trial") && sub.auto_renew !== false;

                const subStatusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                  active: "default",
                  trial: "secondary",
                  cancelled: "destructive",
                  expired: "outline",
                };

                return (
                  <TableRow key={profile.id}>
                    {/* Name */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium uppercase flex-shrink-0">
                          {profile.full_name ? profile.full_name.charAt(0) : "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{profile.full_name || "Unknown"}</div>
                          {profile.company_name && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <Building className="h-3 w-3 flex-shrink-0" />
                              {profile.company_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{profile.business_email || "N/A"}</span>
                      </div>
                    </TableCell>

                    {/* Plan */}
                    <TableCell>
                      <span className="font-medium">{planName}</span>
                    </TableCell>

                    {/* Subscription Status */}
                    <TableCell>
                      {sub ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant={subStatusVariants[sub.status] ?? "outline"}>
                            {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                          </Badge>
                          {sub.auto_renew === false && (sub.status === "active" || sub.status === "trial") ? (
                            <Badge variant="outline" className="w-fit text-amber-700 border-amber-600">
                              Ends at expiry
                            </Badge>
                          ) : null}
                        </div>
                      ) : (
                        <Badge variant="outline">No Subscription</Badge>
                      )}
                    </TableCell>

                    {/* Account Status */}
                    <TableCell>
                      {isDeleted ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          Deleted
                        </Badge>
                      ) : effective === "suspended" ? (
                        <Badge variant="destructive">Suspended</Badge>
                      ) : (
                        <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
                      )}
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      <Badge variant={profile.role === "admin" ? "default" : "outline"}>
                        {profile.role === "admin" ? "Admin" : "User"}
                      </Badge>
                    </TableCell>

                    {/* Joined */}
                    <TableCell>
                      {profile.created_at ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(profile.created_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(getAdminRoute(`/tenants/${profile.id}`))}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {!isDeleted && (
                          <>
                            {effective === "suspended" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleReactivate(profile)}>
                                <ShieldCheck className="h-4 w-4 mr-1" />
                                Reactivate
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive hover:bg-destructive/10"
                                onClick={() => handleSuspend(profile)}>
                                <ShieldBan className="h-4 w-4 mr-1" />
                                Suspend
                              </Button>
                            )}
                            {canCancelPlan && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-amber-700 border-amber-600 hover:bg-amber-50"
                                onClick={() => setPendingCancelPlan({ profile, subscription: sub })}>
                                Cancel Plan
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteOpen(profile)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </ListView>
  );
}

export default TenantListPage;
