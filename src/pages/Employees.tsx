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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, MoreVertical, Eye, Edit, XCircle, Save, User, Briefcase, Wallet, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { Label } from "@/components/ui/label";

// Define interface for enriched employee (not a database table)
interface EnrichedEmployee extends Tables<"employees"> {
  position: string;
  department: string;
  basic_salary?: number;
  transportation_allowance?: number;
  allowances?: number;
  incentives?: number;
  tax_deduction?: number;
  bpjs_deduction?: number;
  net_salary?: number;
}

interface EmployeePayrollDetails {
  basic_salary: number;
  transportation_allowance: number;
  allowances: number;
  incentives: number;
  tax_deduction: number;
  bpjs_deduction: number;
  net_salary: number;
}

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  title: string;
  department_id: string;
  salary_base: number;
}

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [employees, setEmployees] = useState<EnrichedEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<EnrichedEmployee | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        // Fetch departments
        const { data: departmentsData, error: departmentsError } = await supabase
          .from('departments')
          .select('*');
        
        if (departmentsError) throw departmentsError;
        setDepartments(departmentsData);
        
        // Fetch positions
        const { data: positionsData, error: positionsError } = await supabase
          .from('positions')
          .select('*');
        
        if (positionsError) throw positionsError;
        setPositions(positionsData);

        // Fetch employees with their positions and departments
        const { data, error } = await supabase
          .from('employees')
          .select(`
            *,
            positions (id, title, department_id, salary_base, departments (id, name))
          `);
        if (error) throw error;

        // Fetch payroll data for each employee
        const enrichedData: EnrichedEmployee[] = await Promise.all(data.map(async (emp) => {
          // Get the latest payroll for this employee
          const { data: payrollData, error: payrollError } = await supabase
            .from('payroll')
            .select('*')
            .eq('employee_id', emp.id)
            .order('period_start', { ascending: false })
            .limit(1);
          
          if (payrollError) {
            console.error('Error fetching payroll data:', payrollError);
          }

          const payroll = payrollData && payrollData.length > 0 ? payrollData[0] : null;
          
          return {
            ...emp,
            position: emp.positions?.title || 'Unknown',
            department: emp.positions?.departments?.name || 'Unknown',
            basic_salary: payroll?.basic_salary || emp.positions?.salary_base || 0,
            transportation_allowance: (payroll?.allowances || 0) * 0.3,
            allowances: payroll?.allowances || 0,
            incentives: (payroll?.allowances || 0) * 0.2,
            tax_deduction: payroll?.pph21 || 0,
            bpjs_deduction: (payroll?.bpjs_kes_employee || 0) + (payroll?.bpjs_tk_jht_employee || 0) + (payroll?.bpjs_tk_jp_employee || 0),
            net_salary: payroll?.net_salary || 0
          };
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
    setIsEditMode(false);
  };

  const handleEditEmployee = (employee: EnrichedEmployee) => {
    setSelectedEmployee(employee);
    setIsEditMode(true);
    setIsDetailsOpen(true);

    // Filter positions based on department
    if (departments.length && positions.length) {
      const departmentId = positions.find(pos => pos.title === employee.position)?.department_id || '';
      filterPositionsByDepartment(departmentId);
    }
  };

  const handleDeactivateEmployee = (employee: EnrichedEmployee) => {
    // In real implementation, would set employee status to inactive
    toast({
      title: "Info",
      description: `Fitur nonaktifkan untuk ${employee.first_name} sedang dikembangkan.`,
    });
  };

  const handleDepartmentChange = (departmentId: string) => {
    filterPositionsByDepartment(departmentId);
  };

  const filterPositionsByDepartment = (departmentId: string) => {
    const filtered = positions.filter(pos => pos.department_id === departmentId);
    setFilteredPositions(filtered);
  };

  const handleSaveEmployee = async () => {
    if (!selectedEmployee) return;
    
    try {
      // Update employee data
      const { error } = await supabase
        .from('employees')
        .update({
          first_name: selectedEmployee.first_name,
          last_name: selectedEmployee.last_name,
          email: selectedEmployee.email,
          phone: selectedEmployee.phone,
          nik: selectedEmployee.nik,
          position_id: selectedEmployee.position_id,
          birth_date: selectedEmployee.birth_date,
          hire_date: selectedEmployee.hire_date,
          tax_status: selectedEmployee.tax_status,
          npwp: selectedEmployee.npwp,
          bpjs_kesehatan: selectedEmployee.bpjs_kesehatan,
          bpjs_ketenagakerjaan: selectedEmployee.bpjs_ketenagakerjaan,
          bank_name: selectedEmployee.bank_name,
          bank_account: selectedEmployee.bank_account
        })
        .eq('id', selectedEmployee.id);

      if (error) throw error;

      // Check if we need to update or create a new payroll entry
      const { data: existingPayroll } = await supabase
        .from('payroll')
        .select('*')
        .eq('employee_id', selectedEmployee.id)
        .order('period_start', { ascending: false })
        .limit(1);

      // Calculate new values
      const basicSalary = selectedEmployee.basic_salary || 0;
      const allowances = selectedEmployee.allowances || 0;
      const pph21 = selectedEmployee.tax_deduction || 0;
      const bpjs_kes_employee = (selectedEmployee.bpjs_deduction || 0) * 0.2; // Simplified calculation
      const bpjs_tk_jht_employee = (selectedEmployee.bpjs_deduction || 0) * 0.4; // Simplified calculation
      const bpjs_tk_jp_employee = (selectedEmployee.bpjs_deduction || 0) * 0.4; // Simplified calculation
      const netSalary = basicSalary + allowances - pph21 - (bpjs_kes_employee + bpjs_tk_jht_employee + bpjs_tk_jp_employee);

      // Get current date for period
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      if (existingPayroll && existingPayroll.length > 0) {
        // Update existing payroll
        await supabase
          .from('payroll')
          .update({
            basic_salary: basicSalary,
            allowances: allowances,
            pph21: pph21,
            bpjs_kes_employee: bpjs_kes_employee,
            bpjs_tk_jht_employee: bpjs_tk_jht_employee,
            bpjs_tk_jp_employee: bpjs_tk_jp_employee,
            net_salary: netSalary
          })
          .eq('id', existingPayroll[0].id);
      } else {
        // Create new payroll entry
        await supabase
          .from('payroll')
          .insert({
            employee_id: selectedEmployee.id,
            period_start: firstDayOfMonth.toISOString(),
            period_end: lastDayOfMonth.toISOString(),
            basic_salary: basicSalary,
            allowances: allowances,
            pph21: pph21,
            bpjs_kes_employee: bpjs_kes_employee,
            bpjs_tk_jht_employee: bpjs_tk_jht_employee,
            bpjs_tk_jp_employee: bpjs_tk_jp_employee,
            net_salary: netSalary
          });
      }

      // Refresh employee data
      const { data: updatedEmployeeData, error: refreshError } = await supabase
        .from('employees')
        .select(`
          *,
          positions (title, department_id, departments (name))
        `)
        .eq('id', selectedEmployee.id)
        .single();

      if (refreshError) throw refreshError;

      // Update employees list
      setEmployees(prev => 
        prev.map(emp => 
          emp.id === selectedEmployee.id 
            ? { 
                ...updatedEmployeeData,
                position: updatedEmployeeData.positions?.title || 'Unknown',
                department: updatedEmployeeData.positions?.departments?.name || 'Unknown',
                basic_salary: basicSalary,
                transportation_allowance: allowances * 0.3,
                allowances: allowances,
                incentives: allowances * 0.2,
                tax_deduction: pph21,
                bpjs_deduction: bpjs_kes_employee + bpjs_tk_jht_employee + bpjs_tk_jp_employee,
                net_salary: netSalary
              } 
            : emp
        )
      );

      toast({
        title: "Sukses",
        description: "Data karyawan berhasil diperbarui.",
      });

      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui data karyawan.",
        variant: "destructive",
      });
    }
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
                      <TableCell className={isMobile ? "hidden" : ""}>Rp {(employee.basic_salary || 0).toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <Badge variant="success">
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
        <DialogContent className="sm:max-w-[700px] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Data Karyawan" : "Detail Karyawan"}</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 pr-2">
              {/* Personal Information Section */}
              <div className="bg-white rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informasi Pribadi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nama Depan</Label>
                    <Input 
                      id="firstName" 
                      value={selectedEmployee.first_name} 
                      onChange={e => setSelectedEmployee({...selectedEmployee, first_name: e.target.value})}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nama Belakang</Label>
                    <Input 
                      id="lastName" 
                      value={selectedEmployee.last_name || ''} 
                      onChange={e => setSelectedEmployee({...selectedEmployee, last_name: e.target.value})}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nik">NIK</Label>
                    <Input 
                      id="nik" 
                      value={selectedEmployee.nik || ''} 
                      onChange={e => setSelectedEmployee({...selectedEmployee, nik: e.target.value})}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={selectedEmployee.email || ''} 
                      onChange={e => setSelectedEmployee({...selectedEmployee, email: e.target.value})}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">No. Telepon</Label>
                    <Input 
                      id="phone" 
                      value={selectedEmployee.phone || ''} 
                      onChange={e => setSelectedEmployee({...selectedEmployee, phone: e.target.value})}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Tanggal Lahir</Label>
                    <Input 
                      id="birthDate" 
                      type="date"
                      value={selectedEmployee.birth_date || ''} 
                      onChange={e => setSelectedEmployee({...selectedEmployee, birth_date: e.target.value})}
                      disabled={!isEditMode}
                    />
                  </div>
                </div>
              </div>

              {/* Job Information Section */}
              <div className="bg-white rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Informasi Pekerjaan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {isEditMode ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="department">Departemen</Label>
                        <Select 
                          onValueChange={(value) => handleDepartmentChange(value)}
                          defaultValue={positions.find(pos => pos.title === selectedEmployee.position)?.department_id}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih departemen" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map(dept => (
                              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">Jabatan</Label>
                        <Select 
                          onValueChange={(value) => {
                            const position = positions.find(pos => pos.id === value);
                            setSelectedEmployee({
                              ...selectedEmployee, 
                              position_id: value,
                              position: position?.title || '',
                              basic_salary: position?.salary_base || 0
                            });
                          }}
                          defaultValue={selectedEmployee.position_id}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jabatan" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredPositions.length > 0 
                              ? filteredPositions.map(pos => (
                                  <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                                ))
                              : positions.map(pos => (
                                  <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Departemen</p>
                        <p className="font-medium">{selectedEmployee.department}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Jabatan</p>
                        <p className="font-medium">{selectedEmployee.position}</p>
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Tanggal Bergabung</Label>
                    <Input 
                      id="hireDate" 
                      type="date"
                      value={selectedEmployee.hire_date} 
                      onChange={e => setSelectedEmployee({...selectedEmployee, hire_date: e.target.value})}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="success">Aktif</Badge>
                  </div>
                </div>
              </div>

              {/* Financial Information Section */}
              <div className="bg-white rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Informasi Keuangan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basicSalary">Gaji Pokok</Label>
                    <Input 
                      id="basicSalary" 
                      type="number"
                      value={selectedEmployee.basic_salary || 0}
                      onChange={e => setSelectedEmployee({...selectedEmployee, basic_salary: parseFloat(e.target.value)})}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transportAllowance">Tunjangan Transportasi</Label>
                    <Input 
                      id="transportAllowance" 
                      type="number"
                      value={selectedEmployee.transportation_allowance || 0}
                      onChange={e => {
                        const value = parseFloat(e.target.value);
                        const newAllowances = (selectedEmployee.allowances || 0) - (selectedEmployee.transportation_allowance || 0) + value;
                        setSelectedEmployee({
                          ...selectedEmployee, 
                          transportation_allowance: value,
                          allowances: newAllowances
                        });
                      }}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allowances">Total Tunjangan</Label>
                    <Input 
                      id="allowances" 
                      type="number"
                      value={selectedEmployee.allowances || 0}
                      onChange={e => setSelectedEmployee({...selectedEmployee, allowances: parseFloat(e.target.value)})}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incentives">Insentif</Label>
                    <Input 
                      id="incentives" 
                      type="number"
                      value={selectedEmployee.incentives || 0}
                      onChange={e => {
                        const value = parseFloat(e.target.value);
                        const newAllowances = (selectedEmployee.allowances || 0) - (selectedEmployee.incentives || 0) + value;
                        setSelectedEmployee({
                          ...selectedEmployee, 
                          incentives: value,
                          allowances: newAllowances
                        });
                      }}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="npwp">NPWP</Label>
                    <Input 
                      id="npwp" 
                      value={selectedEmployee.npwp || ''}
                      onChange={e => setSelectedEmployee({...selectedEmployee, npwp: e.target.value})}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxStatus">Status Pajak</Label>
                    <Select 
                      onValueChange={(value) => setSelectedEmployee({...selectedEmployee, tax_status: value})}
                      defaultValue={selectedEmployee.tax_status || 'TK/0'}
                      disabled={!isEditMode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status pajak" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TK/0">TK/0</SelectItem>
                        <SelectItem value="K/0">K/0</SelectItem>
                        <SelectItem value="K/1">K/1</SelectItem>
                        <SelectItem value="K/2">K/2</SelectItem>
                        <SelectItem value="K/3">K/3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxDeduction">Potongan Pajak</Label>
                    <Input 
                      id="taxDeduction" 
                      type="number"
                      value={selectedEmployee.tax_deduction || 0}
                      onChange={e => setSelectedEmployee({...selectedEmployee, tax_deduction: parseFloat(e.target.value)})}
                      disabled={!isEditMode}
                    />
                  </div>
                </div>
              </div>

              {/* Bank Information Section */}
              <div className="bg-white rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Informasi Bank
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Nama Bank</Label>
                    <Input 
                      id="bankName" 
                      value={selectedEmployee.bank_name || ''}
                      onChange={e => setSelectedEmployee({...selectedEmployee, bank_name: e.target.value})}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccount">Nomor Rekening</Label>
                    <Input 
                      id="bankAccount" 
                      value={selectedEmployee.bank_account || ''}
                      onChange={e => setSelectedEmployee({...selectedEmployee, bank_account: e.target.value})}
                      disabled={!isEditMode}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline">
                {isEditMode ? "Batal" : "Tutup"}
              </Button>
            </DialogClose>
            {isEditMode ? (
              <Button onClick={handleSaveEmployee} className="flex items-center gap-2">
                <Save size={16} />
                <span>Simpan Perubahan</span>
              </Button>
            ) : (
              <Button onClick={() => setIsEditMode(true)}>Edit Data</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
