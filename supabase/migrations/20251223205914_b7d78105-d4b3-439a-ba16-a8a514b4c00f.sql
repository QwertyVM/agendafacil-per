-- Prevent direct clinic inserts (only via trigger)
CREATE POLICY "Prevent direct clinic inserts"
  ON public.clinics FOR INSERT
  WITH CHECK (false);

-- Prevent clinic deletions
CREATE POLICY "Prevent clinic deletions"
  ON public.clinics FOR DELETE
  USING (false);

-- Prevent direct profile inserts (only via trigger)
CREATE POLICY "Prevent direct profile inserts"
  ON public.profiles FOR INSERT
  WITH CHECK (false);

-- Prevent profile deletions
CREATE POLICY "Prevent profile deletions" 
  ON public.profiles FOR DELETE
  USING (false);