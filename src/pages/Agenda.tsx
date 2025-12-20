import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { useAppointments } from '@/hooks/useAppointments';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { NewAppointmentDialog } from '@/components/appointments/NewAppointmentDialog';

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  
  const { 
    appointments, 
    loading,
    updateStatus,
    sendReminder,
    requestPayment,
    cancelAppointment,
    refetch,
  } = useAppointments(selectedDate);

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
  });

  const handleReschedule = (id: string) => {
    // TODO: Open reschedule dialog
    console.log('Reschedule:', id);
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona las citas de tus pacientes
          </p>
        </div>
        <Button onClick={() => setShowNewAppointment(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva cita
        </Button>
      </div>

      {/* Date navigation */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Date picker and navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={es}
                />
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="icon" onClick={handleNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="ghost" onClick={handleToday} className="ml-2">
              Hoy
            </Button>
          </div>

          {/* View toggle */}
          <Tabs value={view} onValueChange={(v) => setView(v as 'day' | 'week')}>
            <TabsList>
              <TabsTrigger value="day">Día</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Week view quick navigation */}
        {view === 'week' && (
          <div className="mt-4 grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex flex-col items-center rounded-lg p-2 transition-colors",
                    isSelected 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-accent",
                    isToday && !isSelected && "ring-2 ring-primary/50"
                  )}
                >
                  <span className="text-xs font-medium uppercase">
                    {format(day, 'EEE', { locale: es })}
                  </span>
                  <span className="text-lg font-bold">
                    {format(day, 'd')}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Appointments list */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {appointments.length} citas programadas
          </p>
        </div>

        <AppointmentList
          appointments={appointments}
          loading={loading}
          onSendReminder={sendReminder}
          onRequestPayment={requestPayment}
          onReschedule={handleReschedule}
          onCancel={cancelAppointment}
          onStatusChange={updateStatus}
        />
      </div>

      <NewAppointmentDialog
        open={showNewAppointment}
        onOpenChange={setShowNewAppointment}
        selectedDate={selectedDate}
        onSuccess={refetch}
      />
    </MainLayout>
  );
}
