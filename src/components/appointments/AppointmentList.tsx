import { Appointment, AppointmentStatus } from '@/types/database';
import { AppointmentCard } from './AppointmentCard';
import { Calendar } from 'lucide-react';

interface AppointmentListProps {
  appointments: Appointment[];
  onSendReminder: (id: string) => void;
  onRequestPayment: (id: string) => void;
  onReschedule: (id: string) => void;
  onCancel: (id: string) => void;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  loading?: boolean;
}

export function AppointmentList({
  appointments,
  onSendReminder,
  onRequestPayment,
  onReschedule,
  onCancel,
  onStatusChange,
  loading = false,
}: AppointmentListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="h-40 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">No hay citas</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No se encontraron citas para este período
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onSendReminder={onSendReminder}
          onRequestPayment={onRequestPayment}
          onReschedule={onReschedule}
          onCancel={onCancel}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
