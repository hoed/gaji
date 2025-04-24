/* src/pages/Calendar.tsx */
import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Download, FileText, Loader2, CalendarCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

// Define interface for aggregated attendance (not a database table)
interface AggregatedAttendance {
  employee_id: string;
  full_name: string;
  total_days: number;
  present_days: number;
  sick_days: number;
  leave_days: number;
  absent_days: number;
}

// Define interface for enriched payroll (not a database table)
interface EnrichedPayroll extends Tables<"payroll"> {
  full_name: string;
  department: string;
  position: string;
}

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "MMMM yyyy"));
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  
  const [calendarEvents, setCalendarEvents] = useState<Tables<"calendar_events">[]>([]);
  const [payrollData, setPayrollData] = useState<Tables<"payroll">[]>([]);
  const [attendanceData, setAttendanceData] = useState<Tables<"attendance">[]>([]);
  const [employees, setEmployees] = useState<Tables<"employees">[]>([]);
  const [departments, setDepartments] = useState<Tables<"departments">[]>([]);
  const [positions, setPositions] = useState<Tables<"positions">[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Format the selected date as YYYY-MM for database queries
  const formattedMonth = date ? format(date, "yyyy-MM") : format(new Date(), "yyyy-MM");

  // Load calendar events, payroll, attendance, employees, departments, and positions
  const loadMonthData = async () => {
    if (!date) return;
    
    setIsLoading(true);
    try {
      const startDate = format(new Date(date.getFullYear(), date.getMonth(), 1), "yyyy-MM-dd");
      const endDate = format(new Date(date.getFullYear(), date.getMonth() + 1, 0), "yyyy-MM-dd");

      // Fetch calendar events for the selected month
      const { data: eventsData, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', startDate + "T00:00:00Z")
        .lte('start_time', endDate + "T23:59:59Z");
      
      if (eventsError) throw eventsError;
      setCalendarEvents(eventsData || []);

      // Fetch payroll data
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll')
        .select('*')
        .gte('period_start', startDate)
        .lte('period_end', endDate);
      
      if (payrollError) throw payrollError;
      setPayrollData(payrollData || []);

      // Fetch attendance data
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (attendanceError) throw attendanceError;
      setAttendanceData(attendanceData || []);

      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*');
      
      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);

      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*');
      
      if (departmentsError) throw departmentsError;
      setDepartments(departmentsData || []);

      // Fetch positions
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('*');
      
      if (positionsError) throw positionsError;
      setPositions(positionsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to Google Calendar
  const handleConnectGoogleCalendar = () => {
    setIsConnecting(true);
    
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
  };

  // Handle month change
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      setSelectedMonth(format(newDate, "MMMM yyyy"));
      setTimeout(loadMonthData, 100);
    }
  };
  
  // Load initial data on component mount
  useEffect(() => {
    loadMonthData();
  }, []);

  // Aggregate attendance data for display
  const aggregatedAttendance: AggregatedAttendance[] = employees.map(employee => {
    const employeeAttendance = attendanceData.filter(att => att.employee_id === employee.id);
    return {
      employee_id: employee.id,
      full_name: `${employee.first_name} ${employee.last_name || ''}`.trim(),
      total_days: employeeAttendance.length,
      present_days: employeeAttendance.filter(att => att.status === 'present').length,
      sick_days: employeeAttendance.filter(att => att.status === 'sick').length,
      leave_days: employeeAttendance.filter(att => att.status === 'leave').length,
      absent_days: employeeAttendance.filter(att => att.status === 'absent').length,
    };
  }).filter(att => att.total_days > 0);

  // Map payroll data with employee details
  const enrichedPayrollData: EnrichedPayroll[] = payrollData.map(payroll => {
    const employee = employees.find(emp => emp.id === payroll.employee_id);
    const position = positions.find(pos => pos.id === employee?.position_id);
    const department = departments.find(dep => dep.id === position?.department_id);
    return {
      ...payroll,
      full_name: employee ? `${employee.first_name} ${employee.last_name || ''}`.trim() : 'Unknown',
      department: department?.name || 'Unknown',
      position: position?.title || 'Unknown',
    };
  });

  // Filter calendar events for "Jadwal Pembayaran"
  const paymentEvents = calendarEvents.filter(event => 
    ['payroll_payment', 'pph21_payment', 'bpjs_kesehatan_payment', 'bpjs_ketenagakerjaan_payment'].includes(event.event_type)
  );

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
              mode="single"
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
                  ) : aggregatedAttendance.length > 0 ? (
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
                        {aggregatedAttendance.map((item) => (
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
                  ) : enrichedPayrollData.length > 0 ? (
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
                        {enrichedPayrollData.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.full_name}</TableCell>
                            <TableCell>{item.department}</TableCell>
                            <TableCell>{item.position}</TableCell>
                            <TableCell>Rp {item.basic_salary.toLocaleString('id-ID')}</TableCell>
                            <TableCell>Rp {(
                              (item.pph21 || 0) + 
                              (item.bpjs_kes_employee || 0) + 
                              (item.bpjs_tk_jht_employee || 0) + 
                              (item.bpjs_tk_jp_employee || 0) + 
                              (item.deductions || 0)
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
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : paymentEvents.length > 0 ? (
                    <div className="space-y-4">
                      {paymentEvents.map(event => (
                        <div key={event.id} className="flex items-center justify-between py-2 border-b">
                          <div>
                            <p className="font-medium">
                              {event.event_type === 'payroll_payment' && 'Pembayaran Gaji'}
                              {event.event_type === 'pph21_payment' && 'Pembayaran PPh 21'}
                              {event.event_type === 'bpjs_kesehatan_payment' && 'Pembayaran BPJS Kesehatan'}
                              {event.event_type === 'bpjs_ketenagakerjaan_payment' && 'Pembayaran BPJS Ketenagakerjaan'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Periode {selectedMonth}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{format(new Date(event.start_time), "dd MMMM yyyy")}</p>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              new Date(event.start_time) < new Date() 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {new Date(event.start_time) < new Date() ? 'Terjadwal' : 'Mendatang'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 opacity-20" />
                      <p className="mt-2">Tidak ada jadwal pembayaran untuk bulan ini</p>
                    </div>
                  )}
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