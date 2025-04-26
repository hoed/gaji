
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Department {
  id: string;
  name: string;
}

interface AddPositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddPositionDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddPositionDialogProps) {
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Reset form when dialog opens
    if (open) {
      setName("");
      setDepartmentId("");
    }
    
    // Fetch departments
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from("departments")
          .select("id, name")
          .order("name");
        
        if (error) throw error;
        setDepartments(data || []);
        
      } catch (error: any) {
        console.error("Error fetching departments:", error);
        toast.error(`Failed to load departments: ${error.message}`);
      }
    };
    
    if (open) {
      fetchDepartments();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!name.trim()) {
        throw new Error("Nama jabatan tidak boleh kosong");
      }
      
      // Insert new position
      const { error } = await supabase
        .from("positions")
        .insert({
          name, // Use name instead of title to match the database schema
          department_id: departmentId || null,
        });
      
      if (error) throw error;
      
      toast.success("Jabatan berhasil ditambahkan");
      onOpenChange(false);
      onSuccess?.();
      
    } catch (error: any) {
      console.error("Error adding position:", error);
      toast.error(`Failed to add position: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Jabatan Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Jabatan</Label>
            <Input
              id="name"
              placeholder="Masukkan nama jabatan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Departemen</Label>
            <Select 
              value={departmentId} 
              onValueChange={setDepartmentId}
              disabled={isLoading}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Pilih departemen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Tidak ada departemen --</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
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
