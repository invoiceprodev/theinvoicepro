import { useList } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Invoice, Client } from "@/types";
import { DollarSign, FileText, Users, Clock, Plus, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { TrialCountdownWidget } from "@/components/trial-countdown-widget";

export const DashboardHome = () => {
  // Fetch all invoices
  const { result: invoicesResult, query: invoicesQuery } = useList<Invoice>({
    resource: "invoices",
    pagination: { mode: "off" },
  });

  // Fetch all clients
  const { result: clientsResult, query: clientsQuery } = useList<Client>({
    resource: "clients",
    pagination: { mode: "off" },
  });

  const invoices = invoicesResult?.data ?? [];
  const clients = clientsResult?.data ?? [];

  // Fetch recent invoices (last 5)
  const { result: recentInvoicesResult, query: recentInvoicesQuery } = useList<Invoice>({
    resource: "invoices",
    pagination: { currentPage: 1, pageSize: 5 },
    sorters: [{ field: "created_at", order: "desc" }],
    meta: {
      select: "*, client:clients(*)",
    },
  });

  const recentInvoices = recentInvoicesResult?.data ?? [];
  const navigate = useNavigate();

  // Calculate metrics
  const totalRevenue = invoices
    .filter((inv: Invoice) => inv.status === "paid")
    .reduce((sum: number, inv: Invoice) => sum + Number(inv.total), 0);

  const pendingAmount = invoices
    .filter((inv: Invoice) => inv.status === "pending" || inv.status === "overdue")
    .reduce((sum: number, inv: Invoice) => sum + Number(inv.total), 0);

  const totalInvoices = invoices.length;
  const activeClients = clients.length;

  const isLoading = invoicesQuery.isLoading || clientsQuery.isLoading;
  const recentInvoicesLoading = recentInvoicesQuery.isLoading;

  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    paid: "default",
    pending: "secondary",
    overdue: "destructive",
    draft: "outline",
    sent: "secondary",
  };

  // Calculate monthly revenue for the last 6 months
  const getMonthlyRevenue = () => {
    const monthlyData: Record<string, number> = {};
    const currentDate = new Date();

    // Initialize last 6 months with 0 revenue
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = format(date, "MMM yyyy");
      monthlyData[monthKey] = 0;
    }

    // Aggregate revenue from paid invoices
    invoices
      .filter((inv: Invoice) => inv.status === "paid")
      .forEach((invoice: Invoice) => {
        const invoiceDate = new Date(invoice.invoice_date);
        const monthKey = format(invoiceDate, "MMM yyyy");

        if (monthKey in monthlyData) {
          monthlyData[monthKey] += Number(invoice.total);
        }
      });

    return Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  };

  const revenueData = getMonthlyRevenue();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to your dashboard overview.</p>
      </div>

      {/* Trial Countdown Widget */}
      <div className="mb-8">
        <TrialCountdownWidget />
      </div>

      {/* Quick Actions Section */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => navigate("/invoices/create")} className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Invoice
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/clients/create")}
                className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add Client
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <span className="text-muted-foreground">Loading...</span> : formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <span className="text-muted-foreground">Loading...</span> : formatCurrency(pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pending & overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <span className="text-muted-foreground">Loading...</span> : totalInvoices}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <span className="text-muted-foreground">Loading...</span> : activeClients}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices Widget */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoicesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No invoices yet. Create your first invoice to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/invoices/${invoice.id}`)}>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{invoice.invoice_number}</div>
                      <div className="text-sm text-muted-foreground">{invoice.client?.name || "Unknown Client"}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(invoice.total)}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(invoice.invoice_date), "MMM dd, yyyy")}
                        </div>
                      </div>
                      <Badge variant={statusVariant[invoice.status]} className="capitalize">
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Revenue (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : revenueData.every((d) => d.revenue === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                No revenue data available yet. Start creating and marking invoices as paid.
              </div>
            ) : (
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "var(--chart-1)",
                  },
                }}
                className="h-[300px] w-full">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("en-ZA", {
                        style: "currency",
                        currency: "ZAR",
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(value)
                    }
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
                  />
                  <Bar dataKey="revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
