import { env } from "cloudflare:workers";

export function database() {
  if (!env.DB) throw new Error("Banco de dados indisponível");
  return env.DB;
}

export async function ensureUser(user) {
  const now = new Date().toISOString();
  await database().prepare(`
    INSERT INTO users (id, email, name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name, updated_at = excluded.updated_at
  `).bind(user.userId, user.email, user.fullName, now, now).run();
}

export async function getAccount(userId) {
  const db = database();
  const [profile, subscription, orders] = await Promise.all([
    db.prepare("SELECT id, email, name, created_at AS createdAt FROM users WHERE id = ?").bind(userId).first(),
    db.prepare("SELECT plan, status, expires_at AS expiresAt FROM subscriptions WHERE user_id = ?").bind(userId).first(),
    db.prepare("SELECT id, plan, amount_cents AS amountCents, status, created_at AS createdAt FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 8").bind(userId).all(),
  ]);
  return { profile, subscription, orders: orders.results || [] };
}

export function isMasterUser(user) {
  const email = String(user?.email || "").trim().toLowerCase();
  if (!email) return false;
  const masterEmails = String(env.MASTER_EMAILS || "")
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
  return masterEmails.includes(email);
}

export async function getActiveSubscription(userId) {
  const subscription = await database().prepare("SELECT plan, status, expires_at AS expiresAt FROM subscriptions WHERE user_id = ?").bind(userId).first();
  if (!subscription || subscription.status !== "active") return null;
  if (subscription.expiresAt && new Date(subscription.expiresAt) <= new Date()) return null;
  return subscription;
}

export async function getEffectiveSubscription(user) {
  if (isMasterUser(user)) return { plan: "master", status: "active", expiresAt: null };
  return getActiveSubscription(user.userId);
}

function usagePeriod() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date()).filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, month: `${parts.year}-${parts.month}` };
}

export async function getEditingUsage(userId) {
  const { day, month } = usagePeriod();
  const db = database();
  const [daily, monthly] = await Promise.all([
    db.prepare("SELECT count FROM editing_usage WHERE user_id = ? AND usage_date = ?").bind(userId, day).first(),
    db.prepare("SELECT COALESCE(SUM(count), 0) AS count FROM editing_usage WHERE user_id = ? AND usage_date LIKE ?").bind(userId, `${month}-%`).first(),
  ]);
  const dailyUsed = Number(daily?.count || 0);
  const monthlyUsed = Number(monthly?.count || 0);
  return { dailyUsed, monthlyUsed, dailyRemaining: Math.max(0, 5 - dailyUsed), monthlyRemaining: Math.max(0, 150 - monthlyUsed) };
}

export async function consumeEditingUse(userId, plan) {
  if (plan === "pro" || plan === "master") return { allowed: true, unlimited: true };
  if (plan !== "creator") return { allowed: false, reason: "Plano sem acesso às edições completas." };

  const usage = await getEditingUsage(userId);
  if (usage.dailyRemaining === 0) return { allowed: false, reason: "Você atingiu 5 edições hoje.", usage };
  if (usage.monthlyRemaining === 0) return { allowed: false, reason: "Você atingiu 150 edições neste mês.", usage };

  const { day } = usagePeriod();
  const now = new Date().toISOString();
  const result = await database().prepare(`
    INSERT INTO editing_usage (user_id, usage_date, count, updated_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(user_id, usage_date) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at
    WHERE count < 5
  `).bind(userId, day, now).run();
  const nextUsage = await getEditingUsage(userId);
  if (!result.meta?.changes) return { allowed: false, reason: "Você atingiu 5 edições hoje.", usage: nextUsage };
  return { allowed: true, usage: nextUsage };
}
