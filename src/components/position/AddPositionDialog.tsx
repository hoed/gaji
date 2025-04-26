
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddPositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddPositionDialog({ 
  open, 
  onOpenChange,
  onSuccess 
}: AddPositionDialogProps) {
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [salaryBase, setSalaryBase] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('positions')
        .insert([{ 
          title, 
          department_id: departmentId,
          salary_base: parseFloat(salaryBase)
        }]);

      if (error) throw error;
      
      toast.success("Jabatan berhasil ditambahkan");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Gagal menambahkan jabatan: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Jabatan Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama Jabatan</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan nama jabatan"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Departemen</label>
            <Select
              value={departmentId}
              onValueChange={setDepartmentId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih departemen" />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Gaji Pokok</label>
            <Input
              type="number"
              value={salaryBase}
              onChange={(e) => setSalaryBase(e.target.value)}
              placeholder="Masukkan gaji pokok"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
