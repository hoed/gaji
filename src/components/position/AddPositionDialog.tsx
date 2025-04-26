
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Department {
  id: string;
  name: string;
}

interface AddPositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AddPositionDialog({ open, onOpenChange, onSuccess }: AddPositionDialogProps) {
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [salaryBase, setSalaryBase] = useState<number>(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");

      if (error) {
        toast.error("Error fetching departments");
        console.error(error);
        return;
      }

      setDepartments(data || []);
    };

    if (open) {
      fetchDepartments();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Position name is required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use name instead of title to match database schema
      const { error } = await supabase
        .from("positions")
        .insert({ 
          name: name.trim(), 
          department_id: departmentId || null,
          salary_base: salaryBase || 0
        });

      if (error) throw error;
      
      toast.success("Position added successfully");
      onSuccess();
      onOpenChange(false);
      setName("");
      setDepartmentId("");
      setSalaryBase(0);
    } catch (error: any) {
      toast.error(`Error adding position: ${error.message}`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Position</DialogTitle>
          <DialogDescription>
            Add a new position to the system.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Position Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter position name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger id="department">
                <SelectValue placeholder="Select a department" />
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
          <div className="grid gap-2">
            <Label htmlFor="salaryBase">Base Salary</Label>
            <Input
              id="salaryBase"
              type="number"
              value={salaryBase}
              onChange={(e) => setSalaryBase(Number(e.target.value))}
              placeholder="Enter base salary"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Position"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
