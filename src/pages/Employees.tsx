
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
  DialogClose,
} from "@/components/ui/dialog";
import { Search, Plus, MoreVertical, Eye, Edit, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [selectedEmployee, setSelectedEmployee] = useState<EnrichedEmployee | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

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

  const handleViewDetails = (employee: EnrichedEmployee) => {
    setSelectedEmployee(employee);
    setIsDetailsOpen(true);
  };

  const handleEditEmployee = (employee: EnrichedEmployee) => {
    setSelectedEmployee(employee);
    // In real implementation, would open an edit dialog
    toast({
      title: "Info",
      description: `Fitur edit untuk ${employee.first_name} sedang dikembangkan.`,
    });
  };

  const handleDeactivateEmployee = (employee: EnrichedEmployee) => {
    // In real implementation, would set employee status to inactive
    toast({
      title: "Info",
      description: `Fitur nonaktifkan untuk ${employee.first_name} sedang dikembangkan.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Data Karyawan</h1>
        <p className="text-muted-foreground">Kelola data karyawan perusahaan</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
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
            <Button className="flex items-center gap-2 whitespace-nowrap">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <CardContent className="p-0 overflow-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead className={isMobile ? "hidden" : ""}>NIK</TableHead>
                    <TableHead className={isMobile ? "hidden" : ""}>Jabatan</TableHead>
                    <TableHead className={isMobile ? "hidden" : ""}>Departemen</TableHead>
                    <TableHead className={isMobile ? "hidden" : ""}>Tgl Bergabung</TableHead>
                    <TableHead className={isMobile ? "hidden" : ""}>Gaji Pokok</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{`${employee.first_name} ${employee.last_name || ''}`.trim()}</TableCell>
                      <TableCell className={isMobile ? "hidden" : ""}>{employee.nik || '-'}</TableCell>
                      <TableCell className={isMobile ? "hidden" : ""}>{employee.position}</TableCell>
                      <TableCell className={isMobile ? "hidden" : ""}>{employee.department}</TableCell>
                      <TableCell className={isMobile ? "hidden" : ""}>{new Date(employee.hire_date).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell className={isMobile ? "hidden" : ""}>Rp {(employee?.basic_salary || 0).toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          Aktif
                        </Badge>
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
                            <DropdownMenuItem onClick={() => handleViewDetails(employee)} className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditEmployee(employee)} className="cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Data
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeactivateEmployee(employee)} 
                              className="text-destructive cursor-pointer"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Nonaktifkan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Detail Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detail Karyawan</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="grid gap-4 py-4">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4">Informasi Pribadi</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                      <p className="font-medium">
                        {`${selectedEmployee.first_name} ${selectedEmployee.last_name || ''}`.trim()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">NIK</p>
                      <p>{selectedEmployee.nik || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{selectedEmployee.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telepon</p>
                      <p>{selectedEmployee.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tanggal Lahir</p>
                      <p>{selectedEmployee.birth_date ? new Date(selectedEmployee.birth_date).toLocaleDateString('id-ID') : '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4">Informasi Pekerjaan</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Jabatan</p>
                      <p className="font-medium">{selectedEmployee.position}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Departemen</p>
                      <p>{selectedEmployee.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tanggal Bergabung</p>
                      <p>{new Date(selectedEmployee.hire_date).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gaji Pokok</p>
                      <p>Rp {(selectedEmployee?.basic_salary || 0).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className="bg-green-100 text-green-800">Aktif</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-lg font-semibold mb-2">Informasi Keuangan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">NPWP</p>
                    <p>{selectedEmployee.npwp || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status Pajak</p>
                    <p>{selectedEmployee.tax_status || 'TK/0'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bank</p>
                    <p>{selectedEmployee.bank_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nomor Rekening</p>
                    <p>{selectedEmployee.bank_account || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">BPJS Kesehatan</p>
                    <p>{selectedEmployee.bpjs_kesehatan || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">BPJS Ketenagakerjaan</p>
                    <p>{selectedEmployee.bpjs_ketenagakerjaan || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Tutup</Button>
            </DialogClose>
            <Button onClick={() => handleEditEmployee(selectedEmployee!)}>Edit Data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
