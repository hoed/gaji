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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// Define the employee type based on the database schema
interface Employee {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  hire_date: string;
  bank_name: string | null;
  bank_account: string | null;
  position_id: string | null;
  bpjs_account: string | null;
  npwp_account: string | null;
  incentive: number | null;
  transportation_fee: number | null;
  basic_salary: number;
}

// Define the position type for the dropdown
interface Position {
  id: string;
  name: string;
}

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
  employee?: Employee;
  isEditMode?: boolean;
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
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [positionId, setPositionId] = useState("");
  const [bpjsAccount, setBpjsAccount] = useState("");
  const [npwpAccount, setNpwpAccount] = useState("");
  const [incentive, setIncentive] = useState<number | "">(0);
  const [transportationFee, setTransportationFee] = useState<number | "">(0);
  const [basicSalary, setBasicSalary] = useState<number | "">(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch positions for the dropdown
  useEffect(() => {
    const fetchPositions = async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching positions:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data posisi.",
          variant: "destructive",
        });
        return;
      }

      setPositions(data || []);
    };

    fetchPositions();
  }, [toast]);

  // Populate form fields if in edit mode
  useEffect(() => {
    if (isEditMode && employee) {
      setFirstName(employee.first_name);
      setLastName(employee.last_name || "");
      setEmail(employee.email || "");
      setPhone(employee.phone || "");
      setBirthDate(employee.birth_date ? employee.birth_date.split("T")[0] : "");
      setHireDate(employee.hire_date ? employee.hire_date.split("T")[0] : "");
      setBankName(employee.bank_name || "");
      setBankAccount(employee.bank_account || "");
      setPositionId(employee.position_id || "");
      setBpjsAccount(employee.bpjs_account || "");
      setNpwpAccount(employee.npwp_account || "");
      setIncentive(employee.incentive ?? 0);
      setTransportationFee(employee.transportation_fee ?? 0);
      setBasicSalary(employee.basic_salary);
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setBirthDate("");
      setHireDate("");
      setBankName("");
      setBankAccount("");
      setPositionId("");
      setBpjsAccount("");
      setNpwpAccount("");
      setIncentive(0);
      setTransportationFee(0);
      setBasicSalary(0);
    }
  }, [isEditMode, employee]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Validate required fields
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
          email: email.trim() || null,
          phone: phone.trim() || null,
          birth_date: birthDate || null,
          hire_date: hireDate,
          bank_name: bankName.trim() || null,
          bank_account: bankAccount.trim() || null,
          position_id: positionId || null,
          bpjs_account: bpjsAccount.trim() || null,
          npwp_account: npwpAccount.trim() || null,
          incentive: Number(incentive) || null,
          transportation_fee: Number(transportationFee) || null,
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
          email: email.trim() || null,
          phone: phone.trim() || null,
          birth_date: birthDate || null,
          hire_date: hireDate,
          bank_name: bankName.trim() || null,
          bank_account: bankAccount.trim() || null,
          position_id: positionId || null,
          bpjs_account: bpjsAccount.trim() || null,
          npwp_account: npwpAccount.trim() || null,
          incentive: Number(incentive) || null,
          transportation_fee: Number(transportationFee) || null,
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
      setEmail("");
      setPhone("");
      setBirthDate("");
      setHireDate("");
      setBankName("");
      setBankAccount("");
      setPositionId("");
      setBpjsAccount("");
      setNpwpAccount("");
      setIncentive(0);
      setTransportationFee(0);
      setBasicSalary(0);
      onOpenChange(false);
      await onSuccess();
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Karyawan" : "Tambah Karyawan"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Perbarui detail karyawan di sini." : "Masukkan detail karyawan baru di sini."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid gap-2">
            <Label htmlFor="first-name">Nama Depan *</Label>
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email (opsional)"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Masukkan nomor telepon (opsional)"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="birth-date">Tanggal Lahir</Label>
            <Input
              id="birth-date"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hire-date">Tanggal Perekrutan *</Label>
            <Input
              id="hire-date"
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bank-name">Nama Bank</Label>
            <Input
              id="bank-name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Masukkan nama bank (opsional)"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bank-account">Nomor Rekening Bank</Label>
            <Input
              id="bank-account"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="Masukkan nomor rekening (opsional)"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="position-id">Posisi</Label>
            <Select value={positionId} onValueChange={setPositionId}>
              <SelectTrigger id="position-id">
                <SelectValue placeholder="Pilih posisi (opsional)" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bpjs-account">Nomor BPJS</Label>
            <Input
              id="bpjs-account"
              value={bpjsAccount}
              onChange={(e) => setBpjsAccount(e.target.value)}
              placeholder="Masukkan nomor BPJS (opsional)"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="npwp-account">Nomor NPWP</Label>
            <Input
              id="npwp-account"
              value={npwpAccount}
              onChange={(e) => setNpwpAccount(e.target.value)}
              placeholder="Masukkan nomor NPWP (opsional)"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="incentive">Insentif (Rp)</Label>
            <Input
              id="incentive"
              type="number"
              value={incentive}
              onChange={(e) => setIncentive(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Masukkan insentif (opsional)"
              min="0"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="transportation-fee">Biaya Transportasi (Rp)</Label>
            <Input
              id="transportation-fee"
              type="number"
              value={transportationFee}
              onChange={(e) => setTransportationFee(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Masukkan biaya transportasi (opsional)"
              min="0"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="basic-salary">Gaji Pokok (Rp) *</Label>
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