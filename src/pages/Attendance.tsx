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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Upload, Download, Search, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

// Define interface for daily summary (not a database table)
interface DailySummary {
  date: string;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  onLeave: number;
  syncStatus: string;
}

export default function Attendance() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState<Tables<"attendance">[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch attendance data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch attendance for April 2025
        const startDate = "2025-04-01";
        const endDate = "2025-04-30";
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate);

        if (attendanceError) throw attendanceError;
        setAttendanceData(attendanceData || []);

        // Aggregate daily summaries
        const summaries: DailySummary[] = [];
        const dates = [...new Set(attendanceData.map(att => att.date))].sort().reverse();
        dates.forEach(date => {
          const dayRecords = attendanceData.filter(att => att.date === date);
          const summary: DailySummary = {
            date: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            totalPresent: dayRecords.filter(att => att.status === 'present').length,
            totalAbsent: dayRecords.filter(att => att.status === 'absent').length,
            totalLate: dayRecords.filter(att => att.status === 'late').length,
            onLeave: dayRecords.filter(att => att.status === 'leave').length,
            syncStatus: "Tersinkronisasi", // Assume synced; adjust if sync status is tracked
          };
          summaries.push(summary);
        });
        setDailySummaries(summaries);

      } catch (error) {
        console.error('Error fetching data:', error);
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