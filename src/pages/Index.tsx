
/* src/pages/Index.tsx */
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Users, CreditCard, Calendar } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated, redirect to dashboard
    const checkAuthStatus = async () => {
      const { data } = await fetch('/api/auth/status').then(res => res.json());
      if (data?.authenticated) {
        navigate('/dashboard');
      }
    };
    
    // Only for development, in production would use actual auth status
    // checkAuthStatus();
  }, [navigate]);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center max-w-md sm:max-w-lg w-full p-6 sm:p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-primary">Gaji Kita Selaras</h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-6">Sistem Manajemen Penggajian Modern</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button 
            onClick={() => handleNavigation('/laporan')} 
            className="w-full flex items-center justify-center py-6"
            variant="default"
          >
            <Eye className="mr-2 h-5 w-5" />
            <span>Lihat Laporan</span>
          </Button>
          
          <Button 
            onClick={() => handleNavigation('/karyawan')} 
            className="w-full flex items-center justify-center py-6"
            variant="outline"
          >
            <Users className="mr-2 h-5 w-5" />
            <span>Data Karyawan</span>
          </Button>
          
          <Button 
            onClick={() => handleNavigation('/penggajian')} 
            className="w-full flex items-center justify-center py-6"
            variant="outline"
          >
            <CreditCard className="mr-2 h-5 w-5" />
            <span>Penggajian</span>
          </Button>
          
          <Button 
            onClick={() => handleNavigation('/kehadiran')} 
            className="w-full flex items-center justify-center py-6"
            variant="outline"
          >
            <Calendar className="mr-2 h-5 w-5" />
            <span>Kehadiran</span>
          </Button>
        </div>
        
        <Card className="mt-6 bg-gray-50 border-gray-100">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Akses informasi penggajian, kehadiran, dan SDM dari mana saja dengan tampilan yang intuitif dan responsif.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
