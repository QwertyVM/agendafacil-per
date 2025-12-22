import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Calendar, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

const COLORS = {
  confirmed: 'hsl(142, 76%, 36%)',
  completed: 'hsl(142, 76%, 36%)',
  pending: 'hsl(45, 93%, 47%)',
  cancelled: 'hsl(0, 84%, 60%)',
  no_show: 'hsl(0, 84%, 40%)',
  rescheduled: 'hsl(220, 90%, 56%)',
};

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: es }),
      });
    }
    return options;
  }, []);

  const selectedDate = useMemo(() => parseISO(`${selectedMonth}-01`), [selectedMonth]);
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const { data: appointments = [] } = useQuery({
    queryKey: ['report-appointments', selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, payments(*)')
        .gte('appointment_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('appointment_date', format(monthEnd, 'yyyy-MM-dd'));
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'completed' || a.status === 'confirmed').length;
    const noShow = appointments.filter(a => a.status === 'no_show').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;
    
    const totalRevenue = appointments.reduce((sum, apt) => {
      const payments = apt.payments || [];
      return sum + payments
        .filter((p: any) => p.status === 'paid')
        .reduce((pSum: number, p: any) => pSum + Number(p.amount), 0);
    }, 0);

    const noShowRate = total > 0 ? (noShow / total) * 100 : 0;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, noShow, cancelled, totalRevenue, noShowRate, completionRate };
  }, [appointments]);

  // Data for appointments by day chart
  const appointmentsByDay = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayAppointments = appointments.filter(a => a.appointment_date === dateStr);
      return {
        date: format(day, 'd', { locale: es }),
        total: dayAppointments.length,
        confirmadas: dayAppointments.filter(a => a.status === 'confirmed' || a.status === 'completed').length,
        noShow: dayAppointments.filter(a => a.status === 'no_show').length,
      };
    });
  }, [appointments, monthStart, monthEnd]);

  // Data for status distribution pie chart
  const statusDistribution = useMemo(() => {
    const statusCount: Record<string, number> = {};
    appointments.forEach(apt => {
      statusCount[apt.status] = (statusCount[apt.status] || 0) + 1;
    });
    
    const statusLabels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No Show',
      rescheduled: 'Reprogramada',
    };

    return Object.entries(statusCount).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
      color: COLORS[status as keyof typeof COLORS] || 'hsl(220, 10%, 50%)',
    }));
  }, [appointments]);

  // Data for revenue by week
  const revenueByWeek = useMemo(() => {
    const weeks: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    appointments.forEach(apt => {
      const day = parseISO(apt.appointment_date).getDate();
      const week = Math.min(Math.ceil(day / 7), 5);
      const payments = apt.payments || [];
      const revenue = payments
        .filter((p: any) => p.status === 'paid')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      weeks[week] += revenue;
    });

    return Object.entries(weeks).map(([week, revenue]) => ({
      semana: `Sem ${week}`,
      ingresos: revenue,
    }));
  }, [appointments]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
            <p className="text-muted-foreground">Análisis mensual de citas e ingresos</p>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Citas
              </CardTitle>
              <Calendar className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpis.total}</div>
              <p className="text-sm text-muted-foreground">
                {kpis.completed} completadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos
              </CardTitle>
              <DollarSign className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">S/ {kpis.totalRevenue.toFixed(0)}</div>
              <p className="text-sm text-muted-foreground">
                Total cobrado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tasa de Asistencia
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpis.completionRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">
                Citas cumplidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tasa No-Show
              </CardTitle>
              <TrendingDown className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{kpis.noShowRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">
                {kpis.noShow} pacientes ausentes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Appointments by Day */}
          <Card>
            <CardHeader>
              <CardTitle>Citas por Día</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentsByDay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="confirmadas" name="Confirmadas" fill={COLORS.confirmed} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="noShow" name="No Show" fill={COLORS.no_show} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Week */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ingresos por Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueByWeek}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="semana" 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickFormatter={(value) => `S/${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`S/ ${value.toFixed(2)}`, 'Ingresos']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ingresos" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
