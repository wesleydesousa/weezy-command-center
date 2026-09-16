import { env } from "cloudflare:workers";
import { activatePaidOrder, database } from "../db/index";

const TOKEN_SCOPE = "payments:read payments:write webhooks";
let cachedToken = null;
let tokenExpiresAt = 0;

export function livePixConfigured() {
  return Boolean(env.LIVEPIX_CLIENT_ID && env.LIVEPIX_CLIENT_SECRET);
}

async function requestToken() {
  if (!livePixConfigured()) throw new Error("LIVEPIX_NOT_CONFIGURED");
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.LIVEPIX_CLIENT_ID,
    client_secret: env.LIVEPIX_CLIENT_SECRET,
    scope: TOKEN_SCOPE,
  });
  const response = await fetch("https://oauth.livepix.gg/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.access_token) throw new Error("LIVEPIX_AUTH_FAILED");

  cachedToken = result.access_token;
  tokenExpiresAt = Date.now() + Number(result.expires_in || 3600) * 1000;
  return cachedToken;
}

export async function livePixRequest(path, options = {}, retry = true) {
  const token = await requestToken();
  const response = await fetch(`https://api.livepix.gg${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401 && retry) {
    cachedToken = null;
    tokenExpiresAt = 0;
    return livePixRequest(path, options, false);
  }
  return response;
}

export async function ensureLivePixWebhook(webhookUrl) {
  const listResponse = await livePixRequest("/v2/webhooks?limit=100");
  if (!listResponse.ok) throw new Error("LIVEPIX_WEBHOOK_READ_FAILED");
  const list = await listResponse.json().catch(() => ({}));
  if ((list.data || []).some(webhook => webhook.url === webhookUrl)) return;

  const createResponse = await livePixRequest("/v2/webhooks", {
    method: "POST",
    body: JSON.stringify({ url: webhookUrl }),
  });
  if (!createResponse.ok) throw new Error("LIVEPIX_WEBHOOK_CREATE_FAILED");
}

export async function reconcileLatestLivePixOrder(userId) {
  const order = await database().prepare(`
    SELECT id, user_id AS userId, plan, amount_cents AS amountCents, status, provider_payment_id AS providerPaymentId
    FROM orders
    WHERE user_id = ? AND status = 'pending' AND provider_payment_id IS NOT NULL
    ORDER BY created_at DESC LIMIT 1
  `).bind(userId).first();
  if (!order) return false;

  const response = await livePixRequest(`/v2/payments?reference=${encodeURIComponent(order.providerPaymentId)}&currency=BRL&limit=10`);
  if (!response.ok) return false;
  const result = await response.json().catch(() => ({}));
  const payment = (result.data || []).find(item => String(item.reference) === String(order.providerPaymentId));
  if (!payment || Number(payment.amount) !== Number(order.amountCents)) return false;
  await activatePaidOrder(order);
  return true;
}
