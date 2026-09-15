import { getChatGPTUser } from "../../../chatgpt-auth";
import { database, ensureUser } from "../../../../db/index";
import { ensureLivePixWebhook, livePixConfigured, livePixRequest } from "../../../../lib/livepix";

const PLANS = {
  creator: { title: "Weezy Creator — 30 dias", amountCents: 1990 },
  pro: { title: "Weezy Pro — 30 dias", amountCents: 3990 },
};

export async function POST(request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
  if (!livePixConfigured()) return Response.json({ error: "O LivePix ainda precisa ser conectado pelo administrador." }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const selected = PLANS[body.plan];
  if (!selected) return Response.json({ error: "Plano inválido." }, { status: 400 });

  const origin = new URL(request.url).origin;
  try {
    await ensureLivePixWebhook(`${origin}/api/payments/webhook`);
  } catch {
    return Response.json({ error: "Não foi possível conectar ao LivePix agora." }, { status: 502 });
  }

  await ensureUser(user);
  const orderId = crypto.randomUUID();
  const now = new Date().toISOString();
  await database().prepare("INSERT INTO orders (id, user_id, plan, amount_cents, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', ?, ?)")
    .bind(orderId, user.userId, body.plan, selected.amountCents, now, now).run();

  const response = await livePixRequest("/v2/payments", {
    method: "POST",
    body: JSON.stringify({
      amount: selected.amountCents,
      currency: "BRL",
      redirectUrl: `${origin}/account?payment=success`,
    }),
  });
  const payment = await response.json().catch(() => ({}));
  const reference = payment?.data?.reference;
  const checkoutUrl = payment?.data?.redirectUrl;
  if (!response.ok || !reference || !checkoutUrl) {
    await database().prepare("UPDATE orders SET status = 'failed', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), orderId).run();
    return Response.json({ error: "Não foi possível abrir o pagamento agora." }, { status: 502 });
  }
  await database().prepare("UPDATE orders SET provider_payment_id = ?, updated_at = ? WHERE id = ?")
    .bind(String(reference), new Date().toISOString(), orderId).run();
  return Response.json({ checkoutUrl });
}
