import { useList } from "@refinedev/core";
import { useNavigation } from "@refinedev/core";
import {
  DollarSign,
  Clock,
  FileText,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  UserPlus,
  CreditCard,
  FilePlus,
  BarChart2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import type { Invoice, Client } from "@/types";
import { normalizeClientStatus, normalizeInvoiceStatus } from "@/types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type TrendDirection = "up" | "down" | "neutral";

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  trend: {
    direction: TrendDirection;
    label: string;
  };
  badge?: {
    label: string;
    className: string;
  };
}

function MetricCard({ title, value, icon, iconBg, trend, badge }: MetricCardProps) {
  const TrendIcon = trend.direction === "up" ? TrendingUp : trend.direction === "down" ? TrendingDown : Minus;

  const trendColor =
    trend.direction === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend.direction === "down"
        ? "text-red-500 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {badge && (
            <Badge variant="secondary" className={`mb-0.5 text-xs ${badge.className}`}>
              {badge.label}
            </Badge>
          )}
        </div>
        <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
          <TrendIcon className="h-3 w-3" />
          <span>{trend.label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Build last-6-months labels + lookup keys relative to a reference date
function getLast6Months(referenceDate: Date) {
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    months.push({ key, label });
  }
  return months;
}

const STATUS_COLORS: Record<string, string> = {
  Paid: "var(--chart-1)",
  Sent: "var(--chart-2)",
  Draft: "var(--chart-3)",
  Overdue: "var(--chart-4)",
};

const STATUS_ORDER = ["Paid", "Sent", "Draft", "Overdue"];

interface RevenueBarChartProps {
  invoices: Invoice[];
}

function RevenueBarChart({ invoices }: RevenueBarChartProps) {
  // Use March 2024 as reference to match mock data dates
  const referenceDate = new Date(2024, 2, 1); // March 2024
  const months = getLast6Months(referenceDate);

  const revenueByMonth: Record<string, number> = {};
  months.forEach(({ key }) => (revenueByMonth[key] = 0));

  invoices
    .filter((inv) => normalizeInvoiceStatus(inv.status) === "paid")
    .forEach((inv) => {
      const key = inv.invoice_date.slice(0, 7); // "YYYY-MM"
      if (key in revenueByMonth) {
        revenueByMonth[key] += inv.total;
      }
    });

  const data = months.map(({ key, label }) => ({
    month: label,
    revenue: revenueByMonth[key],
  }));

  const hasData = data.some((d) => d.revenue > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Monthly Revenue</CardTitle>
        <CardDescription>Revenue from paid invoices — last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No paid invoice data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                tickFormatter={(v) =>
                  v === 0
                    ? "R0"
                    : new Intl.NumberFormat("en-ZA", {
                        notation: "compact",
                        style: "currency",
                        currency: "ZAR",
                        maximumFractionDigits: 0,
                      }).format(v as number)
                }
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={56}
                className="fill-muted-foreground"
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="border-border/50 bg-background rounded-lg border px-3 py-2 text-xs shadow-xl">
                      <p className="font-medium mb-1">{label}</p>
                      <p className="text-muted-foreground">
                        Revenue:{" "}
                        <span className="text-foreground font-mono font-medium">
                          {formatCurrency(payload[0].value as number)}
                        </span>
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

interface StatusDonutChartProps {
  invoices: Invoice[];
}

function StatusDonutChart({ invoices }: StatusDonutChartProps) {
  const counts: Record<string, number> = {};
  STATUS_ORDER.forEach((s) => (counts[s] = 0));
  invoices.forEach((inv) => {
    const normalized = normalizeInvoiceStatus(inv.status);
    if (normalized in counts) counts[normalized]++;
  });

  const data = STATUS_ORDER.filter((s) => counts[s] > 0).map((status) => ({
    name: status,
    value: counts[status],
  }));

  const total = invoices.length;

  const renderCustomLegend = () => (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pt-3">
      {data.map((entry) => (
        <div key={entry.name} className="flex items-center gap-1.5 text-xs">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: STATUS_COLORS[entry.name] }}
          />
          <span className="text-muted-foreground">
            {entry.name} <span className="text-foreground font-medium tabular-nums">({entry.value})</span>
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Invoice Status Breakdown</CardTitle>
        <CardDescription>
          Distribution across all {total} invoice{total !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No invoice data available
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0];
                    const pct = total > 0 ? Math.round(((item.value as number) / total) * 100) : 0;
                    return (
                      <div className="border-border/50 bg-background rounded-lg border px-3 py-2 text-xs shadow-xl">
                        <div className="flex items-center gap-1.5 font-medium mb-0.5">
                          <span
                            className="inline-block h-2 w-2 rounded-[2px]"
                            style={{ backgroundColor: item.payload.fill }}
                          />
                          {item.name}
                        </div>
                        <p className="text-muted-foreground">
                          Count: <span className="text-foreground font-mono font-medium">{item.value}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Share: <span className="text-foreground font-mono font-medium">{pct}%</span>
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {renderCustomLegend()}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface ClientGrowthLineChartProps {
  clients: Client[];
}

function ClientGrowthLineChart({ clients }: ClientGrowthLineChartProps) {
  // Use Oct 2023 – Mar 2024 window (6 months ending March 2024)
  const referenceDate = new Date(2024, 2, 1);
  const months = getLast6Months(referenceDate);

  // Count clients added per month
  const countByMonth: Record<string, number> = {};
  months.forEach(({ key }) => (countByMonth[key] = 0));
  clients.forEach((c) => {
    const key = (c.created_at || c.createdAt || "").slice(0, 7);
    if (key in countByMonth) countByMonth[key]++;
  });

  // Build cumulative data
  let cumulative = 0;
  const data = months.map(({ key, label }) => {
    cumulative += countByMonth[key];
    return { month: label, clients: cumulative };
  });

  const hasData = clients.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Client Growth</CardTitle>
        <CardDescription>Cumulative clients added — last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No client data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={32}
                className="fill-muted-foreground"
              />
              <Tooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="border-border/50 bg-background rounded-lg border px-3 py-2 text-xs shadow-xl">
                      <p className="font-medium mb-1">{label}</p>
                      <p className="text-muted-foreground">
                        Total clients: <span className="text-foreground font-mono font-medium">{payload[0].value}</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="clients"
                stroke="var(--chart-2)"
                strokeWidth={2.5}
                dot={{ fill: "var(--chart-2)", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// Hardcoded subscription plan mock data (Phase 10 plans)
const PLAN_COLORS: Record<string, string> = {
  Basic: "var(--chart-3)",
  Pro: "var(--chart-1)",
  Enterprise: "var(--chart-5)",
};

const SUBSCRIPTION_MOCK_DATA = [
  { plan: "Basic", subscribers: 8 },
  { plan: "Pro", subscribers: 14 },
  { plan: "Enterprise", subscribers: 5 },
];

function SubscriptionPlanChart() {
  const total = SUBSCRIPTION_MOCK_DATA.reduce((s, d) => s + d.subscribers, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Subscription Plan Breakdown</CardTitle>
        <CardDescription>Active subscribers by plan ({total} total)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={SUBSCRIPTION_MOCK_DATA}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
            <XAxis
              dataKey="plan"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={32}
              className="fill-muted-foreground"
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const count = payload[0].value as number;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div className="border-border/50 bg-background rounded-lg border px-3 py-2 text-xs shadow-xl">
                    <div className="flex items-center gap-1.5 font-medium mb-1">
                      <span
                        className="inline-block h-2 w-2 rounded-[2px]"
                        style={{ backgroundColor: PLAN_COLORS[label] }}
                      />
                      {label}
                    </div>
                    <p className="text-muted-foreground">
                      Subscribers: <span className="text-foreground font-mono font-medium">{count}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Share: <span className="text-foreground font-mono font-medium">{pct}%</span>
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="subscribers" radius={[4, 4, 0, 0]} maxBarSize={64}>
              {SUBSCRIPTION_MOCK_DATA.map((entry) => (
                <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex justify-center gap-5 pt-3">
          {SUBSCRIPTION_MOCK_DATA.map((entry) => (
            <div key={entry.plan} className="flex items-center gap-1.5 text-xs">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: PLAN_COLORS[entry.plan] }}
              />
              <span className="text-muted-foreground">
                {entry.plan} <span className="text-foreground font-medium tabular-nums">({entry.subscribers})</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Recent Activity ───────────────────────────────────────────────────────────

type ActivityType = "invoice_created" | "payment_received" | "client_added" | "plan_subscribed";

interface Activity {
  id: number;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
}

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  invoice_created: <FileText className="h-4 w-4 text-blue-500" />,
  payment_received: <DollarSign className="h-4 w-4 text-emerald-500" />,
  client_added: <UserPlus className="h-4 w-4 text-violet-500" />,
  plan_subscribed: <CreditCard className="h-4 w-4 text-amber-500" />,
};

const ACTIVITY_ICON_BG: Record<ActivityType, string> = {
  invoice_created: "bg-blue-100 dark:bg-blue-950",
  payment_received: "bg-emerald-100 dark:bg-emerald-950",
  client_added: "bg-violet-100 dark:bg-violet-950",
  plan_subscribed: "bg-amber-100 dark:bg-amber-950",
};

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  return "just now";
}

const now = new Date();
const RECENT_ACTIVITIES: Activity[] = [
  {
    id: 1,
    type: "payment_received",
    title: "Payment Received",
    description: "Acme Corp paid invoice #INV-0042 — R4 200",
    timestamp: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
  },
  {
    id: 2,
    type: "invoice_created",
    title: "Invoice Created",
    description: "Invoice #INV-0043 created for Globex LLC",
    timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
  },
  {
    id: 3,
    type: "client_added",
    title: "New Client Added",
    description: "Initech Solutions was added to your client list",
    timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
  },
  {
    id: 4,
    type: "plan_subscribed",
    title: "Plan Subscribed",
    description: "Umbrella Inc. subscribed to the Pro plan",
    timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000),
  },
  {
    id: 5,
    type: "payment_received",
    title: "Payment Received",
    description: "Stark Industries paid invoice #INV-0039 — R12 500",
    timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 6,
    type: "invoice_created",
    title: "Invoice Created",
    description: "Invoice #INV-0041 created for Wayne Enterprises",
    timestamp: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 7,
    type: "client_added",
    title: "New Client Added",
    description: "Oscorp Industries was added to your client list",
    timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 8,
    type: "plan_subscribed",
    title: "Plan Subscribed",
    description: "LexCorp subscribed to the Enterprise plan",
    timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
  },
];

function RecentActivityFeed() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
        <CardDescription>Latest actions across your account</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-4">
          {RECENT_ACTIVITIES.map((activity, index) => (
            <li key={activity.id}>
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ACTIVITY_ICON_BG[activity.type]}`}>
                  {ACTIVITY_ICONS[activity.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{activity.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                  {getRelativeTime(activity.timestamp)}
                </span>
              </div>
              {index < RECENT_ACTIVITIES.length - 1 && <div className="mt-4 border-b border-border/50" />}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ─── Quick Actions ─────────────────────────────────────────────────────────────

interface QuickAction {
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  onClick: () => void;
}

function QuickActions() {
  const { list, create } = useNavigation();

  const actions: QuickAction[] = [
    {
      label: "Create Invoice",
      description: "Issue a new invoice",
      icon: <FilePlus className="h-5 w-5 text-blue-500" />,
      iconBg: "bg-blue-100 dark:bg-blue-950",
      onClick: () => create("invoices"),
    },
    {
      label: "Add Client",
      description: "Register a new client",
      icon: <UserPlus className="h-5 w-5 text-violet-500" />,
      iconBg: "bg-violet-100 dark:bg-violet-950",
      onClick: () => create("clients"),
    },
    {
      label: "Add Product",
      description: "Add to your catalog",
      icon: <CreditCard className="h-5 w-5 text-amber-500" />,
      iconBg: "bg-amber-100 dark:bg-amber-950",
      onClick: () => create("products"),
    },
    {
      label: "View Reports",
      description: "Analytics & insights",
      icon: <BarChart2 className="h-5 w-5 text-emerald-500" />,
      iconBg: "bg-emerald-100 dark:bg-emerald-950",
      onClick: () => list("reports"),
    },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
        <CardDescription>Shortcuts to common tasks</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto w-full justify-between px-4 py-3 text-left hover:bg-muted/60"
            onClick={action.onClick}>
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.iconBg}`}>
                {action.icon}
              </div>
              <div>
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { query: invoicesQuery } = useList<Invoice>({
    resource: "invoices",
    pagination: { pageSize: 1000 },
  });

  const { query: clientsQuery } = useList<Client>({
    resource: "clients",
    pagination: { pageSize: 1000 },
  });

  const invoices: Invoice[] = invoicesQuery.data?.data ?? [];
  const clients: Client[] = clientsQuery.data?.data ?? [];

  // Computed metrics
  const totalRevenue = invoices
    .filter((inv: Invoice) => normalizeInvoiceStatus(inv.status) === "paid")
    .reduce((sum: number, inv: Invoice) => sum + inv.total, 0);

  const outstandingAmount = invoices
    .filter((inv: Invoice) => {
      const status = normalizeInvoiceStatus(inv.status);
      return status === "sent" || status === "overdue";
    })
    .reduce((sum: number, inv: Invoice) => sum + inv.total, 0);

  const overdueCount = invoices.filter((inv: Invoice) => normalizeInvoiceStatus(inv.status) === "overdue").length;
  const sentCount = invoices.filter((inv: Invoice) => normalizeInvoiceStatus(inv.status) === "sent").length;

  const totalInvoices = invoices.length;
  const paidCount = invoices.filter((inv: Invoice) => normalizeInvoiceStatus(inv.status) === "paid").length;

  const activeClients = clients.filter((c: Client) => normalizeClientStatus(c.status) === "Active").length;
  const inactiveClients = clients.filter((c: Client) => normalizeClientStatus(c.status) !== "Active").length;

  const isLoading = invoicesQuery.isLoading || clientsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your invoicing activity</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted rounded mb-2" />
                <div className="h-3 w-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-32 bg-muted rounded mb-1" />
                <div className="h-3 w-48 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metrics: MetricCardProps[] = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
      iconBg: "bg-emerald-100 dark:bg-emerald-950",
      trend: {
        direction: "up",
        label: `${paidCount} paid invoice${paidCount !== 1 ? "s" : ""}`,
      },
    },
    {
      title: "Outstanding Amount",
      value: formatCurrency(outstandingAmount),
      icon: <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
      iconBg: "bg-amber-100 dark:bg-amber-950",
      trend: {
        direction: overdueCount > 0 ? "down" : "neutral",
        label:
          overdueCount > 0
            ? `${overdueCount} overdue, ${sentCount} sent`
            : `${sentCount} sent invoice${sentCount !== 1 ? "s" : ""}`,
      },
      badge:
        overdueCount > 0
          ? {
              label: `${overdueCount} overdue`,
              className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
            }
          : undefined,
    },
    {
      title: "Total Invoices",
      value: String(totalInvoices),
      icon: <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
      iconBg: "bg-blue-100 dark:bg-blue-950",
      trend: {
        direction: totalInvoices > 0 ? "up" : "neutral",
        label: `${paidCount} paid · ${invoices.filter((i: Invoice) => normalizeInvoiceStatus(i.status) === "draft").length} drafts`,
      },
    },
    {
      title: "Active Clients",
      value: String(activeClients),
      icon: <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />,
      iconBg: "bg-violet-100 dark:bg-violet-950",
      trend: {
        direction: activeClients > inactiveClients ? "up" : "neutral",
        label: `${clients.length} total · ${inactiveClients} inactive`,
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your invoicing activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueBarChart invoices={invoices} />
        <StatusDonutChart invoices={invoices} />
        <ClientGrowthLineChart clients={clients} />
        <SubscriptionPlanChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentActivityFeed />
        </div>
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
