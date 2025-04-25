/* src/components/AddEmployeeDialog.tsx */
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// Define the employee type based on your database schema
interface Employee {
  id: string;
  first_name: string;
  last_name: string | null;
  hire_date: string;
  basic_salary: number;
}

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
  employee?: Employee; // Optional for edit mode
  isEditMode?: boolean; // Flag for edit mode
}

export default function AddEmployeeDialog({
  open,
  onOpenChange,
  onSuccess,
  employee,
  isEditMode = false,
}: AddEmployeeDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hireDate, setHireDate] = useState(""); // State for hire date
  const [basicSalary, setBasicSalary] = useState<number | "">(0); // State for basic salary
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Populate form fields if in edit mode
  useEffect(() => {
    if (isEditMode && employee) {
      setFirstName(employee.first_name);
      setLastName(employee.last_name || "");
      setHireDate(employee.hire_date.split("T")[0]); // Format date for input
      setBasicSalary(employee.basic_salary);
    } else {
      setFirstName("");
      setLastName("");
      setHireDate("");
      setBasicSalary(0);
    }
  }, [isEditMode, employee]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Validate inputs
      if (!firstName.trim()) {
        toast({
          title: "Error",
          description: "Nama depan harus diisi.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!hireDate) {
        toast({
          title: "Error",
          description: "Tanggal perekrutan harus diisi.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (basicSalary === "" || basicSalary < 0) {
        toast({
          title: "Error",
          description: "Gaji pokok harus diisi dan tidak boleh negatif.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (isEditMode && employee) {
        // Update existing employee
        const employeeData: TablesUpdate<"employees"> = {
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          hire_date: hireDate,
          basic_salary: Number(basicSalary),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("employees")
          .update(employeeData)
          .eq("id", employee.id);

        if (error) throw error;

        toast({
          title: "Sukses",
          description: "Karyawan berhasil diperbarui.",
          variant: "default",
        });
      } else {
        // Add new employee
        const employeeData: TablesInsert<"employees"> = {
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          hire_date: hireDate,
          basic_salary: Number(basicSalary),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("employees").insert([employeeData]);

        if (error) throw error;

        toast({
          title: "Sukses",
          description: "Karyawan berhasil ditambahkan.",
          variant: "default",
        });
      }

      // Reset form and close dialog
      setFirstName("");
      setLastName("");
      setHireDate("");
      setBasicSalary(0);
      onOpenChange(false);
      await onSuccess(); // Refresh employee list
    } catch (error: any) {
      console.error("Error handling employee:", error);
      toast({
        title: "Error",
        description: `Gagal ${isEditMode ? "memperbarui" : "menambahkan"} karyawan: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Karyawan" : "Tambah Karyawan"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Perbarui detail karyawan di sini." : "Masukkan detail karyawan baru di sini."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="first-name">Nama Depan</Label>
            <Input
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Masukkan nama depan"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last-name">Nama Belakang</Label>
            <Input
              id="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Masukkan nama belakang (opsional)"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hire-date">Tanggal Perekrutan</Label>
            <Input
              id="hire-date"
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="basic-salary">Gaji Pokok (Rp)</Label>
            <Input
              id="basic-salary"
              type="number"
              value={basicSalary}
              onChange={(e) => setBasicSalary(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Masukkan gaji pokok"
              min="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (isEditMode ? "Memperbarui..." : "Menambahkan...") : (isEditMode ? "Perbarui Karyawan" : "Tambah Karyawan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}