/* src/pages/Employees.tsx */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";

interface Employee extends Tables<"employees"> {
  payroll?: Tables<"payroll">[];
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    birth_date: "",
    hire_date: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*, payroll(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Gagal memuat data karyawan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (editingEmployee) {
        // Update existing employee
        const { error } = await supabase
          .from("employees")
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone,
            birth_date: formData.birth_date || null,
            hire_date: formData.hire_date,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingEmployee.id);

        if (error) throw error;
        toast.success("Karyawan berhasil diperbarui");
      } else {
        // Add new employee
        const { error } = await supabase.from("employees").insert({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          birth_date: formData.birth_date || null,
          hire_date: formData.hire_date,
        });

        if (error) throw error;
        toast.success("Karyawan berhasil ditambahkan");
      }
      await fetchEmployees();
      setOpenDialog(false);
      setEditingEmployee(null);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        birth_date: "",
        hire_date: "",
      });
    } catch (error) {
      console.error("Error saving employee:", error);
      toast.error("Gagal menyimpan data karyawan.");
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      birth_date: employee.birth_date
        ? new Date(employee.birth_date).toISOString().split("T")[0]
        : "",
      hire_date: employee.hire_date
        ? new Date(employee.hire_date).toISOString().split("T")[0]
        : "",
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
      toast.success("Karyawan berhasil dihapus");
      await fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Gagal menghapus karyawan.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Karyawan</h1>
        <p className="text-muted-foreground">
          Kelola data karyawan dan penggajian
        </p>
      </div>

      <div className="flex justify-end">
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              <span>Tambah Karyawan</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] z-50">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Edit Karyawan" : "Tambah Karyawan"}
              </DialogTitle>
              <DialogDescription>
                {editingEmployee
                  ? "Perbarui informasi karyawan di bawah ini."
                  : "Masukkan informasi karyawan baru di bawah ini."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">Nama Depan</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Nama Belakang</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="birth_date">Tanggal Lahir</Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hire_date">Tanggal Mulai Kerja</Label>
                <Input
                  id="hire_date"
                  name="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpenDialog(false);
                  setEditingEmployee(null);
                  setFormData({
                    first_name: "",
                    last_name: "",
                    email: "",
                    phone: "",
                    birth_date: "",
                    hire_date: "",
                  });
                }}
              >
                Batal
              </Button>
              <Button onClick={handleSubmit}>
                {editingEmployee ? "Perbarui" : "Tambah"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                    <TableHead>Tanggal Mulai</TableHead>
                    <TableHead>Total Penggajian</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </TableCell>
                      <TableCell>{employee.email || "N/A"}</TableCell>
                      <TableCell>{employee.phone || "N/A"}</TableCell>
                      <TableCell>
                        {new Date(employee.hire_date).toLocaleDateString(
                          "id-ID"
                        )}
                      </TableCell>
                      <TableCell>
                        Rp{" "}
                        {employee.payroll
                          ?.reduce(
                            (sum, p) => sum + (p.net_salary || 0),
                            0
                          )
                          .toLocaleString("id-ID") || 0}
                      </TableCell>
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
                <p className="text-sm">
                  Tambahkan karyawan baru untuk memulai
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}