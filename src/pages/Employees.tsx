/* src/pages/Employees.tsx */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Pencil, Trash2 } from "lucide-react";
import AddEmployeeDialog from "@/pages/AddEmployeeDialog"; // Correct import from /src/pages

// Define interface for joined employee data
interface EmployeeWithRelations extends Tables<"employees"> {
  departments: Tables<"departments"> | null;
  positions: Tables<"positions"> | null;
  payroll?: Tables<"payroll"> | null; // Latest payroll record
}

export default function Employees() {
  const [employees, setEmployees] = useState<EmployeeWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeWithRelations | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Silakan login untuk mengakses data karyawan.");
        setIsLoading(false);
        return;
      }
      fetchEmployees();
    };
    checkSession();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      // Fetch employees with department and position
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*, departments(name), positions(name)")
        .order("created_at", { ascending: false });

      if (employeesError) {
        console.error("Supabase query error (employees):", employeesError);
        throw new Error(`Failed to fetch employees: ${employeesError.message}`);
      }

      // Fetch the latest payroll for each employee
      const employeeIds = employeesData.map((emp: EmployeeWithRelations) => emp.id);
      const { data: payrollData, error: payrollError } = await supabase
        .from("payroll")
        .select("*")
        .in("employee_id", employeeIds)
        .order("period_end", { ascending: false });

      if (payrollError) {
        console.error("Supabase query error (payroll):", payrollError);
        throw new Error(`Failed to fetch payroll: ${payrollError.message}`);
      }

      // Combine employee data with latest payroll
      const employeesWithPayroll = employeesData.map((emp: EmployeeWithRelations) => {
        const latestPayroll = payrollData.find((pay: Tables<"payroll">) => pay.employee_id === emp.id);
        return { ...emp, payroll: latestPayroll || null };
      });

      setEmployees(employeesWithPayroll || []);
    } catch (error: any) {
      console.error("Error fetching employees:", error.message, error);
      toast.error(`Gagal memuat data karyawan: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (employee: EmployeeWithRelations) => {
    setEditingEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
      toast.success("Karyawan berhasil dihapus");
      await fetchEmployees();
    } catch (error: any) {
      console.error("Error deleting employee:", error);
      toast.error(`Gagal menghapus karyawan: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Karyawan</h1>
          <p className="text-muted-foreground">Kelola data karyawan dan penggajian</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
          <span>Tambah Karyawan</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Karyawan</CardTitle>
          <CardDescription>Data karyawan aktif</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <svg
                className="animate-spin h-8 w-8 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : employees.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Tanggal Lahir</TableHead>
                    <TableHead>Tanggal Mulai</TableHead>
                    <TableHead>Departemen</TableHead>
                    <TableHead>Posisi</TableHead>
                    <TableHead>BPJS</TableHead>
                    <TableHead>NPWP</TableHead>
                    <TableHead>Gaji Pokok</TableHead>
                    <TableHead>Insentif</TableHead>
                    <TableHead>Biaya Transportasi</TableHead>
                    <TableHead>Nama Bank</TableHead>
                    <TableHead>Nomor Rekening</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {`${employee.first_name} ${employee.last_name || ""}`}
                      </TableCell>
                      <TableCell>{employee.email || "N/A"}</TableCell>
                      <TableCell>{employee.phone || "N/A"}</TableCell>
                      <TableCell>
                        {employee.birth_date
                          ? new Date(employee.birth_date).toLocaleDateString("id-ID")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {employee.hire_date
                          ? new Date(employee.hire_date).toLocaleDateString("id-ID")
                          : "N/A"}
                      </TableCell>
                      <TableCell>{employee.departments?.name || "Unknown"}</TableCell>
                      <TableCell>{employee.positions?.name || "Unknown"}</TableCell>
                      <TableCell>{employee.id}-BPJS</TableCell> {/* Mock BPJS Account */}
                      <TableCell>{employee.id}-NPWP</TableCell> {/* Mock NPWP Account */}
                      <TableCell>
                        {employee.payroll?.basic_salary?.toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        }) || "N/A"}
                      </TableCell>
                      <TableCell>
                        {(employee.payroll?.allowances || 0).toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        })}
                      </TableCell>
                      <TableCell>
                        {(employee.payroll?.allowances || 0).toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        })}
                      </TableCell>
                      <TableCell>{employee.bank_name || "N/A"}</TableCell>
                      <TableCell>{employee.bank_account || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-md">
              <div className="flex flex-col items-center text-muted-foreground">
                <FileText size={40} />
                <p className="mt-2">Tidak ada data karyawan</p>
                <p className="text-sm">Tambahkan karyawan baru untuk memulai</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <AddEmployeeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchEmployees}
      />

      {/* Edit Employee Dialog */}
      {editingEmployee && (
        <AddEmployeeDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingEmployee(null);
          }}
          onSuccess={fetchEmployees}
          employee={editingEmployee}
          isEditMode
        />
      )}
    </div>
  );
}