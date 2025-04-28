
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import AddDepartmentDialog from "./AddDepartmentDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define the department interface to match the database schema
interface Department {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function DepartmentCard() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const { data: departments, refetch } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Department[];
    }
  });

  return (
    <Card className="col-span-12 md:col-span-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Departemen</CardTitle>
        <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Departemen
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {departments?.map((dept) => (
            <div key={dept.id} className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">{dept.name}</p>
                {/* Only show description if it exists */}
                {dept.description && (
                  <p className="text-sm text-muted-foreground">{dept.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <AddDepartmentDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onSuccess={refetch}
      />
    </Card>
  );
}
