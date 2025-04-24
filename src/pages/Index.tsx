/* src/pages/Index.tsx */
import React from 'react';
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  const handleReviewClick = () => {
    navigate('/laporan');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-4xl font-bold mb-4 text-primary">Gaji Kita Selaras</h1>
        <p className="text-xl text-gray-600 mb-6">Sistem Manajemen Penggajian Modern</p>
        
        <div className="space-y-4">
          <Button 
            onClick={handleReviewClick} 
            className="w-full"
          >
            <Eye className="mr-2 h-4 w-4" />
            Lihat Laporan
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Mulai mengulas laporan keuangan, kehadiran, dan informasi penting lainnya.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;