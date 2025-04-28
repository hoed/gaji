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
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Calendar, Upload, Download, MoreVertical, AlertCircle } from "lucide-react";
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

// Define interface for import status
interface ImportStatus {
  timestamp: string;
  totalRecords: number;
  successfulRecords: number;
  errors: string[];
  mismatches: { employeeName: string; reason: string }[];
}

// Define custom type for calendar_events to include event_type, is_synced, check_in, check_out, and reference IDs
interface CalendarEvent {
  id?: string;
  api_key_id?: string;
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time: string;
  check_in?: string | null; // Earliest check-in time for the day
  check_out?: string | null; // Latest check-out time for the day
  earliest_check_in_attendance_id?: string | null; // ID of attendance record with earliest check_in
  latest_check_out_attendance_id?: string | null; // ID of attendance record with latest check_out
  created_at?: string;
  updated_at?: string;
  is_synced: boolean;
}

// Define computed status type
type AttendanceStatus = "present" | "absent" | "late" | "leave";

// Helper function to compute status based on check_in and check_out
const computeStatus = (checkIn: string | null, statusFromSource: string): AttendanceStatus => {
  if (statusFromSource.toLowerCase() === "leave") return "leave";
  if (!checkIn) return "absent";
  
  const checkInTime = new Date(checkIn);
  const hours = checkInTime.getHours();
  const minutes = checkInTime.getMinutes();
  const isLate = hours > 9 || (hours === 9 && minutes > 0); // Late if after 09:00
  return isLate ? "late" : "present";
};

// Interface for API response data
interface AttendanceMachineRecord {
  Name: string;
  Date: string;
  Status: string;
}

// Helper function to validate if an object matches AttendanceMachineRecord
const isAttendanceMachineRecord = (row: unknown): row is AttendanceMachineRecord => {
  if (typeof row !== "object" || row === null) return false;
  const record = row as Record<string, unknown>;
  return (
    typeof record["Name"] === "string" &&
    typeof record["Date"] === "string" &&
    typeof record["Status"] === "string"
  );
};

export default function Attendance() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState<Tables<"attendance">[]>([]);
  const [absencesData, setAbsencesData] = useState<Tables<"absences">[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Fetch attendance, absences, and employees data
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

        // Fetch absences for April 2025
        const { data: absencesData, error: absencesError } = await supabase
          .from("absences")
          .select("*")
          .gte("date", startDate)
          .lte("date", endDate);

        if (absencesError) throw absencesError;
        setAbsencesData(absencesData as Tables<"absences">[] || []);

        // Aggregate daily summaries
        const summaries: DailySummary[] = [];
        const dates = [...new Set(attendanceData.map(att => att.date))].sort().reverse();
        dates.forEach(date => {
          const dayRecords = attendanceData.filter(att => att.date === date);
          const dayAbsences = (absencesData as Tables<"absences">[]).filter(abs => abs.date === date);
          const leaveCount = dayAbsences.length; // Absences table will track leave as well
          const summary: DailySummary = {
            date: new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
            totalPresent: dayRecords.filter(att => computeStatus(att.check_in, "present") === "present").length,
            totalAbsent: dayRecords.filter(att => computeStatus(att.check_in, "present") === "absent").length,
            totalLate: dayRecords.filter(att => computeStatus(att.check_in, "present") === "late").length,
            onLeave: leaveCount,
            syncStatus: "Tersinkronisasi",
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

  // Common logic to process attendance records (used by both file import and API sync)
  const processAttendanceRecords = async (jsonData: AttendanceMachineRecord[]) => {
    // Initialize import status
    const importStatus: ImportStatus = {
      timestamp: new Date().toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      totalRecords: jsonData.length,
      successfulRecords: 0,
      errors: [],
      mismatches: [],
    };

    // Map the data to the attendance and absences tables
    const attendanceRecords: TablesInsert<"attendance">[] = [];
    const absenceRecords: TablesInsert<"absences">[] = [];
    const calendarEvents: CalendarEvent[] = [];
    const uniqueDates = new Set<string>();

    for (const row of jsonData) {
      const employeeName = row["Name"];
      const date = row["Date"];
      const status = row["Status"];

      // Validate required fields
      if (!employeeName || !date || !status) {
        importStatus.errors.push(`Baris dengan Name: "${employeeName || "Tidak ada"}", Date: "${date || "Tidak ada"}" - Kolom Name, Date, dan Status wajib ada.`);
        continue;
      }

      // Validate status
      if (!["present", "absent", "late", "leave"].includes(status.toLowerCase())) {
        importStatus.errors.push(`Baris dengan Name: "${employeeName}", Date: "${date}" - Status tidak valid: ${status}. Harus berupa present, absent, late, atau leave.`);
        continue;
      }

      // Find employee by name
      const employee = employees.find(emp => emp.full_name === employeeName);
      if (!employee) {
        importStatus.mismatches.push({
          employeeName: employeeName,
          reason: "Karyawan tidak ditemukan di database.",
        });
        continue;
      }

      // Check for duplicate attendance record for the employee on the same date
      const existingAttendance = attendanceData.find(
        att => att.employee_id === employee.id && att.date === date
      );
      if (existingAttendance) {
        importStatus.mismatches.push({
          employeeName: employeeName,
          reason: `Data kehadiran untuk tanggal ${date} sudah ada.`,
        });
        continue;
      }

      // Check for duplicate absence record for the employee on the same date
      const existingAbsence = absencesData.find(
        abs => abs.employee_id === employee.id && abs.date === date
      );
      if (existingAbsence) {
        importStatus.mismatches.push({
          employeeName: employeeName,
          reason: `Data ketidakhadiran untuk tanggal ${date} sudah ada.`,
        });
        continue;
      }

      // Create attendance record (convert status to check_in/check_out)
      const checkIn = status.toLowerCase() === "absent" || status.toLowerCase() === "leave"
        ? null
        : new Date(`${date}T${status.toLowerCase() === "late" ? "09:15" : "08:00"}:00Z`).toISOString();
      const checkOut = status.toLowerCase() === "absent" || status.toLowerCase() === "leave"
        ? null
        : new Date(`${date}T17:00:00Z`).toISOString();

      const attendanceRecord: TablesInsert<"attendance"> = {
        employee_id: employee.id,
        date: date,
        check_in: checkIn,
        check_out: checkOut,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      attendanceRecords.push(attendanceRecord);

      // Create absence record if status is "absent" or "leave"
      if (status.toLowerCase() === "absent" || status.toLowerCase() === "leave") {
        const absenceRecord: TablesInsert<"absences"> = {
          employee_id: employee.id,
          date: date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        absenceRecords.push(absenceRecord);
      }

      // Collect unique dates for calendar events
      uniqueDates.add(date);
    }

    // Insert attendance records and get the inserted records with IDs
    let insertedAttendanceRecords: Tables<"attendance">[] = [];
    if (attendanceRecords.length > 0) {
      const { data: insertedData, error: attendanceError } = await supabase
        .from("attendance")
        .insert(attendanceRecords)
        .select();

      if (attendanceError) {
        importStatus.errors.push(`Gagal menyimpan data kehadiran: ${attendanceError.message}`);
        throw attendanceError;
      }

      insertedAttendanceRecords = insertedData || [];
    }

    // Insert absence records
    if (absenceRecords.length > 0) {
      const { error: absenceError } = await supabase
        .from("absences")
        .insert(absenceRecords);

      if (absenceError) {
        importStatus.errors.push(`Gagal menyimpan data ketidakhadiran: ${absenceError.message}`);
        throw absenceError;
      }
    }

    // Fetch updated absences for calendar event creation
    const startDate = "2025-04-01";
    const endDate = "2025-04-30";
    const { data: updatedAbsences, error: absencesFetchError } = await supabase
      .from("absences")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate);

    if (absencesFetchError) {
      importStatus.errors.push(`Gagal memuat data ketidakhadiran: ${absencesFetchError.message}`);
      throw absencesFetchError;
    }
    setAbsencesData(updatedAbsences as Tables<"absences">[] || []);

    // Create calendar events for each unique date
    for (const date of uniqueDates) {
      const dateRecords = insertedAttendanceRecords.filter(rec => rec.date === date);
      const dateAbsences = (updatedAbsences as Tables<"absences">[]).filter(abs => abs.date === date);
      const employeeIdsFromAttendance = new Set(dateRecords.map(rec => rec.employee_id));
      const employeeIdsFromAbsences = new Set(dateAbsences.map(abs => abs.employee_id));
      const allEmployeeIds = new Set([...employeeIdsFromAttendance, ...employeeIdsFromAbsences]);
      const employeesOnDate = employees.filter(emp => allEmployeeIds.has(emp.id));

      const summary = {
        totalPresent: dateRecords.filter(rec => computeStatus(rec.check_in, "present") === "present").length,
        totalAbsent: dateRecords.filter(rec => computeStatus(rec.check_in, "present") === "absent").length,
        totalLate: dateRecords.filter(rec => computeStatus(rec.check_in, "present") === "late").length,
        onLeave: dateAbsences.length, // Count absences as leave
      };

      // Calculate earliest check_in and latest check_out for the day, and track the corresponding attendance IDs
      const checkInRecords = dateRecords
        .filter(rec => rec.check_in)
        .map(rec => ({
          id: rec.id,
          time: new Date(rec.check_in!).getTime(),
        }));
      const checkOutRecords = dateRecords
        .filter(rec => rec.check_out)
        .map(rec => ({
          id: rec.id,
          time: new Date(rec.check_out!).getTime(),
        }));

      const earliestCheckInRecord = checkInRecords.length > 0
        ? checkInRecords.reduce((earliest, current) => (current.time < earliest.time ? current : earliest), checkInRecords[0])
        : null;
      const latestCheckOutRecord = checkOutRecords.length > 0
        ? checkOutRecords.reduce((latest, current) => (current.time > latest.time ? current : latest), checkOutRecords[0])
        : null;

      const earliestCheckIn = earliestCheckInRecord
        ? new Date(earliestCheckInRecord.time).toISOString()
        : null;
      const earliestCheckInAttendanceId = earliestCheckInRecord?.id || null;

      const latestCheckOut = latestCheckOutRecord
        ? new Date(latestCheckOutRecord.time).toISOString()
        : null;
      const latestCheckOutAttendanceId = latestCheckOutRecord?.id || null;

      const descriptionLines = [
        `Total Hadir: ${summary.totalPresent}`,
        `Total Tidak Hadir: ${summary.totalAbsent}`,
        `Total Terlambat: ${summary.totalLate}`,
        `Total Cuti/Ketidakhadiran: ${summary.onLeave}`,
        earliestCheckIn ? `Check-in Paling Awal: ${new Date(earliestCheckIn).toLocaleTimeString("id-ID")}` : "",
        latestCheckOut ? `Check-out Paling Akhir: ${new Date(latestCheckOut).toLocaleTimeString("id-ID")}` : "",
        "",
        "Detail Karyawan:",
        ...employeesOnDate.map(emp => {
          const isAbsent = dateAbsences.some(abs => abs.employee_id === emp.id);
          const attRecord = dateRecords.find(rec => rec.employee_id === emp.id);
          const status = isAbsent ? "Tidak Hadir/Cuti" : attRecord ? computeStatus(attRecord.check_in, "present") : "Tidak Ada Data";
          return `- ${emp.full_name} (${emp.department?.name || "Unknown"} - ${emp.position?.name || "Unknown"}): ${status}`;
        }),
      ].filter(line => line !== "");

      const calendarEvent: CalendarEvent = {
        title: `Rekap Kehadiran ${new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
        description: descriptionLines.join("\n"),
        event_type: "attendance",
        start_time: new Date(date).toISOString(),
        end_time: new Date(date).toISOString(),
        check_in: earliestCheckIn,
        check_out: latestCheckOut,
        earliest_check_in_attendance_id: earliestCheckInAttendanceId,
        latest_check_out_attendance_id: latestCheckOutAttendanceId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_synced: false,
      };
      calendarEvents.push(calendarEvent);
    }

    // Insert calendar events
    if (calendarEvents.length > 0) {
      const { error: calendarError } = await supabase
        .from("calendar_events")
        .insert(calendarEvents);

      if (calendarError) {
        importStatus.errors.push(`Gagal menyimpan event kalender: ${calendarError.message}`);
        throw calendarError;
      }
    }

    importStatus.successfulRecords = attendanceRecords.length;

    // Refresh attendance data
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
      const dayAbsences = (updatedAbsences as Tables<"absences">[]).filter(abs => abs.date === date);
      const summary: DailySummary = {
        date: new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
        totalPresent: dayRecords.filter(att => computeStatus(att.check_in, "present") === "present").length,
        totalAbsent: dayRecords.filter(att => computeStatus(att.check_in, "present") === "absent").length,
        totalLate: dayRecords.filter(att => computeStatus(att.check_in, "present") === "late").length,
        onLeave: dayAbsences.length,
        syncStatus: "Tersinkronisasi",
      };
      summaries.push(summary);
    });
    setDailySummaries(summaries);

    return importStatus;
  };

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
        if (!data) {
          toast({
            title: "Error",
            description: "Gagal membaca file.",
            variant: "destructive",
          });
          return;
        }

        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: unknown[] = XLSX.utils.sheet_to_json(worksheet);

        // Validate and filter the data
        const validData: AttendanceMachineRecord[] = [];
        const validationErrors: string[] = [];

        jsonData.forEach((row, index) => {
          if (isAttendanceMachineRecord(row)) {
            validData.push(row);
          } else {
            validationErrors.push(`Baris ${index + 1}: Format data tidak valid. Harus memiliki kolom Name, Date, dan Status dengan tipe string.`);
          }
        });

        if (validationErrors.length > 0) {
          toast({
            title: "Error",
            description: "Beberapa baris dalam file tidak valid.",
            variant: "destructive",
          });
          setImportStatus({
            timestamp: new Date().toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
            totalRecords: jsonData.length,
            successfulRecords: 0,
            errors: validationErrors,
            mismatches: [],
          });
          setIsImportDialogOpen(false);
          return;
        }

        if (validData.length === 0) {
          toast({
            title: "Error",
            description: "Tidak ada data valid untuk diimpor.",
            variant: "destructive",
          });
          setIsImportDialogOpen(false);
          return;
        }

        const importStatus = await processAttendanceRecords(validData);

        if (importStatus.successfulRecords > 0) {
          toast({
            title: "Sukses",
            description: `Berhasil mengimpor ${importStatus.successfulRecords} data kehadiran.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Info",
            description: "Tidak ada data baru untuk diimpor.",
            variant: "default",
          });
        }

        // Update import status
        setImportStatus(importStatus);
        setIsImportDialogOpen(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      console.error("Error importing attendance:", error);
      setImportStatus(prev => prev ? {
        ...prev,
        errors: [...prev.errors, `Kesalahan sistem: ${error.message}`],
      } : {
        timestamp: new Date().toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        totalRecords: 0,
        successfulRecords: 0,
        errors: [`Kesalahan sistem: ${error.message}`],
        mismatches: [],
      });
      toast({
        title: "Error",
        description: `Gagal mengimpor data kehadiran: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Handle sync with attendance machine API
  const handleSyncWithMachine = async () => {
    setIsSyncing(true);
    try {
      // Replace this with your actual API endpoint and authentication
      const response = await fetch("/api/attendance/sync", {
        method: "GET",
        headers: {
          "Authorization": "Bearer YOUR_API_TOKEN",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Gagal mengambil data dari mesin absensi: ${response.statusText}`);
      }

      const jsonData: AttendanceMachineRecord[] = await response.json();

      const importStatus = await processAttendanceRecords(jsonData);

      if (importStatus.successfulRecords > 0) {
        toast({
          title: "Sukses",
          description: `Berhasil menyinkronkan ${importStatus.successfulRecords} data kehadiran dari mesin.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Info",
          description: "Tidak ada data baru untuk disinkronkan.",
          variant: "default",
        });
      }

      setImportStatus(importStatus);
    } catch (error: any) {
      console.error("Error syncing with attendance machine:", error);
      setImportStatus({
        timestamp: new Date().toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        totalRecords: 0,
        successfulRecords: 0,
        errors: [`Gagal menyinkronkan dengan mesin absensi: ${error.message}`],
        mismatches: [],
      });
      toast({
        title: "Error",
        description: `Gagal menyinkronkan data kehadiran: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
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

      {/* Import Status Card */}
      {importStatus && (
        <Card className={importStatus.errors.length > 0 || importStatus.mismatches.length > 0 ? "border-red-500" : "border-green-500"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle size={16} className={importStatus.errors.length > 0 || importStatus.mismatches.length > 0 ? "text-red-500" : "text-green-500"} />
              Status Impor/Sinkronisasi Terakhir
            </CardTitle>
            <CardDescription>{importStatus.timestamp}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                Total Data: {importStatus.totalRecords} | Berhasil: {importStatus.successfulRecords}
              </p>
              {importStatus.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-600">Kesalahan:</p>
                  <ul className="list-disc list-inside text-sm text-red-600">
                    {importStatus.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {importStatus.mismatches.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-orange-600">Data Tidak Cocok:</p>
                  <ul className="list-disc list-inside text-sm text-orange-600">
                    {importStatus.mismatches.map((mismatch, index) => (
                      <li key={index}>
                        {mismatch.employeeName}: {mismatch.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {importStatus.errors.length === 0 && importStatus.mismatches.length === 0 && (
                <p className="text-sm text-green-600">Proses berhasil tanpa kesalahan.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
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
        
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={handleSyncWithMachine}
          disabled={isSyncing}
        >
          <Calendar size={16} />
          <span>{isSyncing ? "Menyinkronkan..." : "Sinkronisasi Kalendar"}</span>
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
                <TableHead>Cuti/Ketidakhadiran</TableHead>
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