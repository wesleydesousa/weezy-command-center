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
