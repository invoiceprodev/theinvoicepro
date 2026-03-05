import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { processWebhook, verifyPayFastIP } from "../../src/services/payfast-webhook.service";
import type { PayFastWebhookPayload } from "../../src/services/payfast-webhook.service";

/**
 * PayFast ITN (Instant Transaction Notification) Webhook Handler
 * Netlify Function endpoint: /.netlify/functions/payfast-webhook
 *
 * This endpoint receives payment notifications from PayFast and processes them
 */

const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  // Only accept POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  try {
    console.log("[PayFast Webhook] Received notification");

    // Parse request body
    let webhookData: PayFastWebhookPayload;
    try {
      // PayFast sends form-urlencoded data
      const bodyData = event.body || "";
      const params = new URLSearchParams(bodyData);
      webhookData = Object.fromEntries(params.entries()) as unknown as PayFastWebhookPayload;
    } catch (parseError) {
      console.error("[PayFast Webhook] Error parsing request body:", parseError);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request body format" }),
      };
    }

    // Optional: Verify request comes from PayFast IP (additional security)
    const clientIP = event.headers["x-forwarded-for"] || event.headers["client-ip"];
    if (clientIP && process.env.VITE_PAYFAST_VERIFY_IP === "true") {
      const isValidIP = verifyPayFastIP(clientIP);
      if (!isValidIP) {
        console.warn("[PayFast Webhook] Request from invalid IP:", clientIP);
        return {
          statusCode: 403,
          body: JSON.stringify({ error: "Forbidden - Invalid source IP" }),
        };
      }
    }

    // Get passphrase from environment
    const passphrase = process.env.VITE_PAYFAST_PASSPHRASE;

    // Process webhook
    const result = await processWebhook(webhookData, passphrase);

    if (!result.success) {
      console.error("[PayFast Webhook] Processing failed:", result.error);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: result.message,
          details: result.error,
        }),
      };
    }

    console.log("[PayFast Webhook] Processing successful:", result.message);

    // Return success response (PayFast expects 200 OK)
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: result.message,
        paymentId: result.paymentId,
      }),
    };
  } catch (error) {
    console.error("[PayFast Webhook] Unexpected error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

export { handler };
