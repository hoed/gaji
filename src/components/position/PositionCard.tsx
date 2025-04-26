
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import AddPositionDialog from "./AddPositionDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define the position interface to match the database schema
interface Position {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  departments?: {
    name: string;
  };
}

export default function PositionCard() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const { data: positions, refetch } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('positions')
        .select('*, departments(name)')
        .order('name');
      if (error) throw error;
      return data as Position[];
    }
  });

  return (
    <Card className="col-span-12 md:col-span-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Jabatan</CardTitle>
        <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Jabatan
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {positions?.map((pos) => (
            <div key={pos.id} className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">{pos.name}</p>
                <p className="text-sm text-muted-foreground">
                  {pos.departments && `Departemen: ${pos.departments.name}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <AddPositionDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        onSuccess={refetch}
      />
    </Card>
  );
}
