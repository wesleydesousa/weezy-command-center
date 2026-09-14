import { env } from "cloudflare:workers";
import { database } from "../../../../db/index";

async function validSignature(request, dataId) {
  const secret = env.MERCADO_PAGO_WEBHOOK_SECRET;
  const signature = request.headers.get("x-signature") || "";
  const requestId = request.headers.get("x-request-id") || "";
  const parts = Object.fromEntries(signature.split(",").map(part => part.trim().split("=")));
  if (!secret || !parts.ts || !parts.v1 || !requestId || !dataId) return false;
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const expected = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
  if (expected.length !== parts.v1.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index++) mismatch |= expected.charCodeAt(index) ^ parts.v1.charCodeAt(index);
  return mismatch === 0;
}

export async function POST(request) {
  const url = new URL(request.url);
  const payload = await request.json().catch(() => ({}));
  const paymentId = url.searchParams.get("data.id") || payload?.data?.id;
  if (!(await validSignature(request, paymentId))) return new Response("invalid signature", { status: 401 });
  if (payload.type !== "payment" || !paymentId) return new Response("ok");

  const token = env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return new Response("payment unavailable", { status: 503 });
  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: { authorization: `Bearer ${token}` } });
  if (!paymentResponse.ok) return new Response("retry", { status: 502 });
  const payment = await paymentResponse.json();
  const orderId = payment.external_reference;
  if (!orderId) return new Response("ok");

  const order = await database().prepare("SELECT id, user_id AS userId, plan FROM orders WHERE id = ?").bind(orderId).first();
  if (!order) return new Response("ok");
  const now = new Date();
  await database().prepare("UPDATE orders SET status = ?, provider_payment_id = ?, updated_at = ? WHERE id = ?")
    .bind(payment.status || "unknown", String(payment.id), now.toISOString(), orderId).run();
  if (payment.status === "approved") {
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await database().prepare(`
      INSERT INTO subscriptions (user_id, plan, status, expires_at, updated_at)
      VALUES (?, ?, 'active', ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET plan = excluded.plan, status = 'active', expires_at = excluded.expires_at, updated_at = excluded.updated_at
    `).bind(order.userId, order.plan, expiresAt, now.toISOString()).run();
  }
  return new Response("ok");
}
