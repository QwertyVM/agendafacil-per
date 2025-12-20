import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Doctor } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NewDoctorDialog } from '@/components/doctors/NewDoctorDialog';

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDoctor, setShowNewDoctor] = useState(false);
  const { toast } = useToast();

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setDoctors((data || []) as Doctor[]);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los médicos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este médico?')) return;

    try {
      const { error } = await supabase.from('doctors').delete().eq('id', id);
      if (error) throw error;
      
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      toast({
        title: 'Médico eliminado',
        description: 'El médico ha sido eliminado correctamente',
      });
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el médico',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setDoctors((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_active: !currentStatus } : d))
      );
    } catch (error) {
      console.error('Error updating doctor:', error);
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Médicos</h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona el equipo médico de tu clínica
          </p>
        </div>
        <Button onClick={() => setShowNewDoctor(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo médico
        </Button>
      </div>

      {/* Search */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o especialidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Doctors table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-base">Médico</TableHead>
              <TableHead className="text-base">Especialidad</TableHead>
              <TableHead className="text-base">Tarifa</TableHead>
              <TableHead className="text-base">Estado</TableHead>
              <TableHead className="text-right text-base">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredDoctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No se encontraron médicos
                </TableCell>
              </TableRow>
            ) : (
              filteredDoctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Stethoscope className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium text-base">Dr. {doctor.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-base">{doctor.specialty || 'General'}</TableCell>
                  <TableCell className="text-base font-medium">
                    S/{Number(doctor.consultation_fee).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={doctor.is_active ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => toggleActive(doctor.id, doctor.is_active)}
                    >
                      {doctor.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(doctor.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <NewDoctorDialog
        open={showNewDoctor}
        onOpenChange={setShowNewDoctor}
        onSuccess={fetchDoctors}
      />
    </MainLayout>
  );
}
