import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { useDashboardKPIs, useAppointments } from '@/hooks/useAppointments';
import { Calendar, CheckCircle2, XCircle, Banknote, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard() {
  const { kpis, loading: kpisLoading } = useDashboardKPIs();
  const today = useMemo(() => new Date(), []);
  const {
    appointments, 
    loading: appointmentsLoading,
    updateStatus,
    sendReminder,
    requestPayment,
    cancelAppointment,
  } = useAppointments(today);

  const handleReschedule = (id: string) => {
    // Navigate to agenda with appointment selected
    window.location.href = `/agenda?reschedule=${id}`;
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-lg text-muted-foreground">
          {format(today, "EEEE, d 'de' MMMM", { locale: es })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <KPICard
          title="Citas de hoy"
          value={kpisLoading ? '-' : kpis.todayAppointments}
          subtitle={`${kpis.pendingAppointments} pendientes`}
          icon={Calendar}
          variant="info"
        />
        <KPICard
          title="Confirmadas"
          value={kpisLoading ? '-' : `${kpis.confirmedPercentage}%`}
          subtitle="De las citas de hoy"
          icon={CheckCircle2}
          variant="success"
        />
        <KPICard
          title="No-show mensual"
          value={kpisLoading ? '-' : `${kpis.monthlyNoShowRate}%`}
          subtitle="Tasa de inasistencia"
          icon={XCircle}
          variant={kpis.monthlyNoShowRate > 15 ? 'danger' : 'warning'}
        />
        <KPICard
          title="Ingresos del mes"
          value={kpisLoading ? '-' : `S/${kpis.recoveredMoney.toLocaleString()}`}
          subtitle="En consultas realizadas"
          icon={Banknote}
          variant="success"
        />
      </div>

      {/* Today's appointments */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">
              Citas de hoy
            </h2>
            <p className="text-sm text-muted-foreground">
              {appointments.length} citas programadas
            </p>
          </div>
          <a 
            href="/agenda" 
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver agenda completa →
          </a>
        </div>

        <AppointmentList
          appointments={appointments}
          loading={appointmentsLoading}
          onSendReminder={sendReminder}
          onRequestPayment={requestPayment}
          onReschedule={handleReschedule}
          onCancel={cancelAppointment}
          onStatusChange={updateStatus}
        />
      </div>
    </MainLayout>
  );
}
