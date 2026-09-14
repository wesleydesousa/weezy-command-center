import { getChatGPTUser } from "../../../chatgpt-auth";
import { getActiveSubscription } from "../../../../db/index";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ signedIn: false, paid: false, plan: "free" });

  const subscription = await getActiveSubscription(user.userId);
  return Response.json({
    signedIn: true,
    paid: Boolean(subscription),
    plan: subscription?.plan || "free",
    expiresAt: subscription?.expiresAt || null,
  });
}
