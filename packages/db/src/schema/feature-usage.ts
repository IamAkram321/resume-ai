import { pgTable, text, integer, date, primaryKey } from "drizzle-orm/pg-core";

/** Daily per-feature usage counters (resets each UTC calendar day). */
export const featureUsageTable = pgTable(
  "feature_usage",
  {
    userId: text("user_id").notNull(),
    feature: text("feature").notNull(),
    usageDate: date("usage_date").notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.userId, table.feature, table.usageDate] })],
);

export type FeatureUsageRow = typeof featureUsageTable.$inferSelect;
