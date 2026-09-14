-- 1. new role values (usable from the next migration onward)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'school_admin';

-- 2. schools table
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name text NOT NULL,
  school_code text NOT NULL UNIQUE,
  address text,
  city text,
  state text,
  pincode text,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS t_schools_upd ON public.schools;
CREATE TRIGGER t_schools_upd BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. school_id columns
ALTER TABLE public.profiles           ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL;
ALTER TABLE public.classes            ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.subjects           ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.students           ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;
ALTER TABLE public.homework_sessions  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_profiles_school   ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school    ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school   ON public.subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school   ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_sessions_school   ON public.homework_sessions(school_id);

-- 4. default school + backfill of all existing data
INSERT INTO public.schools (school_name, school_code, status)
VALUES ('Default School', 'DEFAULT', 'active')
ON CONFLICT (school_code) DO NOTHING;

UPDATE public.profiles p
   SET school_id = s.id
  FROM public.schools s
 WHERE s.school_code = 'DEFAULT' AND p.school_id IS NULL;

UPDATE public.classes c
   SET school_id = s.id
  FROM public.schools s
 WHERE s.school_code = 'DEFAULT' AND c.school_id IS NULL;

UPDATE public.subjects sub
   SET school_id = c.school_id
  FROM public.classes c
 WHERE c.id = sub.class_id AND sub.school_id IS NULL;

UPDATE public.students st
   SET school_id = c.school_id
  FROM public.classes c
 WHERE c.id = st.class_id AND st.school_id IS NULL;

UPDATE public.homework_sessions hs
   SET school_id = c.school_id
  FROM public.classes c
 WHERE c.id = hs.class_id AND hs.school_id IS NULL;

-- 5. helper: the caller's school
CREATE OR REPLACE FUNCTION public.current_school_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_school_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_school_id() TO authenticated, service_role;

-- 6. auto-stamp school_id on inserts so existing app code keeps working
CREATE OR REPLACE FUNCTION public.set_class_school()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.school_id IS NULL THEN
    NEW.school_id := public.current_school_id();
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.set_child_school()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.school_id IS NULL THEN
    SELECT c.school_id INTO NEW.school_id FROM public.classes c WHERE c.id = NEW.class_id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS t_classes_school ON public.classes;
CREATE TRIGGER t_classes_school BEFORE INSERT ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.set_class_school();

DROP TRIGGER IF EXISTS t_subjects_school ON public.subjects;
CREATE TRIGGER t_subjects_school BEFORE INSERT ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_child_school();

DROP TRIGGER IF EXISTS t_students_school ON public.students;
CREATE TRIGGER t_students_school BEFORE INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_child_school();

DROP TRIGGER IF EXISTS t_sessions_school ON public.homework_sessions;
CREATE TRIGGER t_sessions_school BEFORE INSERT ON public.homework_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_child_school();