import { getChatGPTUser } from "../../../chatgpt-auth";
import { consumeEditingUse, getEffectiveSubscription } from "../../../../db/index";

export async function POST() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });

  const subscription = await getEffectiveSubscription(user);
  if (!subscription) return Response.json({ error: "É necessário ter um plano ativo." }, { status: 403 });

  const result = await consumeEditingUse(user.userId, subscription.plan);
  if (!result.allowed) return Response.json({ error: result.reason, usage: result.usage }, { status: 429 });
  return Response.json(result);
}
