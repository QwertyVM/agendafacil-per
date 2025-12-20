import { AppointmentStatus } from '@/types/database';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md';
}

const statusLabels: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  rescheduled: 'Reprogramada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
  completed: 'Completada',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        `status-${status}`
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
