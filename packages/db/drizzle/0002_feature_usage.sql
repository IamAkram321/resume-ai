CREATE TABLE IF NOT EXISTS "feature_usage" (
  "user_id" text NOT NULL,
  "feature" text NOT NULL,
  "usage_date" date NOT NULL,
  "count" integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("user_id", "feature", "usage_date")
);
