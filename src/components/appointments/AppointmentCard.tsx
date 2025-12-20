import { useState } from 'react';
import { 
  Clock, 
  User, 
  Phone, 
  MessageSquare, 
  CreditCard, 
  Calendar as CalendarIcon,
  X,
  MoreVertical
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '@/types/database';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface AppointmentCardProps {
  appointment: Appointment;
  onSendReminder: (id: string) => void;
  onRequestPayment: (id: string) => void;
  onReschedule: (id: string) => void;
  onCancel: (id: string) => void;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
}

export function AppointmentCard({
  appointment,
  onSendReminder,
  onRequestPayment,
  onReschedule,
  onCancel,
  onStatusChange,
}: AppointmentCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  const statusBorderClasses: Record<AppointmentStatus, string> = {
    pending: 'border-l-status-pending',
    confirmed: 'border-l-status-confirmed',
    rescheduled: 'border-l-status-rescheduled',
    cancelled: 'border-l-status-cancelled',
    no_show: 'border-l-status-noshow',
    completed: 'border-l-status-completed',
  };

  return (
    <div className={cn(
      "bg-card rounded-lg border border-border p-4 shadow-sm transition-all hover:shadow-md animate-fade-in",
      "border-l-4",
      statusBorderClasses[appointment.status]
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={appointment.status} size="sm" />
            {appointment.prepayment_requested && (
              <span className="inline-flex items-center gap-1 rounded-full bg-kpi-warning/10 px-2 py-0.5 text-xs font-medium text-kpi-warning">
                <CreditCard className="h-3 w-3" />
                Prepago
              </span>
            )}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-card-foreground truncate">
            {appointment.patient?.full_name || 'Paciente'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Dr. {appointment.doctor?.full_name || 'Médico'}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'confirmed')}>
              Marcar confirmada
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'completed')}>
              Marcar completada
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(appointment.id, 'no_show')}>
              Marcar no asistió
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onReschedule(appointment.id)}>
              Reprogramar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onCancel(appointment.id)}
              className="text-destructive"
            >
              Cancelar cita
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Time info */}
      <div className="mt-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="font-medium text-card-foreground">
            {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
          </span>
        </div>
        {appointment.patient?.phone && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{appointment.patient.phone}</span>
          </div>
        )}
      </div>

      {/* Reason */}
      {appointment.reason && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
          {appointment.reason}
        </p>
      )}

      {/* Quick actions */}
      {appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'no_show' && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction(() => onSendReminder(appointment.id))}
            disabled={isLoading || appointment.reminder_sent}
            className="gap-1.5"
          >
            <MessageSquare className="h-4 w-4" />
            {appointment.reminder_sent ? 'Enviado' : 'WhatsApp'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction(() => onRequestPayment(appointment.id))}
            disabled={isLoading || appointment.prepayment_requested}
            className="gap-1.5"
          >
            <CreditCard className="h-4 w-4" />
            {appointment.prepayment_requested ? 'Solicitado' : 'Yape/Plin'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReschedule(appointment.id)}
            disabled={isLoading}
            className="gap-1.5"
          >
            <CalendarIcon className="h-4 w-4" />
            Reprogramar
          </Button>
        </div>
      )}
    </div>
  );
}
