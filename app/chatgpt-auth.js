import { headers } from "next/headers";
import { redirect } from "next/navigation";

const SIGN_IN_PATH = "/signin-with-chatgpt";

export async function getChatGPTUser() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  if (!userId || !email) return null;

  const encodedName = requestHeaders.get("oai-authenticated-user-full-name");
  const isEncoded = requestHeaders.get("oai-authenticated-user-full-name-encoding") === "percent-encoded-utf-8";
  let fullName = null;
  if (encodedName && isEncoded) {
    try { fullName = decodeURIComponent(encodedName); } catch {}
  }

  return { userId, email, fullName, displayName: fullName || email };
}

export async function requireChatGPTUser(returnTo) {
  const user = await getChatGPTUser();
  if (user) return user;
  redirect(chatGPTSignInPath(returnTo));
}

export function chatGPTSignInPath(returnTo = "/account") {
  const safe = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/account";
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safe)}`;
}

export function chatGPTSignOutPath(returnTo = "/") {
  const safe = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  return `/signout-with-chatgpt?return_to=${encodeURIComponent(safe)}`;
}
