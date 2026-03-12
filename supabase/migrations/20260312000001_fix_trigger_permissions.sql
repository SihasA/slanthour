-- Fix: The handle_new_user trigger needs to INSERT into profiles, themes, and portfolios.
-- Even with SECURITY DEFINER, Supabase may enforce RLS depending on the execution context.
-- Solution: Add INSERT policies that allow the trigger to work, and also set search_path.

-- Allow service role / trigger to insert profiles
CREATE POLICY "Service can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Allow service role / trigger to insert themes
CREATE POLICY "Service can insert themes"
  ON themes FOR INSERT
  WITH CHECK (true);

-- Allow service role / trigger to insert portfolios
CREATE POLICY "Service can insert portfolios"
  ON portfolios FOR INSERT
  WITH CHECK (true);

-- Recreate function with explicit search_path for security
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate username from email
  base_username := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9-]', '-', 'g'));
  base_username := REGEXP_REPLACE(base_username, '-+', '-', 'g');
  base_username := TRIM(BOTH '-' FROM base_username);

  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  final_username := base_username;

  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || '-' || counter;
  END LOOP;

  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', final_username)
  );

  INSERT INTO themes (user_id) VALUES (NEW.id);

  INSERT INTO portfolios (user_id, title) VALUES (NEW.id, 'Untitled Portfolio');

  RETURN NEW;
END;
$$;
