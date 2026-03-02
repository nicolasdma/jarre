-- Add billing columns to user_profiles (safe: IF NOT EXISTS / ADD COLUMN checks)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'free'
      CHECK (subscription_status IN ('free', 'active', 'canceled', 'past_due'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'lemonsqueezy_customer_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN lemonsqueezy_customer_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'lemonsqueezy_subscription_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN lemonsqueezy_subscription_id TEXT;
  END IF;
END $$;
