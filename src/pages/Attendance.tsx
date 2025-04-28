/* src/pages/Attendance.tsx */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DialogTrigger as DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Calendar, Upload, Download, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables, TablesInsert } from "@/integrations/supabase/types";

// Define interface for daily summary (not a database table)
interface DailySummary {
  date: string;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  onLeave: number;
  syncStatus: string;
}

// Define interface for employee data with additional fields
interface EmployeeData {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  department: { name: string } | null;
  position: { name: string } | null;
}

export default function Attendance() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState<Tables<"attendance">[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch attendance and employees data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch employees with department and position
        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select("id, first_name, last_name, departments(name), positions(name)");

        if (employeesError) throw employeesError;

        // Enrich employees data with full_name
        const enrichedEmployees: EmployeeData[] = (employeesData || []).map(emp => ({
          id: emp.id,
          first_name: emp.first_name,
          last_name: emp.last_name || "",
          full_name: `${emp.first_name} ${emp.last_name || ""}`.trim(),
          department: emp.departments,
          position: emp.positions,
        }));
        setEmployees(enrichedEmployees);

        // Fetch attendance for April 2025
        const startDate = "2025-04-01";
        const endDate = "2025-04-30";
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select("*")
          .gte("date", startDate)
          .lte("date", endDate);

        if (attendanceError) throw attendanceError;
        setAttendanceData(attendanceData || []);

        // Aggregate daily summaries
        const summaries: DailySummary[] = [];
        const dates = [...new Set(attendanceData.map(att => att.date))].sort().reverse();
        dates.forEach(date => {
          const dayRecords = attendanceData.filter(att => att.date === date);
          const summary: DailySummary = {
            date: new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
            totalPresent: dayRecords.filter(att => att.status === "present").length,
            totalAbsent: dayRecords.filter(att => att.status === "absent").length,
            totalLate: dayRecords.filter(att => att.status === "late").length,
            onLeave: dayRecords.filter(att => att.status === "leave").length,
            syncStatus: "Tersinkronisasi", // Assume synced; adjust if sync status is tracked
          };
          summaries.push(summary);
        });
        setDailySummaries(summaries);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data kehadiran.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  // Aggregate data for cards
  const totalDays = dailySummaries.length;
  const totalPresentDays = dailySummaries.reduce((sum, day) => sum + day.totalPresent, 0);
  const totalEmployees = new Set(attendanceData.map(att => att.employee_id)).size;
  const attendanceRate = totalEmployees > 0 && totalDays > 0
    ? Math.round((totalPresentDays / (totalDays * totalEmployees)) * 100)
    : 0;
  const totalLate = dailySummaries.reduce((sum, day) => sum + day.totalLate, 0);
  const totalAbsent = dailySummaries.reduce((sum, day) => sum + day.totalAbsent, 0);
  const totalLeave = dailySummaries.reduce((sum, day) => sum + day.onLeave, 0);

  // Handle import from file
  const handleImportFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) {
        toast({
          title: "Error",
          description: "Silakan pilih file untuk diimpor.",
          variant: "destructive",
        });
        return;
      }

      // Dynamically import XLSX
      const XLSX = await import("xlsx");

      // Read the file
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Map the imported data to the attendance table structure
        const attendanceRecords: TablesInsert<"attendance">[] = [];
        const calendarEvents: TablesInsert<"calendar_events">[] = [];
        const uniqueDates = new Set<string>();

        for (const row of jsonData) {
          // Expected columns: Name, Date (YYYY-MM-DD), Status (present/absent/late/leave)
          const employeeName = row["Name"];
          const date = row["Date"];
          const status = row["Status"];

          // Validate required fields
          if (!employeeName || !date || !status) {
            toast({
              title: "Error",
              description: "File harus memiliki kolom Name, Date, dan Status.",
              variant: "destructive",
            });
            return;
          }

          // Validate status
          if (!["present", "absent", "late", "leave"].includes(status.toLowerCase())) {
            toast({
              title: "Error",
              description: `Status tidak valid: ${status}. Harus berupa present, absent, late, atau leave.`,
              variant: "destructive",
            });
            return;
          }

          // Find employee by name
          const employee = employees.find(emp => emp.full_name === employeeName);
          if (!employee) {
            toast({
              title: "Error",
              description: `Karyawan tidak ditemukan: ${employeeName}`,
              variant: "destructive",
            });
            return;
          }

          // Check for duplicate attendance record for the employee on the same date
          const existingRecord = attendanceData.find(
            att => att.employee_id === employee.id && att.date === date
          );
          if (existingRecord) {
            continue; // Skip duplicates
          }

          // Create attendance record
          const attendanceRecord: TablesInsert<"attendance"> = {
            employee_id: employee.id,
            date: date,
            status: status.toLowerCase(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          attendanceRecords.push(attendanceRecord);

          // Collect unique dates for calendar events
          uniqueDates.add(date);
        }

        // Create calendar events for each unique date
        for (const date of uniqueDates) {
          const dateRecords = attendanceRecords.filter(rec => rec.date === date);
          const employeeIds = new Set(dateRecords.map(rec => rec.employee_id));
          const employeesOnDate = employees.filter(emp => employeeIds.has(emp.id));

          const summary = {
            totalPresent: dateRecords.filter(rec => rec.status === "present").length,
            totalAbsent: dateRecords.filter(rec => rec.status === "absent").length,
            totalLate: dateRecords.filter(rec => rec.status === "late").length,
            onLeave: dateRecords.filter(rec => rec.status === "leave").length,
          };

          const descriptionLines = [
            `Total Hadir: ${summary.totalPresent}`,
            `Total Tidak Hadir: ${summary.totalAbsent}`,
            `Total Terlambat: ${summary.totalLate}`,
            `Total Cuti: ${summary.onLeave}`,
            "",
            "Detail Karyawan:",
            ...employeesOnDate.map(emp => 
              `- ${emp.full_name} (${emp.department?.name || "Unknown"} - ${emp.position?.name || "Unknown"})`
            ),
          ];

          const calendarEvent: TablesInsert<"calendar_events"> = {
            title: `Rekap Kehadiran ${new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
            description: descriptionLines.join("\n"),
            event_type: "attendance",
            start_time: new Date(date).toISOString(),
            end_time: new Date(date).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_synced: false,
          };
          calendarEvents.push(calendarEvent);
        }

        // Insert attendance records
        if (attendanceRecords.length > 0) {
          const { error: attendanceError } = await supabase
            .from("attendance")
            .insert(attendanceRecords);

          if (attendanceError) throw attendanceError;

          // Insert calendar events
          if (calendarEvents.length > 0) {
            const { error: calendarError } = await supabase
              .from("calendar_events")
              .insert(calendarEvents);

            if (calendarError) throw calendarError;
          }

          // Refresh attendance data
          const startDate = "2025-04-01";
          const endDate = "2025-04-30";
          const { data: newAttendanceData, error: fetchError } = await supabase
            .from("attendance")
            .select("*")
            .gte("date", startDate)
            .lte("date", endDate);

          if (fetchError) throw fetchError;
          setAttendanceData(newAttendanceData || []);

          // Update daily summaries
          const summaries: DailySummary[] = [];
          const dates = [...new Set(newAttendanceData.map(att => att.date))].sort().reverse();
          dates.forEach(date => {
            const dayRecords = newAttendanceData.filter(att => att.date === date);
            const summary: DailySummary = {
              date: new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
              totalPresent: dayRecords.filter(att => att.status === "present").length,
              totalAbsent: dayRecords.filter(att => att.status === "absent").length,
              totalLate: dayRecords.filter(att => att.status === "late").length,
              onLeave: dayRecords.filter(att => att.status === "leave").length,
              syncStatus: "Tersinkronisasi",
            };
            summaries.push(summary);
          });
          setDailySummaries(summaries);

          toast({
            title: "Sukses",
            description: `Berhasil mengimpor ${attendanceRecords.length} data kehadiran.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Info",
            description: "Tidak ada data baru untuk diimpor.",
            variant: "default",
          });
        }

        setIsImportDialogOpen(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      console.error("Error importing attendance:", error);
      toast({
        title: "Error",
        description: `Gagal mengimpor data kehadiran: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kehadiran</h1>
        <p className="text-muted-foreground">
          Kelola data kehadiran karyawan dan sinkronisasi dengan kalendar
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tingkat Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Bulan April 2025</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Keterlambatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLate}</div>
            <p className="text-xs text-muted-foreground">Bulan April 2025</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Absensi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAbsent}</div>
            <p className="text-xs text-muted-foreground">Bulan April 2025</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cuti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeave}</div>
            <p className="text-xs text-muted-foreground">Bulan April 2025</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 md:justify-between md:items-center">
        <div>
          <h2 className="text-xl font-semibold">Data Kehadiran Harian</h2>
          <p className="text-muted-foreground">Riwayat kehadiran per hari</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Upload size={16} />
                <span>Import Kehadiran</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Import Data Kehadiran</DialogTitle>
                <DialogDescription>
                  Unggah file CSV atau XLSX dari mesin absensi
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Pilih File</label>
                  <Input type="file" accept=".csv, .xlsx" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Tanggal Kehadiran</label>
                  <Input type="date" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button onClick={() => setIsDialogOpen(false)}>Import</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Upload size={16} />
                <span>Import dari Mesin/File</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Import Data Kehadiran dari Mesin/File</DialogTitle>
                <DialogDescription>
                  Unggah file CSV atau XLSX yang berisi data kehadiran. File harus memiliki kolom: Name, Date (YYYY-MM-DD), Status (present/absent/late/leave).
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Pilih File</label>
                  <Input
                    type="file"
                    accept=".csv, .xlsx"
                    onChange={handleImportFromFile}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Batal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar size={16} />
            <span>Sinkronisasi Kalendar</span>
          </Button>
          
          <Button variant="outline" size="icon">
            <Download size={16} />
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Hadir</TableHead>
                  <TableHead>Tidak Hadir</TableHead>
                  <TableHead>Terlambat</TableHead>
                  <TableHead>Cuti</TableHead>
                  <TableHead>Status Sinkronisasi</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailySummaries.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.date}</TableCell>
                    <TableCell>{row.totalPresent}</TableCell>
                    <TableCell>{row.totalAbsent}</TableCell>
                    <TableCell>{row.totalLate}</TableCell>
                    <TableCell>{row.onLeave}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {row.syncStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Lihat Detail</DropdownMenuItem>
                          <DropdownMenuItem>Edit Data</DropdownMenuItem>
                          <DropdownMenuItem>Sinkronisasi Ulang</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}