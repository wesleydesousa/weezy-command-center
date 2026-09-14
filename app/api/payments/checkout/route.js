import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { database, ensureUser } from "../../../../db/index";

const PLANS = {
  creator: { title: "Weezy Creator — 30 dias", amountCents: 1990 },
  pro: { title: "Weezy Pro — 30 dias", amountCents: 3990 },
};

export async function POST(request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  const token = env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return Response.json({ error: "Pagamentos ainda não foram ativados pelo administrador." }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const selected = PLANS[body.plan];
  if (!selected) return Response.json({ error: "Plano inválido." }, { status: 400 });

  await ensureUser(user);
  const orderId = crypto.randomUUID();
  const now = new Date().toISOString();
  await database().prepare("INSERT INTO orders (id, user_id, plan, amount_cents, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', ?, ?)")
    .bind(orderId, user.userId, body.plan, selected.amountCents, now, now).run();

  const origin = new URL(request.url).origin;
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "x-idempotency-key": orderId },
    body: JSON.stringify({
      items: [{ id: body.plan, title: selected.title, quantity: 1, currency_id: "BRL", unit_price: selected.amountCents / 100 }],
      payer: { email: user.email },
      external_reference: orderId,
      back_urls: { success: `${origin}/account?payment=success`, pending: `${origin}/account?payment=pending`, failure: `${origin}/account?payment=failure` },
      auto_return: "approved",
      notification_url: `${origin}/api/payments/webhook`,
    }),
  });
  const preference = await response.json();
  if (!response.ok || !preference.init_point) {
    await database().prepare("UPDATE orders SET status = 'failed', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), orderId).run();
    return Response.json({ error: "Não foi possível abrir o pagamento agora." }, { status: 502 });
  }
  return Response.json({ checkoutUrl: preference.init_point });
}
