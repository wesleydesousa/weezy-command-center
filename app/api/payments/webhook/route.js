import { database } from "../../../../db/index";
import { livePixConfigured, livePixRequest } from "../../../../lib/livepix";

export async function POST(request) {
  const payload = await request.json().catch(() => ({}));
  const paymentId = payload?.resource?.id;
  const notifiedReference = payload?.resource?.reference;
  if (payload.event !== "new" || payload?.resource?.type !== "payment" || !paymentId) return new Response("ok");
  if (!livePixConfigured()) return new Response("payment unavailable", { status: 503 });

  const paymentResponse = await livePixRequest(`/v2/payments/${encodeURIComponent(paymentId)}`);
  if (!paymentResponse.ok) return new Response("retry", { status: 502 });
  const result = await paymentResponse.json().catch(() => ({}));
  const payment = result?.data;
  if (!payment?.id || Number(payment.amount) <= 0 || payment.currency !== "BRL") return new Response("ok");

  const reference = String(payment.reference || notifiedReference || "");
  const order = await database().prepare("SELECT id, user_id AS userId, plan, amount_cents AS amountCents, status FROM orders WHERE provider_payment_id = ?")
    .bind(reference).first();
  if (!order) return new Response("ok");
  if (order.status === "approved") return new Response("ok");
  if (Number(order.amountCents) !== Number(payment.amount)) return new Response("ok");

  const now = new Date();
  await database().prepare("UPDATE orders SET status = 'approved', updated_at = ? WHERE id = ?")
    .bind(now.toISOString(), order.id).run();
  const current = await database().prepare("SELECT expires_at AS expiresAt FROM subscriptions WHERE user_id = ?").bind(order.userId).first();
  const baseTime = current?.expiresAt && new Date(current.expiresAt) > now ? new Date(current.expiresAt).getTime() : now.getTime();
  const expiresAt = new Date(baseTime + 30 * 24 * 60 * 60 * 1000).toISOString();
  await database().prepare(`
    INSERT INTO subscriptions (user_id, plan, status, expires_at, updated_at)
    VALUES (?, ?, 'active', ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET plan = excluded.plan, status = 'active', expires_at = excluded.expires_at, updated_at = excluded.updated_at
  `).bind(order.userId, order.plan, expiresAt, now.toISOString()).run();
  return new Response("ok");
}
