import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { apiConfig } from "./config.js";
import { verifyAccessToken, type AuthenticatedUser } from "./auth.js";
import { buildTrialSubscriptionCheckout } from "./payfast.js";
import {
  isResendConfigured,
  sendExpenseReceiptEmail,
  sendInvoiceEmail,
  sendResendEmail,
  sendTrialLifecycleEmail,
  sendWelcomeEmail,
} from "./resend.js";
import { adminSupabase } from "./supabase.js";

type AuthedRequest = Request & { user?: AuthenticatedUser };

const app = express();
const BRANDING_ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const BRANDING_MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

function getUserRoles(user: AuthenticatedUser) {
  return Array.isArray(user.roles) ? user.roles : [];
}

function isAdminUser(user: AuthenticatedUser) {
  return getUserRoles(user).some((role) => role.toLowerCase() === "admin");
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeStoragePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9/_-]/g, "");
}

function getBrandingLogoPath(profileId: string) {
  return `companies/${normalizeStoragePathSegment(profileId)}/logo`;
}

function decodeDataUrl(input: string) {
  const match = input.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid logo upload payload.");
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

async function ensureBrandingBucket() {
  const { data: buckets, error: listError } = await adminSupabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Failed to inspect storage buckets: ${listError.message}`);
  }

  if (buckets.some((bucket) => bucket.name === apiConfig.supabaseBrandingBucket)) {
    return;
  }

  const { error: createError } = await adminSupabase.storage.createBucket(apiConfig.supabaseBrandingBucket, {
    public: true,
    fileSizeLimit: BRANDING_MAX_UPLOAD_BYTES,
    allowedMimeTypes: Array.from(BRANDING_ALLOWED_MIME_TYPES),
  });

  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(`Failed to create branding storage bucket: ${createError.message}`);
  }
}

function normalizeInvoiceStatus(status?: string | null) {
  const normalized = (status || "pending").toLowerCase();
  if (["draft", "sent", "paid", "pending", "overdue"].includes(normalized)) {
    return normalized;
  }
  if (normalized === "over due") {
    return "overdue";
  }
  return "pending";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getNextDocumentNumber(existingNumbers: string[], prefix: string) {
  const matcher = new RegExp(`^${escapeRegExp(prefix)}(\\d+)$`);
  const highest = existingNumbers.reduce((max, value) => {
    const match = String(value || "").match(matcher);
    if (!match) return max;
    return Math.max(max, Number(match[1]) || 0);
  }, 0);

  return `${prefix}${String(highest + 1).padStart(4, "0")}`;
}

function sanitizeInvoiceItem(item: unknown) {
  const row = (item || {}) as Record<string, unknown>;
  const quantity = Number(row.quantity ?? 0);
  const unitPrice = Number(row.unit_price ?? row.unitPrice ?? 0);

  return {
    description: String(row.description ?? "").trim(),
    quantity,
    unit_price: unitPrice,
    total: Number(row.total ?? quantity * unitPrice),
  };
}

function sanitizeInvoicePayload(body: Record<string, unknown>, profileId: string) {
  const lineItems = Array.isArray(body.lineItems) ? body.lineItems.map(sanitizeInvoiceItem) : [];
  const subtotal = Number(body.subtotal ?? 0);
  const total = Number(body.total ?? 0);
  const discount = Number(body.discount ?? 0);

  return {
    invoice_number: String(body.invoice_number ?? body.invoiceNumber ?? "").trim(),
    user_id: profileId,
    client_id: String(body.client_id ?? body.clientId ?? "").trim(),
    invoice_date: String(body.invoice_date ?? body.invoiceDate ?? "").trim(),
    due_date: String(body.due_date ?? body.dueDate ?? "").trim(),
    status: normalizeInvoiceStatus(typeof body.status === "string" ? body.status : null),
    currency: String(body.currency ?? "ZAR").trim() || "ZAR",
    subtotal,
    tax_percentage: Number(body.tax_percentage ?? body.taxPercentage ?? 0),
    tax_amount: Number(body.tax_amount ?? body.taxAmount ?? 0),
    discount_type: String(body.discount_type ?? body.discountType ?? "percentage").trim() || "percentage",
    discount,
    total,
    notes: typeof body.notes === "string" ? body.notes : "",
    lineItems,
  };
}

function normalizeExpenseStatus(status?: string | null) {
  const normalized = String(status || "Pending").toLowerCase();
  if (normalized === "paid") return "Paid";
  if (normalized === "cancelled") return "Cancelled";
  return "Pending";
}

function sanitizeExpensePayload(body: Record<string, unknown>, profileId: string) {
  return {
    user_id: profileId,
    category: String(body.category ?? "").trim(),
    recipient: String(body.recipient ?? "").trim(),
    recipient_email: String(body.recipient_email ?? body.recipientEmail ?? "").trim() || null,
    recipient_phone: String(body.recipient_phone ?? body.recipientPhone ?? "").trim() || null,
    recipient_company: String(body.recipient_company ?? body.recipientCompany ?? "").trim() || null,
    amount: Number(body.amount ?? 0),
    currency: String(body.currency ?? "ZAR").trim() || "ZAR",
    payment_method: String(body.payment_method ?? body.paymentMethod ?? "Bank Transfer").trim() || "Bank Transfer",
    date: String(body.date ?? "").trim(),
    status: normalizeExpenseStatus(typeof body.status === "string" ? body.status : null),
    notes: typeof body.notes === "string" ? body.notes : "",
    vat_applicable: Boolean(body.vat_applicable ?? body.vatApplicable ?? false),
  };
}

async function getProfileForUser(user: AuthenticatedUser) {
  const isAdmin = isAdminUser(user);

  const { data: existingProfile, error: existingError } = await adminSupabase
    .from("profiles")
    .select("*")
    .eq("auth0_user_id", user.sub)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to load mapped profile: ${existingError.message}`);
  }

  if (existingProfile?.id) {
    return existingProfile;
  }

  const payload = {
    auth0_user_id: user.sub,
    auth_provider: "auth0",
    full_name: user.name || user.nickname || user.email || (isAdmin ? "Admin" : "User"),
    business_email: user.email ?? null,
    role: isAdmin ? "admin" : "user",
    last_login_at: new Date().toISOString(),
  };

  const { data: createdProfile, error: createError } = await adminSupabase
    .from("profiles")
    .insert(payload)
    .select("*")
    .single();

  if (createError || !createdProfile?.id) {
    throw new Error(
      createError?.message ||
        "Failed to create profile for authenticated user. Run AUTH0_IDENTITY_ALIGNMENT and AUTH0_PROFILE_DECOUPLING if the profiles table is still tied to Supabase Auth.",
    );
  }

  return createdProfile;
}

app.use(
  cors({
    origin: [apiConfig.customerAppUrl, apiConfig.adminAppUrl],
    credentials: false,
  }),
);
app.use("/payfast/webhook", express.urlencoded({ extended: false }));
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "theinvoicepro-api",
    auth: "auth0",
    database: "supabase",
    email: isResendConfigured() ? "resend" : "disabled",
  });
});

app.post("/payfast/webhook", async (req: Request, res: Response) => {
  const payload = (req.body || {}) as Record<string, string>;
  const paymentStatus = String(payload.payment_status || "").toUpperCase();
  const subscriptionId = payload.custom_str2 || "";
  const paymentId = payload.pf_payment_id || payload.token || null;

  try {
    console.log("[PayFast webhook] received", {
      m_payment_id: payload.m_payment_id,
      pf_payment_id: payload.pf_payment_id,
      payment_status: paymentStatus,
      subscription_id: subscriptionId,
    });

    if (subscriptionId) {
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (paymentId) {
        updatePayload.payfast_token = paymentId;
      }

      if (paymentStatus === "COMPLETE") {
        updatePayload.status = "active";
      }

      const { error } = await adminSupabase.from("subscriptions").update(updatePayload).eq("id", subscriptionId);

      if (error) {
        console.error("[PayFast webhook] failed to update subscription", error);
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("[PayFast webhook] processing failed", error);
    res.status(200).send("OK");
  }
});

app.use(async (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (req.path === "/health") {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  try {
    req.user = await verifyAccessToken(authHeader.slice("Bearer ".length));
    next();
  } catch (error) {
    console.error("[API] token verification failed", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

app.get("/me", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  const { data: profile, error } = await adminSupabase
    .from("profiles")
    .select("*")
    .eq("auth0_user_id", user.sub)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({
    auth0: user,
    profile,
  });
});

app.get("/settings/company", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);
    res.json({ profile });
  } catch (error) {
    console.error("[API] failed to load company settings", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to load company settings") });
  }
});

app.get("/documents/next-number", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const documentType = String(req.query.type || "invoice").toLowerCase();

  try {
    const profile = await getProfileForUser(user);
    const invoicePrefix =
      typeof (profile as { invoice_prefix?: unknown }).invoice_prefix === "string" &&
      (profile as { invoice_prefix?: string }).invoice_prefix?.trim()
        ? (profile as { invoice_prefix?: string }).invoice_prefix!.trim()
        : "INV-";
    const prefix = documentType === "quote" ? "QUO-" : invoicePrefix;

    const { data: records, error } = await adminSupabase
      .from("invoices")
      .select("invoice_number")
      .eq("user_id", profile.id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const nextNumber = getNextDocumentNumber((records || []).map((record) => String(record.invoice_number || "")), prefix);
    res.json({ data: { number: nextNumber, prefix } });
  } catch (error) {
    console.error("[API] failed to generate next document number", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to generate next document number") });
  }
});

app.patch("/settings/company", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const body = (req.body || {}) as Record<string, unknown>;

  try {
    const profile = await getProfileForUser(user);
    const updatePayload = {
      company_name: typeof body.companyName === "string" ? body.companyName.trim() : profile.company_name ?? null,
      business_email: typeof body.businessEmail === "string" ? body.businessEmail.trim() : profile.business_email ?? null,
      business_phone: typeof body.businessPhone === "string" ? body.businessPhone.trim() : profile.business_phone ?? null,
      business_address: typeof body.businessAddress === "string" ? body.businessAddress.trim() : profile.business_address ?? null,
      registration_number:
        typeof body.registrationNumber === "string" ? body.registrationNumber.trim() : profile.registration_number ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProfile, error } = await adminSupabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", profile.id)
      .select("*")
      .single();

    if (error || !updatedProfile) {
      res.status(500).json({ error: error?.message || "Failed to update company settings" });
      return;
    }

    res.json({ profile: updatedProfile });
  } catch (error) {
    console.error("[API] failed to update company settings", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to update company settings") });
  }
});

app.post("/settings/company/logo", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const body = (req.body || {}) as Record<string, unknown>;

  try {
    const profile = await getProfileForUser(user);
    const dataUrl = typeof body.dataUrl === "string" ? body.dataUrl : "";
    if (!dataUrl) {
      res.status(400).json({ error: "Missing logo file data." });
      return;
    }

    const { mimeType, buffer } = decodeDataUrl(dataUrl);
    if (!BRANDING_ALLOWED_MIME_TYPES.has(mimeType)) {
      res.status(400).json({ error: "Unsupported logo format. Use PNG, JPG, WEBP, or SVG." });
      return;
    }

    if (buffer.byteLength > BRANDING_MAX_UPLOAD_BYTES) {
      res.status(400).json({ error: "Logo file is too large. Maximum size is 2MB." });
      return;
    }

    await ensureBrandingBucket();

    const logoPath = getBrandingLogoPath(profile.id);
    const { error: uploadError } = await adminSupabase.storage
      .from(apiConfig.supabaseBrandingBucket)
      .upload(logoPath, buffer, {
        cacheControl: "3600",
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      res.status(500).json({ error: uploadError.message });
      return;
    }

    const {
      data: { publicUrl },
    } = adminSupabase.storage.from(apiConfig.supabaseBrandingBucket).getPublicUrl(logoPath);

    const { data: updatedProfile, error: profileError } = await adminSupabase
      .from("profiles")
      .update({
        logo_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select("*")
      .single();

    if (profileError || !updatedProfile) {
      res.status(500).json({ error: profileError?.message || "Failed to save logo URL" });
      return;
    }

    res.json({ profile: updatedProfile, logoUrl: publicUrl });
  } catch (error) {
    console.error("[API] failed to upload company logo", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to upload company logo") });
  }
});

app.delete("/settings/company/logo", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);
    await ensureBrandingBucket();

    const logoPath = getBrandingLogoPath(profile.id);
    await adminSupabase.storage.from(apiConfig.supabaseBrandingBucket).remove([logoPath]);

    const { data: updatedProfile, error } = await adminSupabase
      .from("profiles")
      .update({
        logo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select("*")
      .single();

    if (error || !updatedProfile) {
      res.status(500).json({ error: error?.message || "Failed to remove company logo" });
      return;
    }

    res.json({ profile: updatedProfile });
  } catch (error) {
    console.error("[API] failed to remove company logo", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to remove company logo") });
  }
});

app.get("/subscription/current", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);

    const { data: subscription, error } = await adminSupabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (!subscription?.id) {
      res.json({ data: null });
      return;
    }

    const { data: plan } = await adminSupabase.from("plans").select("*").eq("id", subscription.plan_id).maybeSingle();

    res.json({
      data: {
        ...subscription,
        plan: plan || null,
      },
    });
  } catch (error) {
    console.error("[API] failed to load current subscription", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to load current subscription") });
  }
});

app.get("/subscription/usage", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [{ count: clientsCount, error: clientsError }, { count: invoicesCount, error: invoicesError }] =
      await Promise.all([
        adminSupabase.from("clients").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
        adminSupabase
          .from("invoices")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .gte("invoice_date", monthStart.toISOString().split("T")[0]),
      ]);

    if (clientsError) {
      res.status(500).json({ error: clientsError.message });
      return;
    }

    if (invoicesError) {
      res.status(500).json({ error: invoicesError.message });
      return;
    }

    res.json({
      data: {
        savedClients: clientsCount || 0,
        invoicesThisMonth: invoicesCount || 0,
      },
    });
  } catch (error) {
    console.error("[API] failed to load subscription usage", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to load subscription usage") });
  }
});

app.post("/subscription/cancel-auto-renew", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);

    const { data: subscription, error: subscriptionError } = await adminSupabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", profile.id)
      .in("status", ["trial", "active"])
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (subscriptionError) {
      res.status(500).json({ error: subscriptionError.message });
      return;
    }

    if (!subscription?.id) {
      res.status(404).json({ error: "No active subscription found" });
      return;
    }

    const { data: updatedSubscription, error: updateError } = await adminSupabase
      .from("subscriptions")
      .update({
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id)
      .select("*")
      .single();

    if (updateError || !updatedSubscription?.id) {
      res.status(500).json({ error: updateError?.message || "Failed to cancel auto-renew" });
      return;
    }

    const { data: plan } = await adminSupabase.from("plans").select("*").eq("id", updatedSubscription.plan_id).maybeSingle();

    res.json({
      data: {
        ...updatedSubscription,
        plan: plan || null,
      },
    });
  } catch (error) {
    console.error("[API] failed to cancel auto-renew", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to cancel auto-renew") });
  }
});

app.post("/subscription/change-plan", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const body = (req.body || {}) as { planId?: string };

  if (!body.planId) {
    res.status(400).json({ error: "planId is required" });
    return;
  }

  try {
    const profile = await getProfileForUser(user);

    const { data: subscription, error: subscriptionError } = await adminSupabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", profile.id)
      .in("status", ["trial", "active", "cancelled", "expired"])
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (subscriptionError) {
      res.status(500).json({ error: subscriptionError.message });
      return;
    }

    if (!subscription?.id) {
      res.status(404).json({ error: "No subscription found to update" });
      return;
    }

    const { data: plan, error: planError } = await adminSupabase
      .from("plans")
      .select("*")
      .eq("id", body.planId)
      .eq("is_active", true)
      .single();

    if (planError || !plan?.id) {
      res.status(404).json({ error: planError?.message || "Selected plan not found" });
      return;
    }

    const today = new Date();
    const renewalDate = new Date(today);
    if (plan.billing_cycle === "yearly") {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    } else {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    }

    const updatedFields: Record<string, unknown> = {
      plan_id: plan.id,
      auto_renew: Boolean(plan.auto_renew),
      updated_at: new Date().toISOString(),
    };

    if (subscription.status !== "trial") {
      updatedFields.renewal_date = renewalDate.toISOString().split("T")[0];
      if (subscription.status === "cancelled" || subscription.status === "expired") {
        updatedFields.status = "active";
        updatedFields.start_date = today.toISOString().split("T")[0];
      }
    }

    const { data: updatedSubscription, error: updateError } = await adminSupabase
      .from("subscriptions")
      .update(updatedFields)
      .eq("id", subscription.id)
      .select("*")
      .single();

    if (updateError || !updatedSubscription?.id) {
      res.status(500).json({ error: updateError?.message || "Failed to change plan" });
      return;
    }

    res.json({
      data: {
        ...updatedSubscription,
        plan,
      },
    });
  } catch (error) {
    console.error("[API] failed to change plan", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to change plan") });
  }
});

app.get("/clients", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);
    const profileId = profile.id;
    const isAdmin = isAdminUser(user);

    let query = adminSupabase.from("clients").select("*", { count: "exact" }).order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("user_id", profileId);
    }

    const { data, error, count } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: data || [], total: count || 0 });
  } catch (error) {
    console.error("[API] failed to load clients", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to load clients") });
  }
});

app.get("/clients/:id", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);
    const profileId = profile.id;
    const isAdmin = isAdminUser(user);

    let query = adminSupabase.from("clients").select("*").eq("id", req.params.id);

    if (!isAdmin) {
      query = query.eq("user_id", profileId);
    }

    const { data, error } = await query.single();

    if (error) {
      res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message });
      return;
    }

    res.json({ data });
  } catch (error) {
    console.error("[API] failed to load client", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to load client") });
  }
});

app.post("/clients", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const body = req.body as {
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
    address?: string;
    status?: string;
  };

  if (!body.name || !body.email) {
    res.status(400).json({ error: "Name and email are required" });
    return;
  }

  try {
    const profile = await getProfileForUser(user);
    const profileId = profile.id;
    const payload = {
      user_id: profileId,
      name: body.name.trim(),
      email: body.email.trim(),
      company: body.company?.trim() || "",
      phone: body.phone?.trim() || "",
      address: body.address?.trim() || "",
      status: body.status || "Active",
    };

    const { data, error } = await adminSupabase.from("clients").insert(payload).select("*").single();

    if (error) {
      console.error("[API] failed to insert client", { error, payload, auth0UserId: user.sub, profileId });
      res.status(500).json({
        error: error.message,
        description:
          "Client insert failed in Supabase. Check the clients table schema, unique constraints, and whether the mapped profile row exists.",
      });
      return;
    }

    res.status(201).json({ data });
  } catch (error) {
    console.error("[API] failed to create client", error);
    res.status(500).json({
      error: getErrorMessage(error, "Failed to create client"),
      description: "The API could not resolve or create the Auth0-mapped profile required for this client.",
    });
  }
});

app.get("/invoice_items", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const invoiceId = typeof req.query.invoice_id === "string" ? req.query.invoice_id : "";

  if (!invoiceId) {
    res.status(400).json({ error: "invoice_id query parameter is required" });
    return;
  }

  try {
    const profile = await getProfileForUser(user);
    const isAdmin = isAdminUser(user);

    let invoiceQuery = adminSupabase.from("invoices").select("id").eq("id", invoiceId);
    if (!isAdmin) {
      invoiceQuery = invoiceQuery.eq("user_id", profile.id);
    }

    const { data: invoice, error: invoiceError } = await invoiceQuery.maybeSingle();

    if (invoiceError) {
      res.status(500).json({ error: invoiceError.message });
      return;
    }

    if (!invoice?.id) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    const { data, error } = await adminSupabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: data || [], total: data?.length || 0 });
  } catch (error) {
    console.error("[API] failed to load invoice items", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to load invoice items") });
  }
});

app.get("/invoices", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);
    const isAdmin = isAdminUser(user);

    let query = adminSupabase.from("invoices").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (!isAdmin) {
      query = query.eq("user_id", profile.id);
    }

    const { data, error, count } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: data || [], total: count || 0 });
  } catch (error) {
    console.error("[API] failed to load invoices", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to load invoices") });
  }
});

app.get("/invoices/:id", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);
    const isAdmin = isAdminUser(user);

    let query = adminSupabase.from("invoices").select("*").eq("id", req.params.id);
    if (!isAdmin) {
      query = query.eq("user_id", profile.id);
    }

    const { data, error } = await query.single();

    if (error) {
      res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message });
      return;
    }

    const { data: lineItems, error: lineItemsError } = await adminSupabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", data.id)
      .order("created_at", { ascending: true });

    if (lineItemsError) {
      res.status(500).json({ error: lineItemsError.message });
      return;
    }

    const { data: client, error: clientError } = await adminSupabase
      .from("clients")
      .select("*")
      .eq("id", data.client_id)
      .maybeSingle();

    if (clientError) {
      res.status(500).json({ error: clientError.message });
      return;
    }

    res.json({
      data: {
        ...data,
        client: client || null,
        lineItems: lineItems || [],
      },
    });
  } catch (error) {
    console.error("[API] failed to load invoice", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to load invoice") });
  }
});

app.post("/invoices", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const body = (req.body || {}) as Record<string, unknown>;

  try {
    const profile = await getProfileForUser(user);
    const isAdmin = isAdminUser(user);
    const payload = sanitizeInvoicePayload(body, profile.id);

    if (!payload.invoice_number || !payload.client_id || !payload.invoice_date || !payload.due_date) {
      res.status(400).json({ error: "Invoice number, client, invoice date, and due date are required" });
      return;
    }

    if (payload.lineItems.length === 0 || payload.lineItems.some((item) => !item.description)) {
      res.status(400).json({ error: "At least one valid line item is required" });
      return;
    }

    let clientQuery = adminSupabase.from("clients").select("id,user_id").eq("id", payload.client_id);
    if (!isAdmin) {
      clientQuery = clientQuery.eq("user_id", profile.id);
    }

    const { data: client, error: clientError } = await clientQuery.maybeSingle();
    if (clientError) {
      res.status(500).json({ error: clientError.message });
      return;
    }

    if (!client?.id) {
      res.status(400).json({ error: "Selected client does not exist for this account" });
      return;
    }

    const { lineItems, ...invoicePayload } = payload;
    const { data: invoice, error: invoiceError } = await adminSupabase
      .from("invoices")
      .insert(invoicePayload)
      .select("*")
      .single();

    if (invoiceError || !invoice?.id) {
      console.error("[API] failed to insert invoice", { invoiceError, invoicePayload, auth0UserId: user.sub });
      res.status(500).json({ error: invoiceError?.message || "Failed to create invoice" });
      return;
    }

    const itemsPayload = lineItems.map((item) => ({
      invoice_id: invoice.id,
      ...item,
    }));

    const { error: itemsError } = await adminSupabase.from("invoice_items").insert(itemsPayload);

    if (itemsError) {
      await adminSupabase.from("invoices").delete().eq("id", invoice.id);
      console.error("[API] failed to insert invoice items", { itemsError, itemsPayload, invoiceId: invoice.id });
      res.status(500).json({ error: itemsError.message });
      return;
    }

    res.status(201).json({
      data: {
        ...invoice,
        lineItems: itemsPayload.map(({ invoice_id, ...item }) => item),
      },
    });
  } catch (error) {
    console.error("[API] failed to create invoice", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to create invoice") });
  }
});

app.patch("/invoices/:id", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const body = (req.body || {}) as Record<string, unknown>;

  try {
    const profile = await getProfileForUser(user);
    const isAdmin = isAdminUser(user);
    const payload = sanitizeInvoicePayload(body, profile.id);

    let invoiceOwnershipQuery = adminSupabase.from("invoices").select("id,user_id").eq("id", req.params.id);
    if (!isAdmin) {
      invoiceOwnershipQuery = invoiceOwnershipQuery.eq("user_id", profile.id);
    }

    const { data: existingInvoice, error: existingInvoiceError } = await invoiceOwnershipQuery.maybeSingle();
    if (existingInvoiceError) {
      res.status(500).json({ error: existingInvoiceError.message });
      return;
    }

    if (!existingInvoice?.id) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    const { lineItems, ...invoicePayload } = payload;
    const { data: updatedInvoice, error: updateError } = await adminSupabase
      .from("invoices")
      .update(invoicePayload)
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (updateError) {
      res.status(500).json({ error: updateError.message });
      return;
    }

    if (Array.isArray(body.lineItems)) {
      const { error: deleteItemsError } = await adminSupabase.from("invoice_items").delete().eq("invoice_id", req.params.id);
      if (deleteItemsError) {
        res.status(500).json({ error: deleteItemsError.message });
        return;
      }

      if (lineItems.length > 0) {
        const itemsPayload = lineItems.map((item) => ({
          invoice_id: req.params.id,
          ...item,
        }));
        const { error: insertItemsError } = await adminSupabase.from("invoice_items").insert(itemsPayload);
        if (insertItemsError) {
          res.status(500).json({ error: insertItemsError.message });
          return;
        }
      }
    }

    res.json({ data: updatedInvoice });
  } catch (error) {
    console.error("[API] failed to update invoice", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to update invoice") });
  }
});

app.delete("/invoices/:id", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);
    const isAdmin = isAdminUser(user);

    let query = adminSupabase.from("invoices").delete().eq("id", req.params.id);
    if (!isAdmin) {
      query = query.eq("user_id", profile.id);
    }

    const { error } = await query;
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: { id: req.params.id } });
  } catch (error) {
    console.error("[API] failed to delete invoice", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to delete invoice") });
  }
});

app.patch("/clients/:id", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const body = req.body as {
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
    address?: string;
    status?: string;
  };

  try {
    const profile = await getProfileForUser(user);
    const profileId = profile.id;
    const isAdmin = isAdminUser(user);

    let query = adminSupabase.from("clients").update(body).eq("id", req.params.id);
    if (!isAdmin) {
      query = query.eq("user_id", profileId);
    }

    const { data, error } = await query.select("*").single();

    if (error) {
      res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message });
      return;
    }

    res.json({ data });
  } catch (error) {
    console.error("[API] failed to update client", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to update client") });
  }
});

app.delete("/clients/:id", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);
    const profileId = profile.id;
    const isAdmin = isAdminUser(user);

    let query = adminSupabase.from("clients").delete().eq("id", req.params.id);
    if (!isAdmin) {
      query = query.eq("user_id", profileId);
    }

    const { error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: { id: req.params.id } });
  } catch (error) {
    console.error("[API] failed to delete client", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to delete client") });
  }
});

app.get("/expenses", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);
    const isAdmin = isAdminUser(user);

    let query = adminSupabase.from("expenses").select("*", { count: "exact" }).order("date", { ascending: false });
    if (!isAdmin) {
      query = query.eq("user_id", profile.id);
    }

    const { data, error, count } = await query;
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: data || [], total: count || 0 });
  } catch (error) {
    console.error("[API] failed to load expenses", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to load expenses") });
  }
});

app.get("/expenses/:id", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);
    const isAdmin = isAdminUser(user);

    let query = adminSupabase.from("expenses").select("*").eq("id", req.params.id);
    if (!isAdmin) {
      query = query.eq("user_id", profile.id);
    }

    const { data, error } = await query.single();
    if (error) {
      res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message });
      return;
    }

    res.json({ data });
  } catch (error) {
    console.error("[API] failed to load expense", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to load expense") });
  }
});

app.post("/expenses", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const body = (req.body || {}) as Record<string, unknown>;

  try {
    const profile = await getProfileForUser(user);
    const payload = sanitizeExpensePayload(body, profile.id);

    if (!payload.category || !payload.recipient || !payload.date || payload.amount <= 0) {
      res.status(400).json({ error: "Category, recipient, date, and a positive amount are required" });
      return;
    }

    const { data, error } = await adminSupabase.from("expenses").insert(payload).select("*").single();
    if (error || !data) {
      res.status(500).json({ error: error?.message || "Failed to create expense" });
      return;
    }

    res.status(201).json({ data });
  } catch (error) {
    console.error("[API] failed to create expense", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to create expense") });
  }
});

app.patch("/expenses/:id", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const body = (req.body || {}) as Record<string, unknown>;

  try {
    const profile = await getProfileForUser(user);
    const isAdmin = isAdminUser(user);
    const payload = sanitizeExpensePayload(body, profile.id);

    let query = adminSupabase.from("expenses").update(payload).eq("id", req.params.id);
    if (!isAdmin) {
      query = query.eq("user_id", profile.id);
    }

    const { data, error } = await query.select("*").single();
    if (error) {
      res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message });
      return;
    }

    res.json({ data });
  } catch (error) {
    console.error("[API] failed to update expense", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to update expense") });
  }
});

app.delete("/expenses/:id", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);
    const isAdmin = isAdminUser(user);

    let query = adminSupabase.from("expenses").delete().eq("id", req.params.id);
    if (!isAdmin) {
      query = query.eq("user_id", profile.id);
    }

    const { error } = await query;
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ data: { id: req.params.id } });
  } catch (error) {
    console.error("[API] failed to delete expense", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to delete expense") });
  }
});

app.post("/subscriptions/trial-setup", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const body = (req.body || {}) as { planId?: string };

  if (!body.planId) {
    res.status(400).json({ error: "planId is required" });
    return;
  }

  try {
    const profile = await getProfileForUser(user);

    const { data: plan, error: planError } = await adminSupabase
      .from("plans")
      .select("*")
      .eq("id", body.planId)
      .eq("is_active", true)
      .single();

    if (planError || !plan?.id) {
      res.status(404).json({ error: planError?.message || "Selected plan not found" });
      return;
    }

    const { data: existingSubscription, error: existingSubscriptionError } = await adminSupabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", profile.id)
      .in("status", ["trial", "active"])
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (existingSubscriptionError) {
      res.status(500).json({ error: existingSubscriptionError.message });
      return;
    }

    if (existingSubscription?.id) {
      res.json({ data: { subscription: existingSubscription, plan, existing: true } });
      return;
    }

    const trialDays = Number(plan.trial_days || 0);
    const startDate = new Date();
    const renewalDate = new Date(startDate);
    renewalDate.setDate(renewalDate.getDate() + (trialDays > 0 ? trialDays : 30));

    const payload = {
      user_id: profile.id,
      plan_id: plan.id,
      status: trialDays > 0 ? "trial" : "active",
      start_date: startDate.toISOString().split("T")[0],
      renewal_date: renewalDate.toISOString().split("T")[0],
      trial_start_date: trialDays > 0 ? startDate.toISOString() : null,
      trial_end_date: trialDays > 0 ? renewalDate.toISOString() : null,
      auto_renew: Boolean(plan.auto_renew),
    };

    const { data: subscription, error: subscriptionError } = await adminSupabase
      .from("subscriptions")
      .insert(payload)
      .select("*")
      .single();

    if (subscriptionError || !subscription?.id) {
      res.status(500).json({ error: subscriptionError?.message || "Failed to create subscription" });
      return;
    }

    res.status(201).json({ data: { subscription, plan, existing: false } });
  } catch (error) {
    console.error("[API] failed to set up trial subscription", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to set up trial subscription") });
  }
});

app.post("/subscriptions/:id/payfast-token", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const body = (req.body || {}) as { payfastToken?: string | null };

  try {
    const profile = await getProfileForUser(user);
    const isAdmin = isAdminUser(user);

    let query = adminSupabase.from("subscriptions").update({
      payfast_token: body.payfastToken || null,
      updated_at: new Date().toISOString(),
    }).eq("id", req.params.id);

    if (!isAdmin) {
      query = query.eq("user_id", profile.id);
    }

    const { data, error } = await query.select("*").single();

    if (error) {
      res.status(error.code === "PGRST116" ? 404 : 500).json({ error: error.message });
      return;
    }

    res.json({ data });
  } catch (error) {
    console.error("[API] failed to update subscription PayFast token", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to update subscription token") });
  }
});

app.post("/subscriptions/:id/activate-bypass", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  if (!apiConfig.trialBypassEnabled) {
    res.status(403).json({ error: "Trial bypass is disabled" });
    return;
  }

  try {
    const profile = await getProfileForUser(user);
    const isAdmin = isAdminUser(user);

    let subscriptionQuery = adminSupabase.from("subscriptions").select("*").eq("id", req.params.id);
    if (!isAdmin) {
      subscriptionQuery = subscriptionQuery.eq("user_id", profile.id);
    }

    const { data: subscription, error: subscriptionError } = await subscriptionQuery.single();
    if (subscriptionError || !subscription?.id) {
      res.status(subscriptionError?.code === "PGRST116" ? 404 : 500).json({
        error: subscriptionError?.message || "Subscription not found",
      });
      return;
    }

    const { data: updatedSubscription, error: updateError } = await adminSupabase
      .from("subscriptions")
      .update({
        payfast_token: subscription.payfast_token || "TRIAL_BYPASS",
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id)
      .select("*")
      .single();

    if (updateError || !updatedSubscription) {
      res.status(500).json({ error: updateError?.message || "Failed to activate bypass trial" });
      return;
    }

    res.json({ data: updatedSubscription });
  } catch (error) {
    console.error("[API] failed to activate bypass trial", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to activate bypass trial") });
  }
});

app.post("/subscriptions/:id/payfast-checkout", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);
    const isAdmin = isAdminUser(user);

    let subscriptionQuery = adminSupabase
      .from("subscriptions")
      .select("*")
      .eq("id", req.params.id);

    if (!isAdmin) {
      subscriptionQuery = subscriptionQuery.eq("user_id", profile.id);
    }

    const { data: subscription, error: subscriptionError } = await subscriptionQuery.single();
    if (subscriptionError || !subscription?.id) {
      res.status(subscriptionError?.code === "PGRST116" ? 404 : 500).json({
        error: subscriptionError?.message || "Subscription not found",
      });
      return;
    }

    const { data: plan, error: planError } = await adminSupabase
      .from("plans")
      .select("*")
      .eq("id", subscription.plan_id)
      .single();

    if (planError || !plan?.id) {
      res.status(planError?.code === "PGRST116" ? 404 : 500).json({
        error: planError?.message || "Plan not found for subscription",
      });
      return;
    }

    const checkout = buildTrialSubscriptionCheckout({
      userId: profile.id,
      userEmail: profile.business_email || user.email || "",
      userName: profile.full_name || user.name || user.nickname || user.email || "Customer",
      amount: Number(plan.price || 0),
      subscriptionId: subscription.id,
      planName: String(plan.name || "InvoicePro"),
      trialDays: Number(plan.trial_days || 0),
      billingCycle: plan.billing_cycle === "yearly" ? "yearly" : "monthly",
    });

    res.json({ data: checkout });
  } catch (error) {
    console.error("[API] failed to build PayFast checkout", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to build PayFast checkout") });
  }
});

app.get("/subscriptions/:id/payfast-debug", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;

  try {
    const profile = await getProfileForUser(user);
    const isAdmin = isAdminUser(user);

    let subscriptionQuery = adminSupabase
      .from("subscriptions")
      .select("*")
      .eq("id", req.params.id);

    if (!isAdmin) {
      subscriptionQuery = subscriptionQuery.eq("user_id", profile.id);
    }

    const { data: subscription, error: subscriptionError } = await subscriptionQuery.single();
    if (subscriptionError || !subscription?.id) {
      res.status(subscriptionError?.code === "PGRST116" ? 404 : 500).json({
        error: subscriptionError?.message || "Subscription not found",
      });
      return;
    }

    const { data: plan, error: planError } = await adminSupabase
      .from("plans")
      .select("*")
      .eq("id", subscription.plan_id)
      .single();

    if (planError || !plan?.id) {
      res.status(planError?.code === "PGRST116" ? 404 : 500).json({
        error: planError?.message || "Plan not found for subscription",
      });
      return;
    }

    const checkout = buildTrialSubscriptionCheckout({
      userId: profile.id,
      userEmail: profile.business_email || user.email || "",
      userName: profile.full_name || user.name || user.nickname || user.email || "Customer",
      amount: Number(plan.price || 0),
      subscriptionId: subscription.id,
      planName: String(plan.name || "InvoicePro"),
      trialDays: Number(plan.trial_days || 0),
      billingCycle: plan.billing_cycle === "yearly" ? "yearly" : "monthly",
    });

    res.json({
      data: {
        subscriptionId: subscription.id,
        planId: plan.id,
        planName: plan.name,
        debug: checkout.debug,
        url: checkout.url,
      },
    });
  } catch (error) {
    console.error("[API] failed to build PayFast debug payload", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to build PayFast debug payload") });
  }
});

app.post("/emails/test", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const body = req.body as { email?: string };
  const email = body.email?.trim() || user.email;

  if (!email) {
    res.status(400).json({ error: "Missing email address" });
    return;
  }

  try {
    const result = await sendResendEmail({
      to: email,
      subject: "InvoicePro Resend test",
      text: "This is a test email from the InvoicePro API using Resend.",
      html: "<p>This is a test email from the <strong>InvoicePro API</strong> using Resend.</p>",
    });

    res.json({ ok: true, id: result.id, to: email });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to send test email" });
  }
});

app.post("/emails/invoice", async (req: AuthedRequest, res: Response) => {
  const body = req.body as {
    to: string;
    toName: string;
    invoiceNumber: string;
    invoiceTotal: string;
    invoiceDate: string;
    dueDate: string;
    invoiceStatus: string;
    businessName: string;
    businessEmail?: string;
    notes?: string;
    includePlatformBranding?: boolean;
    pdfBase64?: string;
  };

  if (!body.to || !body.invoiceNumber || !body.invoiceTotal || !body.invoiceDate || !body.dueDate || !body.invoiceStatus || !body.businessName) {
    res.status(400).json({ error: "Missing required invoice email fields" });
    return;
  }

  try {
    const pdfBase64 = body.pdfBase64?.includes(",") ? body.pdfBase64.split(",")[1] : body.pdfBase64;
    const result = await sendInvoiceEmail({
      ...body,
      pdfBase64,
    });
    res.json({ ok: true, id: result.id });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to send invoice email" });
  }
});

app.post("/emails/expense", async (req: AuthedRequest, res: Response) => {
  const body = req.body as {
    to: string;
    toName: string;
    expenseCategory: string;
    expenseDate: string;
    expenseAmount: string;
    paymentMethod: string;
    businessName: string;
    businessEmail?: string;
    notes?: string;
    pdfBase64?: string;
  };

  try {
    const response = await sendExpenseReceiptEmail({
      to: body.to,
      toName: body.toName,
      expenseCategory: body.expenseCategory,
      expenseDate: body.expenseDate,
      expenseAmount: body.expenseAmount,
      paymentMethod: body.paymentMethod,
      businessName: body.businessName || "InvoicePro",
      businessEmail: body.businessEmail,
      notes: body.notes,
      pdfBase64: body.pdfBase64,
    });

    res.json({ ok: true, id: response.id });
  } catch (error) {
    console.error("[API] failed to send expense receipt email", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to send expense receipt email") });
  }
});

app.post("/emails/trial", async (req: AuthedRequest, res: Response) => {
  const body = req.body as {
    to: string;
    toName: string;
    subject: string;
    message: string;
    metadata?: Record<string, string>;
  };

  if (!body.to || !body.subject || !body.message) {
    res.status(400).json({ error: "Missing required trial email fields" });
    return;
  }

  try {
    const result = await sendTrialLifecycleEmail({
      to: body.to,
      toName: body.toName || "User",
      subject: body.subject,
      message: body.message,
      metadata: body.metadata,
    });
    res.json({ ok: true, id: result.id });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to send trial email" });
  }
});

app.post("/auth/sync-profile", async (req: AuthedRequest, res: Response) => {
  const user = req.user!;
  const isAdmin = isAdminUser(user);
  const body = req.body as {
    fullName?: string;
    email?: string | null;
    mode?: "login" | "signup" | "admin-login";
  };

  const resolvedName =
    body.fullName?.trim() || user.name || user.nickname || user.email || (body.mode === "admin-login" ? "Admin" : "User");
  const resolvedEmail = body.email?.trim() || user.email || null;

  const payload = {
    auth0_user_id: user.sub,
    auth_provider: "auth0",
    full_name: resolvedName,
    business_email: resolvedEmail,
    role: isAdmin ? "admin" : "user",
    last_login_at: new Date().toISOString(),
  };

  const { data: existingProfile, error: existingError } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", user.sub)
    .maybeSingle();

  if (existingError) {
    res.status(500).json({ error: existingError.message });
    return;
  }

  if (existingProfile?.id) {
    const { data, error } = await adminSupabase
      .from("profiles")
      .update(payload)
      .eq("id", existingProfile.id)
      .select("*")
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ profile: data, created: false });
    return;
  }

  const { data, error } = await adminSupabase
    .from("profiles")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    res.status(500).json({
      error: error.message,
      hint: "If this fails on profiles.id foreign key, run the Auth0 profile decoupling migration first.",
    });
    return;
  }

  if (!isAdmin && resolvedEmail && isResendConfigured()) {
    try {
      await sendWelcomeEmail({
        email: resolvedEmail,
        fullName: resolvedName,
      });
    } catch (welcomeError) {
      console.error("[API] welcome email failed", welcomeError);
    }
  }

  res.status(201).json({ profile: data, created: true });
});

export { app };
