import { useList } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  DollarSign,
  Activity,
  TrendingDown,
  Clock,
  TrendingUp,
  UserPlus,
  ArrowUp,
  ArrowDown,
  XCircle,
  Timer,
  CheckCircle,
  AlertTriangle,
  Download,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Subscription, Plan, SubscriptionHistory, Profile, TrialConversion } from "@/types";
import { Button } from "@/components/ui/button";

export const AdminDashboard = () => {
  // Fetch all profiles to count total clients
  const { result: profilesData, query: profilesQuery } = useList<Profile>({
    resource: "profiles",
    pagination: { mode: "off" },
  });

  // Fetch active subscriptions with plan data for MRR calculation
  const { result: activeSubscriptionsData, query: activeSubscriptionsQuery } = useList<Subscription>({
    resource: "subscriptions",
    filters: [{ field: "status", operator: "eq", value: "active" }],
    pagination: { mode: "off" },
    meta: {
      select: "*, plan:plans(*)",
    },
  });

  // Fetch all subscriptions to calculate churn rate
  const { result: allSubscriptionsData, query: allSubscriptionsQuery } = useList<Subscription>({
    resource: "subscriptions",
    pagination: { mode: "off" },
  });

  // Fetch recent subscription history
  const { result: subscriptionHistoryResult, query: subscriptionHistoryQuery } = useList<any>({
    resource: "subscription_history",
    pagination: { mode: "server", currentPage: 1, pageSize: 10 },
    sorters: [{ field: "changed_at", order: "desc" }],
    meta: {
      select:
        "*, old_plan:plans!subscription_history_old_plan_id_fkey(name), new_plan:plans!subscription_history_new_plan_id_fkey(name), profile:profiles!subscription_history_user_id_fkey(full_name)",
    },
  });

  // Fetch all subscription history for growth metrics (last 60 days)
  const { result: allSubscriptionHistoryResult, query: allSubscriptionHistoryQuery } = useList<SubscriptionHistory>({
    resource: "subscription_history",
    pagination: { mode: "off" },
    filters: [
      {
        field: "changed_at",
        operator: "gte",
        value: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // Last 60 days
      },
    ],
  });

  // Fetch trial conversion data
  const { result: trialConversionsResult, query: trialConversionsQuery } = useList<TrialConversion>({
    resource: "trial_conversions",
    pagination: { mode: "off" },
    meta: {
      select: "*, user:profiles(full_name, email)",
    },
  });

  // Fetch upcoming trial expirations (next 7 days)
  const { result: upcomingExpirationsResult, query: upcomingExpirationsQuery } = useList<TrialConversion>({
    resource: "trial_conversions",
    filters: [
      { field: "status", operator: "eq", value: "active_trial" },
      {
        field: "trial_end_date",
        operator: "lte",
        value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        field: "trial_end_date",
        operator: "gte",
        value: new Date().toISOString(),
      },
    ],
    sorters: [{ field: "trial_end_date", order: "asc" }],
    meta: {
      select: "*, user:profiles(full_name, email)",
    },
  });

  // Fetch failed conversions
  const { result: failedConversionsResult, query: failedConversionsQuery } = useList<TrialConversion>({
    resource: "trial_conversions",
    filters: [{ field: "status", operator: "eq", value: "failed" }],
    sorters: [{ field: "trial_end_date", order: "desc" }],
    pagination: { mode: "server", currentPage: 1, pageSize: 10 },
    meta: {
      select: "*, user:profiles(full_name, email)",
    },
  });

  const profiles = profilesData?.data || [];
  const activeSubscriptions = activeSubscriptionsData?.data || [];
  const allSubscriptions = allSubscriptionsData?.data || [];
  const subscriptionActivities = subscriptionHistoryResult?.data || [];
  const subscriptionHistoryLoading = subscriptionHistoryQuery.isLoading;
  const allSubscriptionHistory = allSubscriptionHistoryResult?.data || [];

  const trialConversions = trialConversionsResult?.data || [];
  const upcomingExpirations = upcomingExpirationsResult?.data || [];
  const failedConversions = failedConversionsResult?.data || [];

  // Calculate metrics
  const totalClients = profiles.length;
  const activeSubscriptionsCount = activeSubscriptions.length;

  // Calculate MRR (Monthly Recurring Revenue)
  const mrr = activeSubscriptions.reduce((sum: number, subscription: Subscription) => {
    if (subscription.plan) {
      const monthlyAmount =
        subscription.plan.billing_cycle === "yearly" ? subscription.plan.price / 12 : subscription.plan.price;
      return sum + monthlyAmount;
    }
    return sum;
  }, 0);

  // Calculate Churn Rate (cancelled / total subscriptions)
  const cancelledCount = allSubscriptions.filter((sub: Subscription) => sub.status === "cancelled").length;
  const churnRate = allSubscriptions.length > 0 ? (cancelledCount / allSubscriptions.length) * 100 : 0;

  const isLoading =
    profilesQuery.isLoading ||
    activeSubscriptionsQuery.isLoading ||
    allSubscriptionsQuery.isLoading ||
    subscriptionHistoryLoading ||
    allSubscriptionHistoryQuery.isLoading;

  // Calculate revenue chart data for last 6 months
  const revenueChartData = useMemo(() => {
    const now = new Date();
    const months: Array<{
      month: string;
      monthKey: string;
      Trial: number;
      Starter: number;
      Pro: number;
      Enterprise: number;
    }> = [];

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
      const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      months.push({
        month: monthLabel,
        monthKey,
        Trial: 0,
        Starter: 0,
        Pro: 0,
        Enterprise: 0,
      });
    }

    // Aggregate revenue by plan and month
    activeSubscriptions.forEach((subscription: Subscription) => {
      if (!subscription.plan || !subscription.start_date) return;

      const startDate = new Date(subscription.start_date);
      const monthKey = startDate.toISOString().substring(0, 7);

      const monthData = months.find((m) => m.monthKey === monthKey);
      if (monthData && subscription.plan.name) {
        const monthlyRevenue =
          subscription.plan.billing_cycle === "yearly" ? subscription.plan.price / 12 : subscription.plan.price;

        // Map plan name to chart key
        const planName = subscription.plan.name as "Trial" | "Starter" | "Pro" | "Enterprise";
        if (planName in monthData) {
          monthData[planName] += monthlyRevenue;
        }
      }
    });

    return months;
  }, [activeSubscriptions]);

  const hasRevenueData = revenueChartData.some(
    (data) => data.Trial > 0 || data.Starter > 0 || data.Pro > 0 || data.Enterprise > 0,
  );

  // Calculate plan distribution data
  const planDistributionData = useMemo(() => {
    const distribution = new Map<string, { name: string; value: number; color: string }>();

    activeSubscriptions.forEach((subscription: Subscription) => {
      if (subscription.plan?.name) {
        const planName = subscription.plan.name;
        const existing = distribution.get(planName);
        if (existing) {
          existing.value += 1;
        } else {
          // Assign colors based on plan tier
          let color = "var(--chart-1)";
          if (planName === "Starter") color = "var(--chart-2)";
          if (planName === "Pro") color = "var(--chart-3)";
          if (planName === "Enterprise") color = "var(--chart-4)";

          distribution.set(planName, {
            name: planName,
            value: 1,
            color,
          });
        }
      }
    });

    return Array.from(distribution.values());
  }, [activeSubscriptions]);

  const totalActiveSubscriptions = planDistributionData.reduce((sum, item) => sum + item.value, 0);

  // Calculate growth metrics
  const growthMetrics = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // New Clients this month
    const newClientsThisMonth = profiles.filter((profile) => {
      const createdAt = new Date(profile.created_at || "");
      return createdAt >= currentMonthStart;
    }).length;

    const newClientsPreviousMonth = profiles.filter((profile) => {
      const createdAt = new Date(profile.created_at || "");
      return createdAt >= previousMonthStart && createdAt <= previousMonthEnd;
    }).length;

    const newClientsChange =
      newClientsPreviousMonth === 0
        ? newClientsThisMonth > 0
          ? 100
          : 0
        : ((newClientsThisMonth - newClientsPreviousMonth) / newClientsPreviousMonth) * 100;

    // Upgrades this month
    const upgradesThisMonth = allSubscriptionHistory.filter((history) => {
      const changedAt = new Date(history.changed_at);
      return history.action_type === "upgraded" && changedAt >= currentMonthStart;
    }).length;

    const upgradesPreviousMonth = allSubscriptionHistory.filter((history) => {
      const changedAt = new Date(history.changed_at);
      return history.action_type === "upgraded" && changedAt >= previousMonthStart && changedAt <= previousMonthEnd;
    }).length;

    const upgradesChange =
      upgradesPreviousMonth === 0
        ? upgradesThisMonth > 0
          ? 100
          : 0
        : ((upgradesThisMonth - upgradesPreviousMonth) / upgradesPreviousMonth) * 100;

    // Downgrades this month
    const downgradesThisMonth = allSubscriptionHistory.filter((history) => {
      const changedAt = new Date(history.changed_at);
      return history.action_type === "downgraded" && changedAt >= currentMonthStart;
    }).length;

    const downgradesPreviousMonth = allSubscriptionHistory.filter((history) => {
      const changedAt = new Date(history.changed_at);
      return history.action_type === "downgraded" && changedAt >= previousMonthStart && changedAt <= previousMonthEnd;
    }).length;

    const downgradesChange =
      downgradesPreviousMonth === 0
        ? downgradesThisMonth > 0
          ? 100
          : 0
        : ((downgradesThisMonth - downgradesPreviousMonth) / downgradesPreviousMonth) * 100;

    // Cancellations this month
    const cancellationsThisMonth = allSubscriptionHistory.filter((history) => {
      const changedAt = new Date(history.changed_at);
      return history.action_type === "cancelled" && changedAt >= currentMonthStart;
    }).length;

    const cancellationsPreviousMonth = allSubscriptionHistory.filter((history) => {
      const changedAt = new Date(history.changed_at);
      return history.action_type === "cancelled" && changedAt >= previousMonthStart && changedAt <= previousMonthEnd;
    }).length;

    const cancellationsChange =
      cancellationsPreviousMonth === 0
        ? cancellationsThisMonth > 0
          ? 100
          : 0
        : ((cancellationsThisMonth - cancellationsPreviousMonth) / cancellationsPreviousMonth) * 100;

    return {
      newClients: { count: newClientsThisMonth, change: newClientsChange },
      upgrades: { count: upgradesThisMonth, change: upgradesChange },
      downgrades: { count: downgradesThisMonth, change: downgradesChange },
      cancellations: { count: cancellationsThisMonth, change: cancellationsChange },
    };
  }, [profiles, allSubscriptionHistory]);

  // Helper function to format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString();
  };

  // Helper function to get action type badge variant and label
  const getActionTypeBadge = (actionType: string) => {
    switch (actionType) {
      case "created":
        return { variant: "default" as const, label: "New Subscription" };
      case "upgraded":
        return { variant: "secondary" as const, label: "Upgraded" };
      case "downgraded":
        return { variant: "secondary" as const, label: "Downgraded" };
      case "plan_changed":
        return { variant: "secondary" as const, label: "Plan Changed" };
      case "cancelled":
        return { variant: "destructive" as const, label: "Cancelled" };
      case "status_changed":
        return { variant: "outline" as const, label: "Status Changed" };
      default:
        return { variant: "outline" as const, label: actionType };
    }
  };

  // Format action type for display
  const formatActionType = (
    actionType: string,
  ): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } => {
    switch (actionType) {
      case "upgraded":
        return { label: "Upgraded", variant: "default" };
      case "downgraded":
        return { label: "Downgraded", variant: "secondary" };
      case "cancelled":
        return { label: "Cancelled", variant: "destructive" };
      case "created":
        return { label: "New Subscription", variant: "outline" };
      case "plan_changed":
        return { label: "Plan Changed", variant: "default" };
      case "status_changed":
        return { label: "Status Changed", variant: "secondary" };
      default:
        return { label: actionType, variant: "outline" };
    }
  };

  // Calculate trial conversion metrics
  const trialMetrics = {
    activeTrials: trialConversions.filter((tc) => tc.status === "active_trial").length,
    converted: trialConversions.filter((tc) => tc.status === "converted").length,
    cancelled: trialConversions.filter((tc) => tc.status === "cancelled").length,
    failed: trialConversions.filter((tc) => tc.status === "failed").length,
    total: trialConversions.length,
  };

  const conversionRate =
    trialMetrics.total > 0
      ? ((trialMetrics.converted / (trialMetrics.total - trialMetrics.activeTrials)) * 100).toFixed(1)
      : "0.0";

  const isTrialLoading =
    trialConversionsQuery.isLoading || upcomingExpirationsQuery.isLoading || failedConversionsQuery.isLoading;

  // CSV Export function
  const exportTrialAnalytics = () => {
    const headers = [
      "User Name",
      "Email",
      "Status",
      "Trial Start Date",
      "Trial End Date",
      "Conversion Date",
      "Days in Trial",
      "Failure Reason",
      "Notes",
    ];

    const rows = trialConversions.map((tc) => {
      const trialStart = new Date(tc.trial_start_date);
      const trialEnd = new Date(tc.trial_end_date);
      const daysInTrial = Math.ceil((trialEnd.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));

      return [
        (tc.user as any)?.full_name || "N/A",
        (tc.user as any)?.email || "N/A",
        tc.status,
        trialStart.toLocaleDateString(),
        trialEnd.toLocaleDateString(),
        tc.conversion_date ? new Date(tc.conversion_date).toLocaleDateString() : "N/A",
        daysInTrial.toString(),
        tc.failure_reason || "N/A",
        tc.notes || "",
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `trial_analytics_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <span className="inline-flex items-center rounded-md bg-purple-100 dark:bg-purple-900/30 px-2.5 py-0.5 text-xs font-semibold text-purple-800 dark:text-purple-300 ring-1 ring-inset ring-purple-600/20 dark:ring-purple-400/30">
          ADMIN
        </span>
      </div>
      <p className="text-muted-foreground">Platform-wide analytics and management tools</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <span className="text-muted-foreground">Loading...</span> : totalClients}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <span className="text-muted-foreground">Loading...</span> : formatCurrency(mrr)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From active subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <span className="text-muted-foreground">Loading...</span> : activeSubscriptionsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <span className="text-muted-foreground">Loading...</span> : `${churnRate.toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cancelledCount} of {allSubscriptions.length} cancelled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trial Conversions Overview */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Trial Conversions</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">14-day trial conversion tracking and analytics</p>
          </div>
          <Button onClick={exportTrialAnalytics} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Active Trials */}
            <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span>Active Trials</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                  {isTrialLoading ? "-" : trialMetrics.activeTrials}
                </div>
                <div className="text-xs text-muted-foreground">Currently in trial period</div>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>Conversion Rate</span>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                  {isTrialLoading ? "-" : `${conversionRate}%`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {trialMetrics.converted} of {trialMetrics.total - trialMetrics.activeTrials} completed trials
                </div>
              </div>
            </div>

            {/* Upcoming Expirations */}
            <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Expiring Soon</span>
                </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">
                  {isTrialLoading ? "-" : upcomingExpirations.length}
                </div>
                <div className="text-xs text-muted-foreground">Next 7 days</div>
              </div>
            </div>

            {/* Failed Conversions */}
            <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Failed Conversions</span>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-500">
                  {isTrialLoading ? "-" : trialMetrics.failed}
                </div>
                <div className="text-xs text-muted-foreground">Requires attention</div>
              </div>
            </div>
          </div>

          {/* Upcoming Expirations List */}
          {upcomingExpirations.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3">Upcoming Trial Expirations (Next 7 Days)</h3>
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                {upcomingExpirations.map((trial) => {
                  const daysUntilExpiry = Math.ceil(
                    (new Date(trial.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                  );
                  return (
                    <div
                      key={trial.id}
                      className="flex items-center justify-between pb-3 border-b last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{(trial.user as any)?.full_name || "Unknown User"}</div>
                        <div className="text-xs text-muted-foreground">{(trial.user as any)?.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-orange-600 dark:text-orange-500">
                          {daysUntilExpiry === 0
                            ? "Today"
                            : daysUntilExpiry === 1
                              ? "Tomorrow"
                              : `${daysUntilExpiry} days`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(trial.trial_end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Failed Conversions List */}
          {failedConversions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3">Failed Conversions Requiring Attention</h3>
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                {failedConversions.map((trial) => {
                  return (
                    <div
                      key={trial.id}
                      className="flex items-center justify-between pb-3 border-b last:border-0 last:pb-0">
                      <div className="space-y-1 flex-1">
                        <div className="font-medium text-sm">{(trial.user as any)?.full_name || "Unknown User"}</div>
                        <div className="text-xs text-muted-foreground">{(trial.user as any)?.email}</div>
                        {trial.failure_reason && (
                          <div className="text-xs text-red-600 dark:text-red-500 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {trial.failure_reason}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(trial.trial_end_date), { addSuffix: true })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Growth Metrics Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Growth Metrics</CardTitle>
          <p className="text-sm text-muted-foreground">Current month performance vs previous month</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* New Clients */}
            <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserPlus className="h-4 w-4" />
                  <span>New Clients</span>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                  {isLoading ? "-" : growthMetrics.newClients.count}
                </div>
                {!isLoading && (
                  <div className="flex items-center gap-1 text-xs">
                    {growthMetrics.newClients.change >= 0 ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-green-600 dark:text-green-500" />
                        <span className="text-green-600 dark:text-green-500">
                          {growthMetrics.newClients.change.toFixed(0)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-3 w-3 text-red-600 dark:text-red-500" />
                        <span className="text-red-600 dark:text-red-500">
                          {Math.abs(growthMetrics.newClients.change).toFixed(0)}%
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                )}
              </div>
            </div>

            {/* Upgrades */}
            <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Upgrades</span>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-500">
                  {isLoading ? "-" : growthMetrics.upgrades.count}
                </div>
                {!isLoading && (
                  <div className="flex items-center gap-1 text-xs">
                    {growthMetrics.upgrades.change >= 0 ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-green-600 dark:text-green-500" />
                        <span className="text-green-600 dark:text-green-500">
                          {growthMetrics.upgrades.change.toFixed(0)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-3 w-3 text-red-600 dark:text-red-500" />
                        <span className="text-red-600 dark:text-red-500">
                          {Math.abs(growthMetrics.upgrades.change).toFixed(0)}%
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                )}
              </div>
            </div>

            {/* Downgrades */}
            <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingDown className="h-4 w-4" />
                  <span>Downgrades</span>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-500">
                  {isLoading ? "-" : growthMetrics.downgrades.count}
                </div>
                {!isLoading && (
                  <div className="flex items-center gap-1 text-xs">
                    {growthMetrics.downgrades.change >= 0 ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-red-600 dark:text-red-500" />
                        <span className="text-red-600 dark:text-red-500">
                          {growthMetrics.downgrades.change.toFixed(0)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-3 w-3 text-green-600 dark:text-green-500" />
                        <span className="text-green-600 dark:text-green-500">
                          {Math.abs(growthMetrics.downgrades.change).toFixed(0)}%
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cancellations */}
            <div className="flex items-start justify-between p-4 rounded-lg border bg-card">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <XCircle className="h-4 w-4" />
                  <span>Cancellations</span>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-500">
                  {isLoading ? "-" : growthMetrics.cancellations.count}
                </div>
                {!isLoading && (
                  <div className="flex items-center gap-1 text-xs">
                    {growthMetrics.cancellations.change >= 0 ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-red-600 dark:text-red-500" />
                        <span className="text-red-600 dark:text-red-500">
                          {growthMetrics.cancellations.change.toFixed(0)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-3 w-3 text-green-600 dark:text-green-500" />
                        <span className="text-green-600 dark:text-green-500">
                          {Math.abs(growthMetrics.cancellations.change).toFixed(0)}%
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Revenue by Plan Tier</CardTitle>
          <p className="text-sm text-muted-foreground">Last 6 months income breakdown</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Loading chart data...</p>
            </div>
          ) : !hasRevenueData ? (
            <div className="h-[400px] flex flex-col items-center justify-center gap-2">
              <DollarSign className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No revenue data available</p>
              <p className="text-sm text-muted-foreground">Revenue will appear here once subscriptions are active</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("en-ZA", {
                      style: "currency",
                      currency: "ZAR",
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(value)
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <p className="font-medium mb-2">{label}</p>
                        {payload.map((entry: any) => (
                          <div key={entry.name} className="flex items-center gap-2 text-sm">
                            <div className="h-3 w-3 rounded" style={{ backgroundColor: entry.fill }} />
                            <span className="text-muted-foreground">{entry.name}:</span>
                            <span className="font-medium">
                              {new Intl.NumberFormat("en-ZA", {
                                style: "currency",
                                currency: "ZAR",
                              }).format(entry.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: "20px",
                  }}
                />
                <Bar dataKey="Trial" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Starter" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pro" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Enterprise" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Plan Distribution Chart and Recent Activities Grid */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {/* Plan Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">Active subscriptions by tier</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading chart data...</p>
              </div>
            ) : planDistributionData.length === 0 ? (
              <div className="h-[350px] flex flex-col items-center justify-center gap-2">
                <Activity className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No active subscriptions</p>
                <p className="text-sm text-muted-foreground">
                  Distribution will appear here once subscriptions are active
                </p>
              </div>
            ) : (
              <div className="relative">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={planDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      innerRadius={60}
                      fill="var(--chart-1)"
                      dataKey="value"
                      strokeWidth={2}
                      stroke="var(--background)">
                      {planDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const data = payload[0].payload;
                        const percentage = ((data.value / totalActiveSubscriptions) * 100).toFixed(1);
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-md">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="h-3 w-3 rounded" style={{ backgroundColor: data.color }} />
                              <span className="font-medium">{data.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {data.value} {data.value === 1 ? "subscription" : "subscriptions"} ({percentage}%)
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      content={({ payload }) => (
                        <div className="flex flex-wrap justify-center gap-4 pt-4">
                          {payload?.map((entry: any, index: number) => (
                            <div key={`legend-${index}`} className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded" style={{ backgroundColor: entry.color }} />
                              <span className="text-sm text-muted-foreground">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label showing total */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <div className="text-3xl font-bold">{totalActiveSubscriptions}</div>
                  <div className="text-sm text-muted-foreground">Total Active</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Subscription Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Subscription Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionHistoryLoading ? (
              <div className="text-sm text-muted-foreground">Loading activities...</div>
            ) : subscriptionActivities.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent activities</div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {subscriptionActivities.map((activity: any) => {
                  const actionInfo = formatActionType(activity.action_type);
                  const clientName = activity.profile?.full_name || "Unknown Client";
                  const planName = activity.new_plan?.name || activity.old_plan?.name || "N/A";
                  const timeAgo = formatDistanceToNow(new Date(activity.changed_at), { addSuffix: true });

                  return (
                    <div key={activity.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{clientName}</span>
                          <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {activity.action_type === "upgraded" || activity.action_type === "downgraded" ? (
                            <>
                              {activity.old_plan?.name} → {activity.new_plan?.name}
                            </>
                          ) : (
                            planName
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
