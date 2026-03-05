import { useOne, useList, useUpdate } from "@refinedev/core";
import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import type { Profile, Subscription, Plan } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  CreditCard,
  ShieldBan,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export function TenantShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutate: updateProfile } = useUpdate();

  // Local status override for optimistic updates
  const [statusOverride, setStatusOverride] = useState<"active" | "suspended" | "deleted" | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

  const { query: profileQuery } = useOne<Profile>({
    resource: "profiles",
    id: id!,
  });
  const profile = profileQuery.data?.data;
  const profileLoading = profileQuery.isLoading;

  const { query: subscriptionsQuery } = useList<Subscription>({
    resource: "subscriptions",
    filters: [{ field: "user_id", operator: "eq", value: id }],
    pagination: { pageSize: 10 },
    queryOptions: { enabled: !!id },
  });
  const subscription = subscriptionsQuery.data?.data?.[0];
  const subscriptionsLoading = subscriptionsQuery.isLoading;

  const { query: planQuery } = useOne<Plan>({
    resource: "plans",
    id: subscription?.plan_id ?? "",
    queryOptions: { enabled: !!subscription?.plan_id },
  });
  const plan = planQuery.data?.data;

  const effectiveStatus: "active" | "suspended" | "deleted" =
    statusOverride ?? (profile?.account_status as "active" | "suspended" | "deleted") ?? "active";

  const handleSuspendConfirm = () => {
    if (!profile) return;
    setStatusOverride("suspended");
    updateProfile(
      { resource: "profiles", id: profile.id, values: { account_status: "suspended" } },
      {
        onError: () => {
          setStatusOverride(null);
          toast.error("Failed to suspend account. Please try again.");
        },
      },
    );
    toast.success(`${profile.full_name || "Tenant"}'s account has been suspended.`);
    setSuspendDialogOpen(false);
  };

  const handleReactivate = () => {
    if (!profile) return;
    setStatusOverride("active");
    updateProfile(
      { resource: "profiles", id: profile.id, values: { account_status: "active" } },
      {
        onError: () => {
          setStatusOverride(null);
          toast.error("Failed to reactivate account. Please try again.");
        },
      },
    );
    toast.success(`${profile.full_name || "Tenant"}'s account has been reactivated.`);
  };

  const deleteConfirmValue = profile?.full_name || profile?.business_email || "";
  const isDeleteConfirmed = deleteConfirmInput.trim().toLowerCase() === deleteConfirmValue.trim().toLowerCase();

  const handleDeleteOpen = () => {
    setDeleteConfirmInput("");
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!profile || !isDeleteConfirmed) return;
    setStatusOverride("deleted");
    updateProfile(
      { resource: "profiles", id: profile.id, values: { account_status: "deleted" } },
      {
        onSuccess: () => {
          toast.success(`${profile.full_name || "Tenant"}'s account has been deleted.`);
          navigate("/admin/tenants");
        },
        onError: () => {
          setStatusOverride(null);
          toast.error("Failed to delete tenant. Please try again.");
        },
      },
    );
    setDeleteDialogOpen(false);
  };

  const subscriptionStatusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    trial: "secondary",
    cancelled: "destructive",
    expired: "outline",
  };

  if (profileLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-muted-foreground">Loading tenant details...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-muted-foreground">Tenant not found.</div>
      </div>
    );
  }

  const isDeleted = effectiveStatus === "deleted";

  return (
    <div className="p-6 space-y-6">
      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Account?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to suspend <strong>{profile.full_name || profile.business_email || "this tenant"}</strong>
              's account. They will immediately lose access to their dashboard and all platform features. You can
              reactivate their account at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleSuspendConfirm}>
              Suspend Account
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteDialogOpen(false);
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
                  <strong>{profile.full_name || profile.business_email || "this tenant"}</strong>. Data is retained for
                  30 days before permanent removal.
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

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center relative gap-2">
          <div className="bg-background z-[2] pr-4">
            <Breadcrumb />
          </div>
          <Separator className="absolute left-0 right-0 z-[1]" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/tenants")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-bold uppercase">
              {profile.full_name ? profile.full_name.charAt(0) : "?"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{profile.full_name || "Unknown Tenant"}</h2>
                {isDeleted ? (
                  <Badge variant="outline" className="text-muted-foreground">
                    Deleted
                  </Badge>
                ) : effectiveStatus === "suspended" ? (
                  <Badge variant="destructive">Suspended</Badge>
                ) : (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    Active
                  </Badge>
                )}
              </div>
              {profile.company_name && (
                <p className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Building className="h-3 w-3" />
                  {profile.company_name}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!isDeleted && (
            <div className="flex items-center gap-2">
              {effectiveStatus === "suspended" ? (
                <Button
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  onClick={handleReactivate}>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Reactivate Account
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => setSuspendDialogOpen(true)}>
                  <ShieldBan className="h-4 w-4 mr-2" />
                  Suspend Account
                </Button>
              )}
              <Button variant="destructive" onClick={handleDeleteOpen}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Tenant
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <div className="text-muted-foreground text-xs">Email</div>
                <div>{profile.business_email || "N/A"}</div>
              </div>
            </div>
            {profile.business_phone && (
              <div className="flex items-start gap-2 text-sm">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-muted-foreground text-xs">Phone</div>
                  <div>{profile.business_phone}</div>
                </div>
              </div>
            )}
            {profile.business_address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-muted-foreground text-xs">Address</div>
                  <div>{profile.business_address}</div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2 text-sm">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <div className="text-muted-foreground text-xs">Joined</div>
                <div>{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}</div>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <div className="text-muted-foreground text-xs">Role</div>
                <div>
                  <Badge variant={profile.role === "admin" ? "default" : "outline"}>
                    {profile.role === "admin" ? "Admin" : "User"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscriptionsLoading ? (
              <div className="text-muted-foreground text-sm">Loading subscription...</div>
            ) : subscription ? (
              <>
                <div className="text-sm">
                  <div className="text-muted-foreground text-xs">Plan</div>
                  <div className="font-medium">{plan?.name || "Unknown Plan"}</div>
                </div>
                <div className="text-sm">
                  <div className="text-muted-foreground text-xs">Status</div>
                  <Badge variant={subscriptionStatusVariants[subscription.status] ?? "outline"}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </Badge>
                </div>
                {plan?.price !== undefined && (
                  <div className="text-sm">
                    <div className="text-muted-foreground text-xs">Price</div>
                    <div>
                      R{Number(plan.price).toFixed(2)} / {plan.billing_cycle || "month"}
                    </div>
                  </div>
                )}
                {subscription.start_date && (
                  <div className="text-sm">
                    <div className="text-muted-foreground text-xs">Start Date</div>
                    <div>{new Date(subscription.start_date).toLocaleDateString()}</div>
                  </div>
                )}
                {subscription.end_date && (
                  <div className="text-sm">
                    <div className="text-muted-foreground text-xs">
                      {subscription.status === "trial" ? "Trial Ends" : "Renewal Date"}
                    </div>
                    <div>{new Date(subscription.end_date).toLocaleDateString()}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-muted-foreground text-sm">No active subscription found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TenantShowPage;
