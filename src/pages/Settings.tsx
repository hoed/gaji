import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [apiKey, setApiKey] = useState("");
  
  const handleConnectCalendar = () => {
    // In a real implementation, this would trigger OAuth flow
    setTimeout(() => {
      setIsGoogleCalendarConnected(true);
      toast({
        title: "Berhasil terhubung",
        description: "Google Calendar berhasil terhubung ke akun Anda",
      });
    }, 1000);
  };
  
  const handleSaveCompanySettings = () => {
    toast({
      title: "Pengaturan disimpan",
      description: "Pengaturan perusahaan berhasil disimpan",
    });
  };
  
  const handleSaveTaxSettings = () => {
    toast({
      title: "Pengaturan disimpan",
      description: "Pengaturan pajak berhasil disimpan",
    });
  };
  
  const handleGenerateApiKey = () => {
    const newApiKey = crypto.randomUUID();
    setApiKey(newApiKey);
    toast({
      title: "API Key dibuat",
      description: "API Key baru telah dibuat untuk integrasi mesin absensi",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">
          Konfigurasi sistem penggajian dan pengaturan aplikasi
        </p>
      </div>
      
      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Perusahaan</TabsTrigger>
          <TabsTrigger value="tax">Pajak & BPJS</TabsTrigger>
          <TabsTrigger value="integration">Integrasi</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Perusahaan</CardTitle>
              <CardDescription>
                Pengaturan dasar untuk informasi perusahaan Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Perusahaan</label>
                  <Input defaultValue="PT Maju Bersama Indonesia" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">NPWP Perusahaan</label>
                  <Input defaultValue="01.234.567.8-901.000" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Alamat</label>
                  <Input defaultValue="Jl. Gatot Subroto No. 123" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kota</label>
                  <Input defaultValue="Jakarta Selatan" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Perusahaan</label>
                  <Input defaultValue="info@majubersama.co.id" type="email" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nomor Telepon</label>
                  <Input defaultValue="021-5551234" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Pembayaran Gaji</label>
                <Input defaultValue="25" type="number" min="1" max="31" className="max-w-xs" />
                <p className="text-xs text-muted-foreground">
                  Tanggal pembayaran gaji setiap bulannya
                </p>
              </div>
              
              <Button onClick={handleSaveCompanySettings}>Simpan Pengaturan</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Pajak (PPh 21)</CardTitle>
              <CardDescription>
                Konfigurasi perhitungan pajak penghasilan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Gunakan PTKP Terbaru</p>
                    <p className="text-sm text-muted-foreground">
                      Menggunakan nilai PTKP (Penghasilan Tidak Kena Pajak) terbaru
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Hitung PPh 21 Otomatis</p>
                    <p className="text-sm text-muted-foreground">
                      Menghitung PPh 21 secara otomatis berdasarkan gaji
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Metode Gross</p>
                    <p className="text-sm text-muted-foreground">
                      Pajak ditanggung oleh karyawan (gross method)
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Pengaturan BPJS</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nomor BPJS Kesehatan Perusahaan</label>
                    <Input defaultValue="1234567890" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nomor BPJS Ketenagakerjaan</label>
                    <Input defaultValue="0987654321" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Hitung BPJS Otomatis</p>
                    <p className="text-sm text-muted-foreground">
                      Menghitung kontribusi BPJS secara otomatis
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <Button onClick={handleSaveTaxSettings}>Simpan Pengaturan</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integration">
          <Card>
            <CardHeader>
              <CardTitle>Integrasi Google Calendar</CardTitle>
              <CardDescription>
                Hubungkan dengan Google Calendar untuk sinkronisasi jadwal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Status Koneksi</p>
                  <p className="text-sm text-muted-foreground">
                    Status koneksi dengan Google Calendar
                  </p>
                </div>
                {isGoogleCalendarConnected ? (
                  <div className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
                    Terhubung
                  </div>
                ) : (
                  <div className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-800">
                    Tidak Terhubung
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sinkronisasi Jadwal Pembayaran</p>
                    <p className="text-sm text-muted-foreground">
                      Tambahkan jadwal pembayaran gaji ke Google Calendar
                    </p>
                  </div>
                  <Switch disabled={!isGoogleCalendarConnected} defaultChecked={isGoogleCalendarConnected} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sinkronisasi Tenggat Pajak</p>
                    <p className="text-sm text-muted-foreground">
                      Tambahkan tenggat pembayaran pajak ke Google Calendar
                    </p>
                  </div>
                  <Switch disabled={!isGoogleCalendarConnected} defaultChecked={isGoogleCalendarConnected} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sinkronisasi Data Kehadiran</p>
                    <p className="text-sm text-muted-foreground">
                      Tambahkan data kehadiran karyawan ke Google Calendar
                    </p>
                  </div>
                  <Switch disabled={!isGoogleCalendarConnected} defaultChecked={isGoogleCalendarConnected} />
                </div>
              </div>
              
              {!isGoogleCalendarConnected ? (
                <Button onClick={handleConnectCalendar}>
                  Hubungkan Google Calendar
                </Button>
              ) : (
                <Button variant="destructive" onClick={() => setIsGoogleCalendarConnected(false)}>
                  Putuskan Koneksi
                </Button>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Integrasi Data Kehadiran</CardTitle>
              <CardDescription>
                Pengaturan untuk mengimpor data kehadiran
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Format File Default</label>
                  <select className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background">
                    <option>CSV (.csv)</option>
                    <option>Excel (.xlsx)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Format file default untuk impor data kehadiran
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Validasi Otomatis</p>
                    <p className="text-sm text-muted-foreground">
                      Validasi data kehadiran secara otomatis saat diimpor
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <Button>Simpan Pengaturan</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Kelola API key untuk integrasi dengan mesin absensi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">API Key Mesin Absensi</p>
                    <p className="text-sm text-muted-foreground">
                      Gunakan API key ini untuk mengintegrasikan mesin absensi dengan sistem
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input 
                      value={apiKey} 
                      readOnly 
                      className="font-mono"
                      placeholder="Belum ada API key yang dibuat"
                    />
                    <Button onClick={handleGenerateApiKey}>
                      Generate API Key
                    </Button>
                  </div>
                  {apiKey && (
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Simpan API key ini dengan aman. API key tidak akan ditampilkan lagi setelah anda meninggalkan halaman ini.
                    </p>
                  )}
                </div>
                
                <div className="space-y-2 pt-4">
                  <h4 className="text-sm font-medium">Dokumentasi API</h4>
                  <div className="rounded-md bg-muted p-4">
                    <pre className="text-xs">
                      <code>
                        {`POST /api/attendance
Content-Type: application/json
Authorization: Bearer {YOUR_API_KEY}

{
  "employee_id": "uuid",
  "check_in": "2025-04-24T08:00:00Z",
  "check_out": "2025-04-24T17:00:00Z",
  "status": "present"}`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
