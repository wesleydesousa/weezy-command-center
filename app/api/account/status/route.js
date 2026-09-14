import { getChatGPTUser } from "../../../chatgpt-auth";
import { getEditingUsage, getEffectiveSubscription } from "../../../../db/index";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ signedIn: false, paid: false, plan: "free" });

  const subscription = await getEffectiveSubscription(user);
  const usage = subscription?.plan === "creator" ? await getEditingUsage(user.userId) : null;
  return Response.json({
    signedIn: true,
    paid: Boolean(subscription),
    plan: subscription?.plan || "free",
    expiresAt: subscription?.expiresAt || null,
    usage,
  });
}
