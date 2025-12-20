import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Clinic, ReminderSettings } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Bell, MessageSquare, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [clinic, setClinic] = useState<Partial<Clinic>>({
    name: '',
    address: '',
    phone: '',
    email: '',
  });

  const [reminderSettings, setReminderSettings] = useState<Partial<ReminderSettings>>({
    hours_before: 24,
    message_template: 'Hola {nombre}, le recordamos su cita para el {fecha} a las {hora}. Por favor confirme su asistencia.',
    is_active: true,
  });

  useEffect(() => {
    if (profile?.clinic_id) {
      fetchClinic();
      fetchReminderSettings();
    }
  }, [profile?.clinic_id]);

  const fetchClinic = async () => {
    const { data } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', profile?.clinic_id)
      .single();
    
    if (data) setClinic(data as Clinic);
  };

  const fetchReminderSettings = async () => {
    const { data } = await supabase
      .from('reminder_settings')
      .select('*')
      .eq('clinic_id', profile?.clinic_id)
      .single();
    
    if (data) setReminderSettings(data as ReminderSettings);
  };

  const saveClinic = async () => {
    if (!profile?.clinic_id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clinics')
        .update({
          name: clinic.name,
          address: clinic.address,
          phone: clinic.phone,
          email: clinic.email,
        })
        .eq('id', profile.clinic_id);

      if (error) throw error;

      toast({
        title: 'Cambios guardados',
        description: 'La información de la clínica ha sido actualizada',
      });
    } catch (error) {
      console.error('Error saving clinic:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveReminderSettings = async () => {
    if (!profile?.clinic_id) return;
    
    setLoading(true);
    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('reminder_settings')
        .select('id')
        .eq('clinic_id', profile.clinic_id)
        .single();

      if (existing) {
        await supabase
          .from('reminder_settings')
          .update({
            hours_before: reminderSettings.hours_before,
            message_template: reminderSettings.message_template,
            is_active: reminderSettings.is_active,
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('reminder_settings')
          .insert({
            clinic_id: profile.clinic_id,
            hours_before: reminderSettings.hours_before,
            message_template: reminderSettings.message_template,
            is_active: reminderSettings.is_active,
          });
      }

      toast({
        title: 'Cambios guardados',
        description: 'La configuración de recordatorios ha sido actualizada',
      });
    } catch (error) {
      console.error('Error saving reminder settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="mt-1 text-muted-foreground">
          Administra la configuración de tu clínica
        </p>
      </div>

      <Tabs defaultValue="clinic" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="clinic" className="gap-2">
            <Building2 className="h-4 w-4" />
            Clínica
          </TabsTrigger>
          <TabsTrigger value="reminders" className="gap-2">
            <Bell className="h-4 w-4" />
            Recordatorios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clinic">
          <Card>
            <CardHeader>
              <CardTitle>Información de la clínica</CardTitle>
              <CardDescription>
                Datos básicos de tu clínica o consultorio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Nombre de la clínica</Label>
                  <Input
                    id="clinicName"
                    value={clinic.name || ''}
                    onChange={(e) => setClinic({ ...clinic, name: e.target.value })}
                    placeholder="Clínica San Martín"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicPhone">Teléfono</Label>
                  <Input
                    id="clinicPhone"
                    value={clinic.phone || ''}
                    onChange={(e) => setClinic({ ...clinic, phone: e.target.value })}
                    placeholder="01 234 5678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicAddress">Dirección</Label>
                <Input
                  id="clinicAddress"
                  value={clinic.address || ''}
                  onChange={(e) => setClinic({ ...clinic, address: e.target.value })}
                  placeholder="Av. Principal 123, Lima"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicEmail">Email</Label>
                <Input
                  id="clinicEmail"
                  type="email"
                  value={clinic.email || ''}
                  onChange={(e) => setClinic({ ...clinic, email: e.target.value })}
                  placeholder="contacto@clinica.com"
                />
              </div>

              <div className="pt-4">
                <Button onClick={saveClinic} disabled={loading} className="gap-2">
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recordatorios por WhatsApp
              </CardTitle>
              <CardDescription>
                Configura los mensajes automáticos para tus pacientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recordatorios activos</p>
                  <p className="text-sm text-muted-foreground">
                    Enviar recordatorios automáticos a pacientes
                  </p>
                </div>
                <Switch
                  checked={reminderSettings.is_active}
                  onCheckedChange={(checked) =>
                    setReminderSettings({ ...reminderSettings, is_active: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hoursBefore">Horas antes de la cita</Label>
                <Input
                  id="hoursBefore"
                  type="number"
                  min="1"
                  max="72"
                  value={reminderSettings.hours_before || 24}
                  onChange={(e) =>
                    setReminderSettings({
                      ...reminderSettings,
                      hours_before: parseInt(e.target.value),
                    })
                  }
                  className="max-w-[120px]"
                />
                <p className="text-sm text-muted-foreground">
                  El recordatorio se enviará estas horas antes de la cita
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="messageTemplate">Plantilla del mensaje</Label>
                <Textarea
                  id="messageTemplate"
                  value={reminderSettings.message_template || ''}
                  onChange={(e) =>
                    setReminderSettings({
                      ...reminderSettings,
                      message_template: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Escribe tu mensaje..."
                />
                <p className="text-sm text-muted-foreground">
                  Variables disponibles: {'{nombre}'}, {'{fecha}'}, {'{hora}'}, {'{doctor}'}
                </p>
              </div>

              <div className="pt-4">
                <Button onClick={saveReminderSettings} disabled={loading} className="gap-2">
                  <Save className="h-4 w-4" />
                  Guardar configuración
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
