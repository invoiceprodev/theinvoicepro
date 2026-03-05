import { useTable } from "@refinedev/react-table";
import { useMany } from "@refinedev/core";
import { flexRender } from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import type { Subscription, Plan, Profile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListView } from "@/components/refine-ui/views/list-view";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { RefreshButton } from "@/components/refine-ui/buttons/refresh";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { ManageSubscriptionModal } from "@/components/manage-subscription-modal";
import {
  DataTableFilterDropdownText,
  DataTableFilterCombobox,
} from "@/components/refine-ui/data-table/data-table-filter";
import { formatCurrency } from "@/lib/utils";
import { Settings, CreditCard } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useUpdate, useNotification } from "@refinedev/core";
import { useCreate } from "@refinedev/core";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { openSubscriptionPayment, isPayFastConfigured, getPayFastStatus } from "@/services/payfast.service";

const columnHelper = createColumnHelper<Subscription>();

// Status badge variant mapping
const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trial: "secondary",
  cancelled: "destructive",
  expired: "outline",
};

export default function SubscriptionListPage() {
  const [selectedSubscription, setSelectedSubscription] = useState<{
    subscription: Subscription;
    currentPlan: Plan;
    profile: Profile;
  } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "cancel" | "reactivate" | "extend-trial";
    subscription: Subscription;
    days?: number;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [payingSubscriptionId, setPayingSubscriptionId] = useState<string | null>(null);

  const { mutate: updateSubscription } = useUpdate();
  const { open: openNotification } = useNotification();
  const { mutate: createPayment } = useCreate();

  const {
    reactTable: { setOptions },
    refineCore: {
      tableQuery: { data: tableData },
    },
  } = useTable<Subscription>({
    columns: [],
    refineCoreProps: {
      resource: "subscriptions",
    },
  });

  // Extract unique user_ids and plan_ids for fetching related data
  const userIds = useMemo(
    () => tableData?.data?.map((subscription) => subscription.user_id).filter(Boolean) ?? [],
    [tableData?.data],
  );

  const planIds = useMemo(
    () => tableData?.data?.map((subscription) => subscription.plan_id).filter(Boolean) ?? [],
    [tableData?.data],
  );

  // Fetch related profiles (users)
  const {
    result: profilesResult,
    query: { isLoading: profilesIsLoading },
  } = useMany<Profile>({
    resource: "profiles",
    ids: userIds,
    queryOptions: {
      enabled: userIds.length > 0,
    },
  });

  // Fetch related plans
  const {
    result: plansResult,
    query: { isLoading: plansIsLoading },
  } = useMany<Plan>({
    resource: "plans",
    ids: planIds,
    queryOptions: {
      enabled: planIds.length > 0,
    },
  });

  // Update table meta with related data
  useEffect(() => {
    setOptions((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        profilesData: profilesResult?.data,
        plansData: plansResult?.data,
        profilesIsLoading,
        plansIsLoading,
      },
    }));
  }, [setOptions, profilesResult?.data, plansResult?.data, profilesIsLoading, plansIsLoading]);

  // Get unique plans for filter options
  const planFilterOptions = useMemo(() => {
    if (!plansResult?.data) return [];
    return plansResult.data.map((plan: Plan) => ({
      label: plan.name,
      value: plan.id,
    }));
  }, [plansResult?.data]);

  const handleActionConfirm = () => {
    if (!confirmAction) return;

    const { type, subscription, days } = confirmAction;
    let values: Partial<Subscription> = {};
    let successMessage = "";

    switch (type) {
      case "cancel":
        values = { status: "cancelled", updated_at: new Date().toISOString() };
        successMessage = "Subscription cancelled successfully";
        break;
      case "reactivate":
        values = { status: "active", updated_at: new Date().toISOString() };
        successMessage = "Subscription reactivated successfully";
        break;
      case "extend-trial":
        if (days && subscription.renewal_date) {
          const renewalDate = new Date(subscription.renewal_date);
          renewalDate.setDate(renewalDate.getDate() + days);
          values = {
            renewal_date: renewalDate.toISOString().split("T")[0],
            updated_at: new Date().toISOString(),
          };
          successMessage = `Trial extended by ${days} days`;
        }
        break;
    }

    updateSubscription(
      {
        resource: "subscriptions",
        id: subscription.id,
        values,
      },
      {
        onSuccess: () => {
          openNotification?.({
            type: "success",
            message: "Success",
            description: successMessage,
          });
          setConfirmAction(null);
        },
        onError: (error) => {
          openNotification?.({
            type: "error",
            message: "Action Failed",
            description: error.message || "Failed to update subscription",
          });
        },
      },
    );
  };

  const handlePayNow = async (subscription: Subscription, plan: Plan, profile: Profile) => {
    if (!isPayFastConfigured()) {
      const status = getPayFastStatus();
      openNotification?.({
        type: "error",
        message: "PayFast Not Configured",
        description: status.message,
      });
      return;
    }

    setPayingSubscriptionId(subscription.id);

    try {
      // Create pending payment record
      createPayment(
        {
          resource: "payments",
          values: {
            subscription_id: subscription.id,
            user_id: subscription.user_id,
            amount: plan.price,
            currency: plan.currency,
            payment_method: "payfast",
            status: "pending",
            created_at: new Date().toISOString(),
          },
        },
        {
          onSuccess: (data) => {
            // Open PayFast payment in new window
            const paymentWindow = openSubscriptionPayment({
              subscription,
              plan,
              profile,
            });

            if (paymentWindow) {
              openNotification?.({
                type: "success",
                message: "Payment Initiated",
                description: "PayFast checkout opened in new window.",
              });
            } else {
              openNotification?.({
                type: "error",
                message: "Popup Blocked",
                description: "Please allow popups to complete payment.",
              });
            }
          },
          onError: (error) => {
            openNotification?.({
              type: "error",
              message: "Payment Failed",
              description: error.message || "Failed to create payment record",
            });
          },
          onSettled: () => {
            setPayingSubscriptionId(null);
          },
        },
      );
    } catch (error) {
      console.error("Error initiating payment:", error);
      openNotification?.({
        type: "error",
        message: "Payment Error",
        description: "An unexpected error occurred",
      });
      setPayingSubscriptionId(null);
    }
  };

  const columns = [
    columnHelper.accessor("user_id", {
      id: "client_name",
      header: ({ column, table }) => (
        <div className="flex items-center gap-1">
          <span>Client Name</span>
          <DataTableFilterDropdownText
            defaultOperator="contains"
            column={column}
            table={table}
            placeholder="Search name..."
          />
        </div>
      ),
      cell: (info) => {
        const userId = info.getValue();
        const meta = info.table.options.meta as {
          profilesData?: Profile[];
          profilesIsLoading?: boolean;
        };

        if (meta?.profilesIsLoading) return <span className="text-muted-foreground">Loading...</span>;

        const profile = meta?.profilesData?.find((p) => p.id === userId);
        return <span className="font-medium">{profile?.full_name || "N/A"}</span>;
      },
    }),
    columnHelper.accessor("user_id", {
      id: "client_email",
      header: "Email",
      cell: (info) => {
        const userId = info.getValue();
        const meta = info.table.options.meta as {
          profilesData?: Profile[];
          profilesIsLoading?: boolean;
        };

        if (meta?.profilesIsLoading) return <span className="text-muted-foreground">Loading...</span>;

        const profile = meta?.profilesData?.find((p) => p.id === userId);
        return <span className="text-sm text-muted-foreground">{profile?.business_email || "N/A"}</span>;
      },
    }),
    columnHelper.accessor("plan_id", {
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <span>Plan</span>
          <DataTableFilterCombobox column={column} defaultOperator="eq" multiple={false} options={planFilterOptions} />
        </div>
      ),
      cell: (info) => {
        const planId = info.getValue();
        const meta = info.table.options.meta as {
          plansData?: Plan[];
          plansIsLoading?: boolean;
        };

        if (meta?.plansIsLoading) return <span className="text-muted-foreground">Loading...</span>;

        const plan = meta?.plansData?.find((p) => p.id === planId);
        return <span className="font-medium">{plan?.name || "N/A"}</span>;
      },
    }),
    columnHelper.accessor("status", {
      header: ({ column }) => (
        <div className="flex items-center gap-1">
          <span>Status</span>
          <DataTableFilterCombobox
            column={column}
            defaultOperator="eq"
            multiple={false}
            options={[
              { label: "Active", value: "active" },
              { label: "Trial", value: "trial" },
              { label: "Cancelled", value: "cancelled" },
              { label: "Expired", value: "expired" },
            ]}
          />
        </div>
      ),
      cell: (info) => {
        const status = info.getValue();
        return (
          <Badge variant={statusVariants[status] || "outline"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("renewal_date", {
      header: "Renewal Date",
      cell: (info) => {
        const date = info.getValue();
        if (!date) return <span className="text-muted-foreground">N/A</span>;
        return <span>{new Date(date).toLocaleDateString()}</span>;
      },
    }),
    columnHelper.accessor("plan_id", {
      id: "amount",
      header: "Amount",
      cell: (info) => {
        const planId = info.getValue();
        const meta = info.table.options.meta as {
          plansData?: Plan[];
          plansIsLoading?: boolean;
        };

        if (meta?.plansIsLoading) return <span className="text-muted-foreground">Loading...</span>;

        const plan = meta?.plansData?.find((p) => p.id === planId);
        if (!plan) return <span className="text-muted-foreground">N/A</span>;

        // Convert to ZAR if needed or use plan currency
        const amount = plan.price;
        return <span className="font-semibold">{formatCurrency(amount)}</span>;
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => {
        const subscription = info.row.original;
        const meta = info.table.options.meta as {
          profilesData?: Profile[];
          plansData?: Plan[];
        };

        const profile = meta?.profilesData?.find((p) => p.id === subscription.user_id);
        const plan = meta?.plansData?.find((p) => p.id === subscription.plan_id);

        if (!profile || !plan) {
          return <span className="text-muted-foreground text-sm">Loading...</span>;
        }

        const isActive = subscription.status === "active";
        const isTrial = subscription.status === "trial";
        const isCancelled = subscription.status === "cancelled";
        const isExpired = subscription.status === "expired";
        const isPaying = payingSubscriptionId === subscription.id;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => handlePayNow(subscription, plan, profile)}
              disabled={isPaying || isUpdating}>
              <CreditCard className="h-4 w-4 mr-1" />
              {isPaying ? "Processing..." : "Pay Now"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedSubscription({
                  subscription,
                  currentPlan: plan,
                  profile,
                })
              }>
              <Settings className="h-4 w-4 mr-1" />
              Manage
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isUpdating}>
                  Quick Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {(isActive || isTrial) && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={() => setConfirmAction({ type: "cancel", subscription })}>
                    Cancel Subscription
                  </DropdownMenuItem>
                )}

                {(isCancelled || isExpired) && (
                  <DropdownMenuItem onSelect={() => setConfirmAction({ type: "reactivate", subscription })}>
                    Reactivate Subscription
                  </DropdownMenuItem>
                )}

                {isTrial && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs">Extend Trial</DropdownMenuLabel>
                    <DropdownMenuItem
                      onSelect={() => setConfirmAction({ type: "extend-trial", subscription, days: 7 })}>
                      + 7 days
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setConfirmAction({ type: "extend-trial", subscription, days: 14 })}>
                      + 14 days
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setConfirmAction({ type: "extend-trial", subscription, days: 30 })}>
                      + 30 days
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }),
  ];

  const table = useTable({
    columns,
    refineCoreProps: {
      resource: "subscriptions",
    },
  });

  return (
    <>
      <ListView>
        <div className="flex flex-col gap-4">
          <div className="flex items-center relative gap-2">
            <div className="bg-background z-[2] pr-4">
              <Breadcrumb />
            </div>
            <Separator className="absolute left-0 right-0 z-[1]" />
          </div>
          <div className="flex justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Client Subscriptions</h2>
              <p className="text-muted-foreground">Manage all client subscriptions and plans</p>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton resource="subscriptions" />
            </div>
          </div>
        </div>
        <DataTable table={table} />
      </ListView>

      {selectedSubscription && (
        <ManageSubscriptionModal
          subscription={selectedSubscription.subscription}
          currentPlan={selectedSubscription.currentPlan}
          profile={selectedSubscription.profile}
          open={!!selectedSubscription}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSubscription(null);
            }
          }}
        />
      )}

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "cancel" && "Cancel Subscription"}
              {confirmAction?.type === "reactivate" && "Reactivate Subscription"}
              {confirmAction?.type === "extend-trial" && "Extend Trial Period"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "cancel" &&
                "This will cancel the subscription. The client will lose access at the end of their billing period. This action can be undone by reactivating."}
              {confirmAction?.type === "reactivate" &&
                "This will reactivate the subscription and restore client access. The renewal date will remain unchanged."}
              {confirmAction?.type === "extend-trial" &&
                `This will extend the trial period by ${confirmAction?.days} days. The renewal date will be updated accordingly.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActionConfirm}
              disabled={isUpdating}
              className={confirmAction?.type === "cancel" ? "bg-destructive hover:bg-destructive/90" : ""}>
              {isUpdating ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
