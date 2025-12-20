-- Create enum for appointment status
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'rescheduled', 'cancelled', 'no_show', 'completed');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded');

-- Create clinics table
CREATE TABLE public.clinics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for clinic staff (doctors, receptionists)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'receptionist' CHECK (role IN ('doctor', 'receptionist', 'admin')),
  phone TEXT,
  specialty TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctors table for managing doctor schedules
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  specialty TEXT,
  consultation_fee DECIMAL(10,2) DEFAULT 0,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  dni TEXT,
  date_of_birth DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  confirmation_sent BOOLEAN DEFAULT false,
  prepayment_requested BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'yape' CHECK (payment_method IN ('yape', 'plin', 'cash', 'card', 'transfer')),
  status payment_status NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  reference_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctor schedules table
CREATE TABLE public.doctor_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reminder settings table
CREATE TABLE public.reminder_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  hours_before INTEGER NOT NULL DEFAULT 24,
  message_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

-- Create function to get user's clinic_id
CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- RLS Policies for clinics
CREATE POLICY "Users can view their own clinic"
  ON public.clinics FOR SELECT
  USING (id = public.get_user_clinic_id());

CREATE POLICY "Users can update their own clinic"
  ON public.clinics FOR UPDATE
  USING (id = public.get_user_clinic_id());

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their clinic"
  ON public.profiles FOR SELECT
  USING (clinic_id = public.get_user_clinic_id() OR user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for doctors
CREATE POLICY "Users can view doctors in their clinic"
  ON public.doctors FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

CREATE POLICY "Users can manage doctors in their clinic"
  ON public.doctors FOR ALL
  USING (clinic_id = public.get_user_clinic_id());

-- RLS Policies for patients
CREATE POLICY "Users can view patients in their clinic"
  ON public.patients FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

CREATE POLICY "Users can manage patients in their clinic"
  ON public.patients FOR ALL
  USING (clinic_id = public.get_user_clinic_id());

-- RLS Policies for appointments
CREATE POLICY "Users can view appointments in their clinic"
  ON public.appointments FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

CREATE POLICY "Users can manage appointments in their clinic"
  ON public.appointments FOR ALL
  USING (clinic_id = public.get_user_clinic_id());

-- RLS Policies for payments
CREATE POLICY "Users can view payments for appointments in their clinic"
  ON public.payments FOR SELECT
  USING (appointment_id IN (
    SELECT id FROM public.appointments WHERE clinic_id = public.get_user_clinic_id()
  ));

CREATE POLICY "Users can manage payments for appointments in their clinic"
  ON public.payments FOR ALL
  USING (appointment_id IN (
    SELECT id FROM public.appointments WHERE clinic_id = public.get_user_clinic_id()
  ));

-- RLS Policies for doctor_schedules
CREATE POLICY "Users can view schedules for doctors in their clinic"
  ON public.doctor_schedules FOR SELECT
  USING (doctor_id IN (
    SELECT id FROM public.doctors WHERE clinic_id = public.get_user_clinic_id()
  ));

CREATE POLICY "Users can manage schedules for doctors in their clinic"
  ON public.doctor_schedules FOR ALL
  USING (doctor_id IN (
    SELECT id FROM public.doctors WHERE clinic_id = public.get_user_clinic_id()
  ));

-- RLS Policies for reminder_settings
CREATE POLICY "Users can view reminder settings for their clinic"
  ON public.reminder_settings FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

CREATE POLICY "Users can manage reminder settings for their clinic"
  ON public.reminder_settings FOR ALL
  USING (clinic_id = public.get_user_clinic_id());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reminder_settings_updated_at BEFORE UPDATE ON public.reminder_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_clinic ON public.appointments(clinic_id);
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_patients_clinic ON public.patients(clinic_id);
CREATE INDEX idx_doctors_clinic ON public.doctors(clinic_id);