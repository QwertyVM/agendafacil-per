import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/types/database';
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
import { Plus, Search, Phone, Mail, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NewPatientDialog } from '@/components/patients/NewPatientDialog';

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);
  const { toast } = useToast();

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setPatients((data || []) as Patient[]);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pacientes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery) ||
      patient.dni?.includes(searchQuery)
  );

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este paciente?')) return;

    try {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw error;
      
      setPatients((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: 'Paciente eliminado',
        description: 'El paciente ha sido eliminado correctamente',
      });
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el paciente',
        variant: 'destructive',
      });
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona la información de tus pacientes
          </p>
        </div>
        <Button onClick={() => setShowNewPatient(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo paciente
        </Button>
      </div>

      {/* Search and filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o DNI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Patients table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-base">Nombre</TableHead>
              <TableHead className="text-base">Teléfono</TableHead>
              <TableHead className="text-base">DNI</TableHead>
              <TableHead className="text-base">Email</TableHead>
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
            ) : filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No se encontraron pacientes
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium text-base">
                    {patient.full_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-base">{patient.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-base">{patient.dni || '-'}</TableCell>
                  <TableCell>
                    {patient.email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-base">{patient.email}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(patient.id)}
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

      <NewPatientDialog
        open={showNewPatient}
        onOpenChange={setShowNewPatient}
        onSuccess={fetchPatients}
      />
    </MainLayout>
  );
}
