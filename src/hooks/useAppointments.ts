import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, AppointmentStatus, DashboardKPIs } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export function useAppointments(selectedDate: Date) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Avoid refetch loops when a new Date() instance is passed on each render
  const dateStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  // Protect against StrictMode double-effects / race conditions
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1; // invalidate any in-flight request
    };
  }, []);

  const fetchAppointments = useCallback(async () => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    try {
      if (isMountedRef.current) setLoading(true);

      // Ensure auth session exists before querying protected tables
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // No session yet (e.g. right after login redirect) → don't toast an error
        if (requestId === requestIdRef.current && isMountedRef.current) {
          setAppointments([]);
        }
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(
          `
          *,
          doctor:doctors(*),
          patient:patients(*)
        `
        )
        .eq('appointment_date', dateStr)
        .order('start_time', { ascending: true });

      if (error) throw error;

      if (requestId === requestIdRef.current && isMountedRef.current) {
        setAppointments((data || []) as unknown as Appointment[]);
      }
    } catch (error) {
      // Ignore errors from stale/aborted requests
      if (requestId !== requestIdRef.current || !isMountedRef.current) return;

      console.error('Error fetching appointments:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las citas',
        variant: 'destructive',
      });
    } finally {
      if (requestId === requestIdRef.current && isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [dateStr, toast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      setAppointments(prev => 
        prev.map(apt => apt.id === id ? { ...apt, status } : apt)
      );
      
      toast({
        title: 'Estado actualizado',
        description: 'El estado de la cita ha sido actualizado',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };

  const sendReminder = async (id: string) => {
    try {
      const appointment = appointments.find(a => a.id === id);
      if (!appointment?.patient?.phone) {
        toast({
          title: 'Error',
          description: 'El paciente no tiene número de teléfono',
          variant: 'destructive',
        });
        return;
      }

      // Open WhatsApp with pre-filled message
      const message = encodeURIComponent(
        `Hola ${appointment.patient.full_name}, le recordamos su cita médica para el ${format(new Date(appointment.appointment_date), 'dd/MM/yyyy')} a las ${appointment.start_time.slice(0, 5)}. Por favor confirme su asistencia respondiendo este mensaje.`
      );
      const phone = appointment.patient.phone.replace(/\D/g, '');
      window.open(`https://wa.me/51${phone}?text=${message}`, '_blank');

      // Mark as reminder sent
      const { error } = await supabase
        .from('appointments')
        .update({ reminder_sent: true })
        .eq('id', id);

      if (error) throw error;

      setAppointments(prev =>
        prev.map(apt => apt.id === id ? { ...apt, reminder_sent: true } : apt)
      );

      toast({
        title: 'Recordatorio',
        description: 'Se abrió WhatsApp para enviar el recordatorio',
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  };

  const requestPayment = async (id: string) => {
    try {
      const appointment = appointments.find(a => a.id === id);
      if (!appointment?.patient?.phone) {
        toast({
          title: 'Error',
          description: 'El paciente no tiene número de teléfono',
          variant: 'destructive',
        });
        return;
      }

      const fee = appointment.doctor?.consultation_fee || 50;
      const message = encodeURIComponent(
        `Hola ${appointment.patient.full_name}, para confirmar su cita del ${format(new Date(appointment.appointment_date), 'dd/MM/yyyy')}, por favor realice un prepago de S/${fee} vía Yape o Plin. Esto nos ayuda a reservar su horario. ¡Gracias!`
      );
      const phone = appointment.patient.phone.replace(/\D/g, '');
      window.open(`https://wa.me/51${phone}?text=${message}`, '_blank');

      const { error } = await supabase
        .from('appointments')
        .update({ prepayment_requested: true })
        .eq('id', id);

      if (error) throw error;

      setAppointments(prev =>
        prev.map(apt => apt.id === id ? { ...apt, prepayment_requested: true } : apt)
      );

      toast({
        title: 'Solicitud de prepago',
        description: 'Se abrió WhatsApp para solicitar el prepago',
      });
    } catch (error) {
      console.error('Error requesting payment:', error);
    }
  };

  const cancelAppointment = async (id: string) => {
    await updateStatus(id, 'cancelled');
  };

  return {
    appointments,
    loading,
    updateStatus,
    sendReminder,
    requestPayment,
    cancelAppointment,
    refetch: fetchAppointments,
  };
}

export function useDashboardKPIs() {
  const [kpis, setKPIs] = useState<DashboardKPIs>({
    todayAppointments: 0,
    confirmedPercentage: 0,
    monthlyNoShowRate: 0,
    recoveredMoney: 0,
    pendingAppointments: 0,
    upcomingAppointments: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

        // Get today's appointments
        const { data: todayData } = await supabase
          .from('appointments')
          .select(`
            *,
            doctor:doctors(*),
            patient:patients(*)
          `)
          .eq('appointment_date', todayStr);

        const todayAppointments = todayData || [];
        const confirmedCount = todayAppointments.filter(
          a => a.status === 'confirmed' || a.status === 'completed'
        ).length;
        const pendingCount = todayAppointments.filter(a => a.status === 'pending').length;

        // Get monthly stats
        const { data: monthlyData } = await supabase
          .from('appointments')
          .select('status, doctor:doctors(consultation_fee)')
          .gte('appointment_date', monthStart)
          .lte('appointment_date', monthEnd);

        const monthlyAppointments = monthlyData || [];
        const noShowCount = monthlyAppointments.filter(a => a.status === 'no_show').length;
        const completedWithPrepay = monthlyAppointments.filter(
          a => a.status !== 'no_show' && a.status !== 'cancelled'
        );
        
        const recoveredMoney = completedWithPrepay.reduce((acc, apt) => {
          const fee = (apt.doctor as any)?.consultation_fee || 50;
          return acc + Number(fee);
        }, 0);

        setKPIs({
          todayAppointments: todayAppointments.length,
          confirmedPercentage: todayAppointments.length > 0 
            ? Math.round((confirmedCount / todayAppointments.length) * 100) 
            : 0,
          monthlyNoShowRate: monthlyAppointments.length > 0 
            ? Math.round((noShowCount / monthlyAppointments.length) * 100) 
            : 0,
          recoveredMoney,
          pendingAppointments: pendingCount,
          upcomingAppointments: (todayAppointments as unknown as Appointment[])
            .filter(a => a.status !== 'cancelled' && a.status !== 'completed')
            .slice(0, 5),
        });
      } catch (error) {
        console.error('Error fetching KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  return { kpis, loading };
}
