/* src/pages/Employees.tsx */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

// Define interface for enriched employee (not a database table)
interface EnrichedEmployee extends Tables<"employees"> {
  position: string;
  department: string;
}

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [employees, setEmployees] = useState<EnrichedEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('employees')
          .select(`
            *,
            positions (title, department_id, departments (name))
          `);
        if (error) throw error;

        const enrichedData: EnrichedEmployee[] = data.map(emp => ({
          ...emp,
          position: emp.positions?.title || 'Unknown',
          department: emp.positions?.departments?.name || 'Unknown',
        }));
        setEmployees(enrichedData);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data karyawan.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, [toast]);

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.nik || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Karyawan</h1>
        <p className="text-muted-foreground">Kelola data karyawan perusahaan</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari karyawan..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              <span>Tambah Karyawan</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Tambah Karyawan Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi karyawan baru di bawah ini
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    Nama Depan
                  </label>
                  <Input id="firstName" placeholder="Nama depan karyawan" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Nama Belakang
                  </label>
                  <Input id="lastName" placeholder="Nama belakang karyawan" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="nik" className="text-sm font-medium">
                    NIK
                  </label>
                  <Input id="nik" placeholder="Nomor Induk Karyawan" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="position" className="text-sm font-medium">
                    Jabatan
                  </label>
                  <Input id="position" placeholder="Jabatan karyawan" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="basicSalary" className="text-sm font-medium">
                    Gaji Pokok
                  </label>
                  <Input id="basicSalary" placeholder="10000000" type="number" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="hireDate" className="text-sm font-medium">
                    Tanggal Bergabung
                  </label>
                  <Input id="hireDate" type="date" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-md">Daftar Karyawan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Tgl Bergabung</TableHead>
                  <TableHead>Gaji Pokok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{`${employee.first_name} ${employee.last_name || ''}`.trim()}</TableCell>
                    <TableCell>{employee.nik || '-'}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{new Date(employee.hire_date).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>Rp {(employee.basic_salary || 0).toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Aktif
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Lihat Detail</DropdownMenuItem>
                          <DropdownMenuItem>Edit Data</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Nonaktifkan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}