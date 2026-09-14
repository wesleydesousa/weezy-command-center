import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  plan: text("plan").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull(),
  providerPaymentId: text("provider_payment_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("idx_orders_user_created").on(table.userId, table.createdAt)]);

export const subscriptions = sqliteTable("subscriptions", {
  userId: text("user_id").primaryKey().references(() => users.id),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
  expiresAt: text("expires_at"),
  updatedAt: text("updated_at").notNull(),
});

export const editingUsage = sqliteTable("editing_usage", {
  userId: text("user_id").notNull().references(() => users.id),
  usageDate: text("usage_date").notNull(),
  count: integer("count").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.usageDate] })]);
