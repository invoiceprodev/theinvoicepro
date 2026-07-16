const fallbackApiUrl = "https://api.theinvoicepro.co.za";

export const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  fallbackApiUrl;
