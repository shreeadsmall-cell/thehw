-- helpers ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_school_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('school_admin', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin() OR public.is_school_admin();
$$;

CREATE OR REPLACE FUNCTION public.can_access_school(_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin()
      OR (_school_id IS NOT NULL AND _school_id = public.current_school_id());
$$;

CREATE OR REPLACE FUNCTION public.owns_class(_class_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = _class_id
      AND public.can_access_school(c.school_id)
      AND (c.teacher_id = auth.uid() OR public.is_admin())
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_session(_session_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.homework_sessions s
    WHERE s.id = _session_id AND public.owns_class(s.class_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_student(_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students st
    WHERE st.id = _student_id AND public.owns_class(st.class_id)
  );
$$;

REVOKE ALL ON FUNCTION public.set_class_school() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_child_school() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_super_admin(), public.is_school_admin(), public.is_admin(),
  public.can_access_school(uuid), public.owns_class(uuid), public.owns_session(uuid),
  public.owns_student(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(), public.is_school_admin(), public.is_admin(),
  public.can_access_school(uuid), public.owns_class(uuid), public.owns_session(uuid),
  public.owns_student(uuid) TO authenticated, service_role;

-- role migration ---------------------------------------------------------
UPDATE public.user_roles ur
   SET role = 'super_admin'
 WHERE ur.role = 'admin'
   AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = ur.user_id AND lower(p.email) = 'mahipaljinjala@gmail.com');

UPDATE public.user_roles SET role = 'school_admin' WHERE role = 'admin';

UPDATE public.profiles SET school_id = NULL
 WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'super_admin');

DELETE FROM public.user_roles ur
 WHERE ur.role = 'teacher'
   AND EXISTS (SELECT 1 FROM public.user_roles o WHERE o.user_id = ur.user_id AND o.role IN ('super_admin','school_admin'));

-- new-user trigger honours school + role from metadata --------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, mobile, school_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    NEW.email,
    NEW.raw_user_meta_data->>'mobile',
    NULLIF(NEW.raw_user_meta_data->>'school_id','')::uuid
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'teacher'))
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

-- policies ---------------------------------------------------------------
DROP POLICY IF EXISTS "schools read" ON public.schools;
CREATE POLICY "schools read" ON public.schools FOR SELECT TO authenticated
  USING (public.is_super_admin() OR id = public.current_school_id());
DROP POLICY IF EXISTS "schools insert" ON public.schools;
CREATE POLICY "schools insert" ON public.schools FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "schools update" ON public.schools;
CREATE POLICY "schools update" ON public.schools FOR UPDATE TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "schools delete" ON public.schools;
CREATE POLICY "schools delete" ON public.schools FOR DELETE TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_super_admin()
    OR (public.is_school_admin() AND school_id = public.current_school_id())
  );

DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR public.is_super_admin()
    OR (public.is_school_admin() AND school_id = public.current_school_id())
  )
  WITH CHECK (
    id = auth.uid()
    OR public.is_super_admin()
    OR (public.is_school_admin() AND school_id = public.current_school_id())
  );

DROP POLICY IF EXISTS "admin manage profiles" ON public.profiles;
CREATE POLICY "admin manage profiles" ON public.profiles FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (public.is_school_admin() AND school_id = public.current_school_id())
  );

DROP POLICY IF EXISTS "roles read" ON public.user_roles;
CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_super_admin()
    OR (
      public.is_school_admin()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = user_roles.user_id AND p.school_id = public.current_school_id()
      )
    )
  );

DROP POLICY IF EXISTS "classes read" ON public.classes;
CREATE POLICY "classes read" ON public.classes FOR SELECT TO authenticated
  USING (public.can_access_school(school_id) AND (teacher_id = auth.uid() OR public.is_admin()));
DROP POLICY IF EXISTS "classes insert" ON public.classes;
CREATE POLICY "classes insert" ON public.classes FOR INSERT TO authenticated
  WITH CHECK (public.can_access_school(school_id) AND (teacher_id = auth.uid() OR public.is_admin()));
DROP POLICY IF EXISTS "classes update" ON public.classes;
CREATE POLICY "classes update" ON public.classes FOR UPDATE TO authenticated
  USING (public.can_access_school(school_id) AND (teacher_id = auth.uid() OR public.is_admin()))
  WITH CHECK (public.can_access_school(school_id) AND (teacher_id = auth.uid() OR public.is_admin()));
DROP POLICY IF EXISTS "classes delete" ON public.classes;
CREATE POLICY "classes delete" ON public.classes FOR DELETE TO authenticated
  USING (public.can_access_school(school_id) AND (teacher_id = auth.uid() OR public.is_admin()));