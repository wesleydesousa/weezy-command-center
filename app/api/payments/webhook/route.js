import { activatePaidOrder, database } from "../../../../db/index";
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

  await activatePaidOrder(order);
  return new Response("ok");
}
