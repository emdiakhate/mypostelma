-- Fix security warning: Set search_path for all functions using CREATE OR REPLACE

-- Fix generate_upload_post_username function
CREATE OR REPLACE FUNCTION public.generate_upload_post_username()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.upload_post_username IS NULL AND NEW.name IS NOT NULL THEN
    NEW.upload_post_username := LOWER(
      REGEXP_REPLACE(
        TRIM(NEW.name),
        '[^a-zA-Z0-9_@-]',
        '_',
        'g'
      )
    ) || '_' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name,
    beta_user,
    ai_image_generation_count,
    ai_image_generation_limit,
    ai_video_generation_count,
    ai_video_generation_limit,
    lead_generation_count,
    lead_generation_limit,
    quota_reset_date
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    true,
    0,
    5,
    0,
    5,
    0,
    5,
    NOW()
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'manager');
  
  RETURN NEW;
END;
$$;

-- Fix initialize_beta_quotas function
CREATE OR REPLACE FUNCTION public.initialize_beta_quotas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.beta_user = true THEN
    NEW.ai_image_generation_count := 0;
    NEW.ai_image_generation_limit := 5;
    NEW.ai_video_generation_count := 0;
    NEW.ai_video_generation_limit := 5;
    NEW.lead_generation_count := 0;
    NEW.lead_generation_limit := 5;
    NEW.quota_reset_date := NOW();
  END IF;

  RETURN NEW;
END;
$$;