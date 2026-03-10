import type { DataProvider, HttpError } from "@refinedev/core";
import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import { ApiClientError, apiRequest, hasApiBaseUrl } from "@/lib/api-client";
import { isAdminContext } from "@/lib/admin-routing";
import { supabaseClient } from "@/lib/supabase";

// Export Supabase data provider configured with our client
const baseDataProvider = supabaseDataProvider(supabaseClient);

// Helper to resolve resource name to actual table name
const resolveResource = (resource: string) => {
  if (resource === "admin-plans" || resource === "tiers") return "plans";
  return resource;
};

const isAdminPlanResource = (resource: string) => ["admin-plans", "tiers"].includes(resource);

const isAdminOnlyResource = (resource: string) =>
  ["profiles", "subscriptions", "subscription_history", "trial_conversions", "payments"].includes(resource);

const isAdminRoute = () => typeof window !== "undefined" && isAdminContext(window.location.pathname, window.location.hostname);

const useApiForResource = (resource: string, originalResource?: string) =>
  hasApiBaseUrl() &&
  (["clients", "invoices", "invoice_items", "expenses"].includes(resource) ||
    isAdminPlanResource(originalResource || resource) ||
    (isAdminRoute() && isAdminOnlyResource(originalResource || resource)));

const normalizeClientPayload = (values: Record<string, unknown>) => ({
  name: values.name,
  email: values.email,
  company: values.company || "",
  phone: values.phone || "",
  address: values.address || "",
  status: values.status || "Active",
});

const normalizeInvoicePayload = (values: Record<string, unknown>) => ({
  invoice_number: values.invoice_number || values.invoiceNumber,
  client_id: values.client_id || values.clientId,
  invoice_date: values.invoice_date || values.invoiceDate,
  due_date: values.due_date || values.dueDate,
  status: values.status,
  currency: values.currency || "ZAR",
  subtotal: values.subtotal || 0,
  tax_percentage: values.tax_percentage || values.taxPercentage || 0,
  tax_amount: values.tax_amount || values.taxAmount || 0,
  discount_type: values.discount_type || values.discountType || "percentage",
  discount: values.discount || 0,
  total: values.total || 0,
  notes: values.notes || "",
  lineItems: Array.isArray(values.lineItems) ? values.lineItems : [],
});

const normalizeExpensePayload = (values: Record<string, unknown>) => ({
  category: values.category,
  recipient: values.recipient,
  recipient_email: values.recipient_email || values.recipientEmail || "",
  recipient_phone: values.recipient_phone || values.recipientPhone || "",
  recipient_company: values.recipient_company || values.recipientCompany || "",
  amount: values.amount || 0,
  currency: values.currency || "ZAR",
  payment_method: values.payment_method || values.paymentMethod || "Bank Transfer",
  date: values.date,
  status: values.status || "Pending",
  notes: values.notes || "",
  vat_applicable: values.vat_applicable ?? values.vatApplicable ?? false,
});

const normalizePlanPayload = (values: Record<string, unknown>) => ({
  name: String(values.name ?? "").trim(),
  description: String(values.description ?? "").trim(),
  price: Number(values.price ?? 0),
  currency: String(values.currency ?? "ZAR").trim() || "ZAR",
  billing_cycle: String(values.billing_cycle ?? values.billingCycle ?? "monthly").trim().toLowerCase() === "yearly" ? "yearly" : "monthly",
  features: Array.isArray(values.features) ? values.features.map((feature) => String(feature ?? "").trim()).filter(Boolean) : [],
  is_active: Boolean(values.is_active ?? values.isActive ?? true),
  is_popular: Boolean(values.is_popular ?? values.isPopular ?? false),
  trial_days: Math.max(0, Number(values.trial_days ?? values.trialDays ?? 0)),
  requires_card: Boolean(values.requires_card ?? values.requiresCard ?? false),
  auto_renew: Boolean(values.auto_renew ?? values.autoRenew ?? false),
});

const buildCrudQueryString = (params: {
  filters?: unknown;
  sorters?: unknown;
  pagination?: unknown;
  ids?: Array<string | number>;
}) => {
  const search = new URLSearchParams();

  if (params.ids && params.ids.length > 0) {
    search.set("ids", params.ids.map(String).join(","));
  }

  if (params.filters) {
    search.set("filters", JSON.stringify(params.filters));
  }

  if (params.sorters) {
    search.set("sorters", JSON.stringify(params.sorters));
  }

  if (params.pagination) {
    search.set("pagination", JSON.stringify(params.pagination));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
};

const getAdminResourcePath = (resource: string, id?: string | number) => {
  const basePath = isAdminPlanResource(resource) ? "/plans" : `/${resource}`;
  return id === undefined ? basePath : `${basePath}/${id}`;
};

const toHttpError = (error: unknown): HttpError => {
  if (error instanceof ApiClientError) {
    return {
      message: error.message,
      statusCode: error.status,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
    };
  }

  return {
    message: "Unexpected data provider error",
    statusCode: 500,
  };
};

// Create custom data provider with resource name mapping and error logging
export const dataProvider: DataProvider = {
  ...baseDataProvider,
  // Override methods to map admin-plans/tiers to plans table
  getList: async (params) => {
    const originalResource = params.resource;
    const resource = resolveResource(params.resource);
    try {
      if (useApiForResource(resource, originalResource)) {
        if (isAdminPlanResource(originalResource)) {
          return await apiRequest<{ data: unknown[]; total: number }>(
            `/plans${buildCrudQueryString({
              filters: params.filters,
              sorters: params.sorters,
              pagination: params.pagination,
            })}`,
          );
        }
        if (isAdminOnlyResource(originalResource) && isAdminRoute()) {
          return await apiRequest<{ data: unknown[]; total: number }>(
            `${getAdminResourcePath(originalResource)}${buildCrudQueryString({
              filters: params.filters,
              sorters: params.sorters,
              pagination: params.pagination,
            })}`,
          );
        }
        if (resource === "invoice_items") {
          const invoiceId = params.filters?.find((filter) => "field" in filter && filter.field === "invoice_id");
          const invoiceIdValue = invoiceId && "value" in invoiceId ? invoiceId.value : "";
          return await apiRequest<{ data: unknown[]; total: number }>(
            `/${resource}?invoice_id=${encodeURIComponent(String(invoiceIdValue || ""))}`,
          );
        }
        return await apiRequest<{ data: unknown[]; total: number }>(`/${resource}`);
      }
      return await baseDataProvider.getList({ ...params, resource });
    } catch (error) {
      console.error("[DATA PROVIDER] getList error:", resource, error);
      throw toHttpError(error);
    }
  },
  getOne: async (params) => {
    const originalResource = params.resource;
    const resource = resolveResource(params.resource);
    try {
      if (useApiForResource(resource, originalResource)) {
        if (isAdminPlanResource(originalResource)) {
          return await apiRequest<{ data: unknown }>(`/plans/${params.id}`);
        }
        if (isAdminOnlyResource(originalResource) && isAdminRoute()) {
          return await apiRequest<{ data: unknown }>(getAdminResourcePath(originalResource, params.id));
        }
        return await apiRequest<{ data: unknown }>(`/${resource}/${params.id}`);
      }
      return await baseDataProvider.getOne({ ...params, resource });
    } catch (error) {
      console.error("[DATA PROVIDER] getOne error:", resource, error);
      throw toHttpError(error);
    }
  },
  getMany: async (params) => {
    const originalResource = params.resource;
    const resource = resolveResource(params.resource);
    try {
      if (useApiForResource(resource, originalResource)) {
        if (isAdminPlanResource(originalResource)) {
          const response = await apiRequest<{ data: Array<Record<string, unknown>> }>(
            `/plans${buildCrudQueryString({ ids: params.ids })}`,
          );
          const idSet = new Set(params.ids.map(String));
          return {
            data: response.data.filter((record) => idSet.has(String(record.id))),
          };
        }
        if (isAdminOnlyResource(originalResource) && isAdminRoute()) {
          const response = await apiRequest<{ data: Array<Record<string, unknown>> }>(
            `${getAdminResourcePath(originalResource)}${buildCrudQueryString({ ids: params.ids })}`,
          );
          const idSet = new Set(params.ids.map(String));
          return {
            data: response.data.filter((record) => idSet.has(String(record.id))),
          };
        }
        if (resource === "invoice_items") {
          const response = await apiRequest<{ data: Array<Record<string, unknown>> }>(
            `/${resource}?invoice_id=${encodeURIComponent(String(params.ids[0] || ""))}`,
          );
          const idSet = new Set(params.ids.map(String));
          return {
            data: response.data.filter((record) => idSet.has(String(record.id))),
          };
        }
        const response = await apiRequest<{ data: Array<Record<string, unknown>> }>(`/${resource}`);
        const idSet = new Set(params.ids.map(String));
        return {
          data: response.data.filter((record) => idSet.has(String(record.id))),
        };
      }
      return await baseDataProvider.getMany({ ...params, resource });
    } catch (error) {
      console.error("[DATA PROVIDER] getMany error:", resource, error);
      throw toHttpError(error);
    }
  },
  create: async (params) => {
    const originalResource = params.resource;
    const resource = resolveResource(params.resource);
    try {
      if (useApiForResource(resource, originalResource)) {
        if (isAdminPlanResource(originalResource)) {
          return await apiRequest<{ data: unknown }>("/plans", {
            method: "POST",
            body: JSON.stringify(normalizePlanPayload(params.variables as Record<string, unknown>)),
          });
        }
        if (isAdminOnlyResource(originalResource) && isAdminRoute()) {
          return await apiRequest<{ data: unknown }>(getAdminResourcePath(originalResource), {
            method: "POST",
            body: JSON.stringify(params.variables),
          });
        }
        const body =
          resource === "clients"
            ? normalizeClientPayload(params.variables as Record<string, unknown>)
            : resource === "expenses"
              ? normalizeExpensePayload(params.variables as Record<string, unknown>)
            : normalizeInvoicePayload(params.variables as Record<string, unknown>);
        return await apiRequest<{ data: unknown }>(`/${resource}`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      return await baseDataProvider.create({ ...params, resource });
    } catch (error) {
      console.error("[DATA PROVIDER] create error:", resource, error);
      throw toHttpError(error);
    }
  },
  update: async (params) => {
    const originalResource = params.resource;
    const resource = resolveResource(params.resource);
    try {
      if (useApiForResource(resource, originalResource)) {
        if (isAdminPlanResource(originalResource)) {
          return await apiRequest<{ data: unknown }>(`/plans/${params.id}`, {
            method: "PATCH",
            body: JSON.stringify(normalizePlanPayload(params.variables as Record<string, unknown>)),
          });
        }
        if (isAdminOnlyResource(originalResource) && isAdminRoute()) {
          return await apiRequest<{ data: unknown }>(getAdminResourcePath(originalResource, params.id), {
            method: "PATCH",
            body: JSON.stringify(params.variables),
          });
        }
        const body =
          resource === "clients"
            ? normalizeClientPayload(params.variables as Record<string, unknown>)
            : resource === "expenses"
              ? normalizeExpensePayload(params.variables as Record<string, unknown>)
            : normalizeInvoicePayload(params.variables as Record<string, unknown>);
        return await apiRequest<{ data: unknown }>(`/${resource}/${params.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      }
      return await baseDataProvider.update({ ...params, resource });
    } catch (error) {
      console.error("[DATA PROVIDER] update error:", resource, error);
      throw toHttpError(error);
    }
  },
  deleteOne: async (params) => {
    const originalResource = params.resource;
    const resource = resolveResource(params.resource);
    try {
      if (useApiForResource(resource, originalResource)) {
        const path =
          isAdminPlanResource(originalResource) || (isAdminOnlyResource(originalResource) && isAdminRoute())
            ? getAdminResourcePath(originalResource, params.id)
            : `/${resource}/${params.id}`;
        return await apiRequest<{ data: { id: string | number } }>(path, {
          method: "DELETE",
        });
      }
      return await baseDataProvider.deleteOne({ ...params, resource });
    } catch (error) {
      console.error("[DATA PROVIDER] deleteOne error:", resource, error);
      throw toHttpError(error);
    }
  },
  getApiUrl: () => baseDataProvider.getApiUrl(),
} as DataProvider;
