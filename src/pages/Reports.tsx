
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, PieChart, BarChart } from "lucide-react";

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState("april2025");
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Laporan</h1>
        <p className="text-muted-foreground">
          Laporan penggajian, pajak, dan BPJS
        </p>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="w-full max-w-xs">
          <Select
            value={selectedMonth}
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="april2025">April 2025</SelectItem>
              <SelectItem value="maret2025">Maret 2025</SelectItem>
              <SelectItem value="februari2025">Februari 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" className="flex items-center gap-2">
          <Download size={16} />
          <span>Download Semua Laporan</span>
        </Button>
      </div>
      
      <Tabs defaultValue="summary">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="summary">Ringkasan</TabsTrigger>
          <TabsTrigger value="payroll">Penggajian</TabsTrigger>
          <TabsTrigger value="tax">Pajak</TabsTrigger>
          <TabsTrigger value="bpjs">BPJS</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ringkasan Penggajian</CardTitle>
                <CardDescription>April 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">Total Gaji Kotor</span>
                    <span className="font-medium">Rp 240.500.000</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">Total PPh 21</span>
                    <span className="font-medium">Rp 12.845.000</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">Total BPJS</span>
                    <span className="font-medium">Rp 14.875.000</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-medium">Total Gaji Bersih</span>
                    <span className="font-bold">Rp 212.780.000</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download size={14} />
                  <span>Unduh</span>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rincian Departemen</CardTitle>
                <CardDescription>Distribusi biaya gaji per departemen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-40 w-full flex items-center justify-center border rounded-md">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <PieChart size={40} />
                    <p className="text-sm mt-2">Grafik departemen</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm">Teknologi Informasi</span>
                    </div>
                    <span className="text-sm font-medium">Rp 80.500.000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">Human Resources</span>
                    </div>
                    <span className="text-sm font-medium">Rp 45.000.000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                      <span className="text-sm">Keuangan</span>
                    </div>
                    <span className="text-sm font-medium">Rp 55.000.000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm">Pemasaran & Operasional</span>
                    </div>
                    <span className="text-sm font-medium">Rp 60.000.000</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download size={14} />
                  <span>Unduh</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Tren Penggajian</CardTitle>
              <CardDescription>6 bulan terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-60 w-full flex items-center justify-center border rounded-md">
                <div className="flex flex-col items-center text-muted-foreground">
                  <BarChart size={40} />
                  <p className="text-sm mt-2">Grafik tren penggajian</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download size={14} />
                <span>Unduh</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="payroll" className="mt-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Laporan Penggajian Detail</CardTitle>
                <CardDescription>April 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-md">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <FileText size={40} />
                    <p className="mt-2">Laporan penggajian detail</p>
                    <p className="text-sm">Berisi informasi lengkap gaji setiap karyawan</p>
                    <Button className="mt-4" variant="outline">Download Laporan</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tax" className="mt-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Laporan PPh 21</CardTitle>
                <CardDescription>April 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-md">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <FileText size={40} />
                    <p className="mt-2">Laporan PPh 21</p>
                    <p className="text-sm">Berisi rincian pajak penghasilan karyawan</p>
                    <Button className="mt-4" variant="outline">Download Laporan</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="bpjs" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Laporan BPJS Kesehatan</CardTitle>
                <CardDescription>April 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-md">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <FileText size={40} />
                    <p className="mt-2">BPJS Kesehatan</p>
                    <p className="text-sm">Iuran dan rincian BPJS Kesehatan</p>
                    <Button className="mt-4" variant="outline">Download Laporan</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Laporan BPJS Ketenagakerjaan</CardTitle>
                <CardDescription>April 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-md">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <FileText size={40} />
                    <p className="mt-2">BPJS Ketenagakerjaan</p>
                    <p className="text-sm">Iuran dan rincian BPJS Ketenagakerjaan</p>
                    <Button className="mt-4" variant="outline">Download Laporan</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
