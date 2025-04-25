/* src/pages/AddEmployeeDialog.tsx */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  employee?: Tables<"employees"> | null;
  isEditMode?: boolean;
}

export default function AddEmployeeDialog({
  open,
  onOpenChange,
  onSuccess,
  employee,
  isEditMode = false,
}: AddEmployeeDialogProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    birth_date: "",
    hire_date: "",
    department_id: "",
    position_id: "",
    bank_name: "",
    bank_account: "",
    bpjs_account: "",
    npwp_account: "",
    incentive: "",
    transportation_fee: "",
  });
  const [departments, setDepartments] = useState<Tables<"departments">[]>([]);
  const [positions, setPositions] = useState<Tables<"positions">[]>([]);

  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchPositions();
      if (isEditMode && employee) {
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
          department_id: employee.department_id || "",
          position_id: employee.position_id || "",
          bank_name: employee.bank_name || "",
          bank_account: employee.bank_account || "",
          bpjs_account: employee.bpjs_account || "",
          npwp_account: employee.npwp_account || "",
          incentive: employee.incentive?.toString() || "",
          transportation_fee: employee.transportation_fee?.toString() || "",
        });
      }
    }
  }, [open, isEditMode, employee]);

  const fetchDepartments = async () => {
    const { data, error } = await supabase.from("departments").select("*");
    if (error) {
      toast.error(`Gagal mengambil data departemen: ${error.message}`);
      return;
    }
    setDepartments(data || []);
  };

  const fetchPositions = async () => {
    const { data, error } = await supabase.from("positions").select("*");
    if (error) {
      toast.error(`Gagal mengambil data posisi: ${error.message}`);
      return;
    }
    setPositions(data || []);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (isEditMode && employee) {
        // Update existing employee
        const { error } = await supabase
          .from("employees")
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name || null,
            email: formData.email || null,
            phone: formData.phone || null,
            birth_date: formData.birth_date || null,
            hire_date: formData.hire_date,
            department_id: formData.department_id || null,
            position_id: formData.position_id || null,
            bank_name: formData.bank_name || null,
            bank_account: formData.bank_account || null,
            bpjs_account: formData.bpjs_account || null,
            npwp_account: formData.npwp_account || null,
            incentive: formData.incentive ? parseFloat(formData.incentive) : null,
            transportation_fee: formData.transportation_fee ? parseFloat(formData.transportation_fee) : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", employee.id);

        if (error) throw error;
        toast.success("Karyawan berhasil diperbarui");
      } else {
        // Add new employee
        const { error } = await supabase.from("employees").insert({
          first_name: formData.first_name,
          last_name: formData.last_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          birth_date: formData.birth_date || null,
          hire_date: formData.hire_date,
          department_id: formData.department_id || null,
          position_id: formData.position_id || null,
          bank_name: formData.bank_name || null,
          bank_account: formData.bank_account || null,
          bpjs_account: formData.bpjs_account || null,
          npwp_account: formData.npwp_account || null,
          incentive: formData.incentive ? parseFloat(formData.incentive) : null,
          transportation_fee: formData.transportation_fee ? parseFloat(formData.transportation_fee) : null,
        });

        if (error) throw error;
        toast.success("Karyawan berhasil ditambahkan");
      }
      onSuccess();
      onOpenChange(false);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        birth_date: "",
        hire_date: "",
        department_id: "",
        position_id: "",
        bank_name: "",
        bank_account: "",
        bpjs_account: "",
        npwp_account: "",
        incentive: "",
        transportation_fee: "",
      });
    } catch (error: any) {
      toast.error(`Gagal menyimpan karyawan: ${error.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Karyawan" : "Tambah Karyawan"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Nama Depan</Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Nama Belakang</Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birth_date">Tanggal Lahir</Label>
              <Input
                id="birth_date"
                name="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="hire_date">Tanggal Masuk</Label>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department_id">Departemen</Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => handleSelectChange("department_id", value)}
              >
                <SelectTrigger id="department_id">
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="position_id">Posisi</Label>
              <Select
                value={formData.position_id}
                onValueChange={(value) => handleSelectChange("position_id", value)}
              >
                <SelectTrigger id="position_id">
                  <SelectValue placeholder="Pilih posisi" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_name">Nama Bank</Label>
              <Input
                id="bank_name"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="bank_account">Nomor Rekening</Label>
              <Input
                id="bank_account"
                name="bank_account"
                value={formData.bank_account}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bpjs_account">BPJS Account</Label>
              <Input
                id="bpjs_account"
                name="bpjs_account"
                value={formData.bpjs_account}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="npwp_account">NPWP Account</Label>
              <Input
                id="npwp_account"
                name="npwp_account"
                value={formData.npwp_account}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="incentive">Insentif (Rp)</Label>
              <Input
                id="incentive"
                name="incentive"
                type="number"
                value={formData.incentive}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="transportation_fee">Biaya Transportasi (Rp)</Label>
              <Input
                id="transportation_fee"
                name="transportation_fee"
                type="number"
                value={formData.transportation_fee}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit}>{isEditMode ? "Perbarui" : "Simpan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}