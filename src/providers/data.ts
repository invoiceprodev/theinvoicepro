import type { DataProvider } from "@refinedev/core";
import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import { supabaseClient } from "@/lib/supabase";

// Export Supabase data provider configured with our client
const baseDataProvider = supabaseDataProvider(supabaseClient);

// Helper to resolve resource name to actual table name
const resolveResource = (resource: string) => {
  if (resource === "admin-plans" || resource === "tiers") return "plans";
  return resource;
};

// Create custom data provider with resource name mapping and error logging
export const dataProvider: DataProvider = {
  ...baseDataProvider,
  // Override methods to map admin-plans/tiers to plans table
  getList: async (params) => {
    const resource = resolveResource(params.resource);
    try {
      console.log("[DATA PROVIDER] getList called for resource:", resource);
      const result = await baseDataProvider.getList({ ...params, resource });
      console.log("[DATA PROVIDER] getList success:", resource, result);
      return result;
    } catch (error) {
      console.error("[DATA PROVIDER] getList error:", resource, error);
      throw error;
    }
  },
  getOne: async (params) => {
    const resource = resolveResource(params.resource);
    try {
      return await baseDataProvider.getOne({ ...params, resource });
    } catch (error) {
      console.error("[DATA PROVIDER] getOne error:", resource, error);
      throw error;
    }
  },
  create: async (params) => {
    const resource = resolveResource(params.resource);
    try {
      return await baseDataProvider.create({ ...params, resource });
    } catch (error) {
      console.error("[DATA PROVIDER] create error:", resource, error);
      throw error;
    }
  },
  update: async (params) => {
    const resource = resolveResource(params.resource);
    try {
      return await baseDataProvider.update({ ...params, resource });
    } catch (error) {
      console.error("[DATA PROVIDER] update error:", resource, error);
      throw error;
    }
  },
  deleteOne: async (params) => {
    const resource = resolveResource(params.resource);
    try {
      return await baseDataProvider.deleteOne({ ...params, resource });
    } catch (error) {
      console.error("[DATA PROVIDER] deleteOne error:", resource, error);
      throw error;
    }
  },
  getApiUrl: () => baseDataProvider.getApiUrl(),
} as DataProvider;
