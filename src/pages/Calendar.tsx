
import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Download, FileText, Loader2, CalendarCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "MMMM yyyy"));
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  
  // Format the selected date as YYYY-MM for database queries
  const formattedMonth = date ? format(date, "yyyy-MM") : format(new Date(), "yyyy-MM");

  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [salaryData, setSalaryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load data for the selected month
  const loadMonthData = async () => {
    if (!date) return;
    
    setIsLoading(true);
    try {
      // Format date for beginning and end of month
      const startDate = format(new Date(date.getFullYear(), date.getMonth(), 1), "yyyy-MM-dd");
      const endDate = format(new Date(date.getFullYear(), date.getMonth() + 1, 0), "yyyy-MM-dd");
      
      // Fetch attendance data
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_summary')
        .select('*')
        .eq('month', startDate);
      
      if (attendanceError) throw attendanceError;
      setAttendanceData(attendanceData || []);
      
      // Fetch payroll data
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll_summary')
        .select('*')
        .gte('period_start', startDate)
        .lte('period_end', endDate);
      
      if (payrollError) throw payrollError;
      setSalaryData(payrollData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to Google Calendar
  const handleConnectGoogleCalendar = () => {
    setIsConnecting(true);
    
    // In a real implementation, this would trigger OAuth flow with Google
    setTimeout(() => {
      toast({
        title: "Berhasil terhubung",
        description: "Google Calendar berhasil terhubung ke akun Anda",
      });
      setIsConnecting(false);
    }, 1500);
  };

  // Download reports
  const handleDownloadReport = (reportType: string) => {
    toast({
      title: "Mengunduh laporan",
      description: `Laporan ${reportType} sedang diunduh`,
    });
    // In a real implementation, this would generate and download a report file
  };

  // Handle month change
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      setSelectedMonth(format(newDate, "MMMM yyyy"));
      
      // Load data for the new month
      setTimeout(loadMonthData, 100);
    }
  };
  
  // Load initial data on component mount
  React.useEffect(() => {
    loadMonthData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kalender</h1>
        <p className="text-muted-foreground">
          Lihat dan kelola kehadiran dan informasi penggajian
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="md:w-[350px] h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              <span>Pilih Bulan</span>
            </CardTitle>
            <CardDescription>
              Pilih bulan untuk melihat data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="default"
              selected={date}
              onSelect={handleDateChange}
              className="pointer-events-auto"
            />
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleConnectGoogleCalendar}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Menghubungkan...</span>
                </>
              ) : (
                <>
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  <span>Hubungkan Google Calendar</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="flex-1">
          <Tabs defaultValue="attendance">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="attendance">Kehadiran</TabsTrigger>
                <TabsTrigger value="salary">Penggajian</TabsTrigger>
              </TabsList>
              <div>
                <h2 className="text-lg font-semibold">{selectedMonth}</h2>
              </div>
            </div>
            
            <TabsContent value="attendance" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Laporan Kehadiran</CardTitle>
                    <CardDescription>
                      Rekapitulasi kehadiran karyawan untuk bulan {selectedMonth}
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => handleDownloadReport('kehadiran')}>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Unduh</span>
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : attendanceData.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Karyawan</TableHead>
                          <TableHead>Total Hari</TableHead>
                          <TableHead>Hadir</TableHead>
                          <TableHead>Sakit</TableHead>
                          <TableHead>Ijin</TableHead>
                          <TableHead>Absen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceData.map((item) => (
                          <TableRow key={item.employee_id}>
                            <TableCell className="font-medium">{item.full_name}</TableCell>
                            <TableCell>{item.total_days}</TableCell>
                            <TableCell>{item.present_days}</TableCell>
                            <TableCell>{item.sick_days}</TableCell>
                            <TableCell>{item.leave_days}</TableCell>
                            <TableCell>{item.absent_days}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 opacity-20" />
                      <p className="mt-2">Tidak ada data kehadiran untuk bulan ini</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Template Import Data Kehadiran</CardTitle>
                  <CardDescription>Unduh template untuk impor data kehadiran dari mesin absensi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button variant="outline" className="justify-start" onClick={() => window.open('/template-kehadiran-csv.csv')}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Template CSV</span>
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => window.open('/template-kehadiran-excel.xlsx')}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Template Excel</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="salary" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Laporan Penggajian</CardTitle>
                    <CardDescription>
                      Rekapitulasi penggajian untuk bulan {selectedMonth}
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => handleDownloadReport('penggajian')}>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Unduh</span>
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : salaryData.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Departemen</TableHead>
                          <TableHead>Posisi</TableHead>
                          <TableHead>Gaji Pokok</TableHead>
                          <TableHead>Total Potongan</TableHead>
                          <TableHead>Gaji Bersih</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salaryData.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.full_name}</TableCell>
                            <TableCell>{item.department}</TableCell>
                            <TableCell>{item.position}</TableCell>
                            <TableCell>Rp {item.basic_salary.toLocaleString('id-ID')}</TableCell>
                            <TableCell>Rp {(
                              item.pph21 + 
                              item.bpjs_kesehatan_total + 
                              item.bpjs_ketenagakerjaan_total + 
                              item.deductions
                            ).toLocaleString('id-ID')}</TableCell>
                            <TableCell>Rp {item.net_salary.toLocaleString('id-ID')}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                item.payment_status === 'paid' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {item.payment_status === 'paid' ? 'Dibayar' : 'Pending'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 opacity-20" />
                      <p className="mt-2">Tidak ada data penggajian untuk bulan ini</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Jadwal Pembayaran</CardTitle>
                  <CardDescription>Jadwal pembayaran gaji, pajak, dan BPJS</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">Pembayaran Gaji</p>
                        <p className="text-sm text-muted-foreground">Periode April 2025</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">30 April 2025</p>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Terjadwal
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">Pembayaran PPh 21</p>
                        <p className="text-sm text-muted-foreground">Periode April 2025</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">10 Mei 2025</p>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          Mendatang
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">Pembayaran BPJS Kesehatan</p>
                        <p className="text-sm text-muted-foreground">Periode April 2025</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">10 Mei 2025</p>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          Mendatang
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">Pembayaran BPJS Ketenagakerjaan</p>
                        <p className="text-sm text-muted-foreground">Periode April 2025</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">15 Mei 2025</p>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          Mendatang
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
