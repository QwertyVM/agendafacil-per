export type AppointmentStatus = 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'no_show' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type PaymentMethod = 'yape' | 'plin' | 'cash' | 'card' | 'transfer';
export type UserRole = 'doctor' | 'receptionist' | 'admin';

export interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  clinic_id: string | null;
  full_name: string;
  role: UserRole;
  phone: string | null;
  specialty: string | null;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  clinic_id: string;
  profile_id: string | null;
  full_name: string;
  specialty: string | null;
  consultation_fee: number;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  clinic_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  dni: string | null;
  date_of_birth: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  doctor_id: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  reminder_sent: boolean;
  confirmation_sent: boolean;
  prepayment_requested: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  doctor?: Doctor;
  patient?: Patient;
  payment?: Payment;
}

export interface Payment {
  id: string;
  appointment_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  payment_date: string | null;
  reference_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface ReminderSettings {
  id: string;
  clinic_id: string;
  hours_before: number;
  message_template: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Dashboard KPIs
export interface DashboardKPIs {
  todayAppointments: number;
  confirmedPercentage: number;
  monthlyNoShowRate: number;
  recoveredMoney: number;
  pendingAppointments: number;
  upcomingAppointments: Appointment[];
}
