
-- Create email_verifications table for OTP codes
CREATE TABLE public.email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (edge function uses service role anyway)
CREATE POLICY "Anyone can read own verification by email"
ON public.email_verifications FOR SELECT
USING (true);

-- Insert admin role for abrahamtemitope247@gmail.com if user exists
-- We'll do this via a trigger that fires on profile creation
CREATE OR REPLACE FUNCTION public.auto_assign_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'abrahamtemitope247@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_assign_admin
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_admin();

-- Also insert admin role now if profile already exists
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'
FROM public.profiles p
WHERE p.email = 'abrahamtemitope247@gmail.com'
ON CONFLICT DO NOTHING;
