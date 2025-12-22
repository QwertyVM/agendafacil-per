-- Función que se ejecuta automáticamente al crear un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_clinic_id uuid;
BEGIN
  -- Crear la clínica primero
  INSERT INTO public.clinics (name)
  VALUES (NEW.raw_user_meta_data ->> 'clinic_name')
  RETURNING id INTO new_clinic_id;
  
  -- Crear el perfil del usuario
  INSERT INTO public.profiles (user_id, clinic_id, full_name, role)
  VALUES (
    NEW.id,
    new_clinic_id,
    NEW.raw_user_meta_data ->> 'full_name',
    'admin'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger que ejecuta la función cuando se crea un usuario en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();