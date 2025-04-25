/* src/pages/Payroll.tsx */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, FileSpreadsheet, Calendar, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Define interface for enriched payroll (not a database table)
interface EnrichedPayroll extends Tables<"payroll"> {
  full_name: string;
}

// Define interface for employee data with additional fields
interface EmployeeData {
  id: string;
  first_name: string;
  last_name: string;
  incentive: number | null;
  transportation_fee: number | null;
  basic_salary: number | null; // Added basic_salary
}

export default function Payroll() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [payrollData, setPayrollData] = useState<EnrichedPayroll[]>([]);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Form state for payroll processing
  const [selectedPeriod, setSelectedPeriod] = useState<string>("april2025");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Fetch payroll and employees data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch payroll data
        const { data: payrollData, error: payrollError } = await supabase
          .from("payroll")
          .select("*")
          .order("period_start", { ascending: false });

        if (payrollError) throw payrollError;

        // Fetch employees with incentive, transportation_fee, and basic_salary
        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select("id, first_name, last_name, incentive, transportation_fee, basic_salary");

        if (employeesError) throw employeesError;
        setEmployees(employeesData || []);

        // Enrich payroll data with employee names
        const enrichedData: EnrichedPayroll[] = payrollData.map((payroll) => {
          const employee = employeesData.find((emp) => emp.id === payroll.employee_id);
          return {
            ...payroll,
            full_name: employee ? `${employee.first_name} ${employee.last_name || ""}`.trim() : "Unknown",
          };
        });
        setPayrollData(enrichedData);
      } catch (error: any) {
        console.error("Error fetching payroll data:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data penggajian.",
          variant: "destructive",
        });
      } finally {
      setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  // Aggregate data for cards (April 2025)
  const aprilPayroll = payrollData.filter((p) => p.period_start.startsWith("2025-04"));
  const totalEmployees = new Set(aprilPayroll.map((p) => p.employee_id)).size;
  const totalSalary = aprilPayroll.reduce((sum, p) => sum + (p.basic_salary || 0), 0);
  const totalPPh21 = aprilPayroll.reduce((sum, p) => sum + (p.pph21 || 0), 0);
  const totalBPJS = aprilPayroll.reduce(
    (sum, p) =>
      sum +
      (p.bpjs_kes_employee || 0) +
      (p.bpjs_tk_jht_employee || 0) +
      (p.bpjs_tk_jp_employee || 0) +
      (p.bpjs_kes_company || 0) +
      (p.bpjs_tk_jht_company || 0) +
      (p.bpjs_tk_jp_company || 0) +
      (p.bpjs_tk_jkk || 0) +
      (p.bpjs_tk_jkm || 0),
    0
  );

  // Handle payroll processing
  const handleProcessPayroll = async () => {
    try {
      if (!paymentDate) {
        toast({
          title: "Error",
          description: "Tanggal pembayaran harus diisi.",
          variant: "destructive",
        });
        return;
      }

      // Determine period start and end dates based on selected period
      let periodStart: string, periodEnd: string;
      if (selectedPeriod === "april2025") {
        periodStart = "2025-04-01";
        periodEnd = "2025-04-30";
      } else if (selectedPeriod === "mei2025") {
        periodStart = "2025-05-01";
        periodEnd = "2025-05-31";
      } else {
        throw new Error("Periode tidak valid.");
      }

      // Check if payroll already exists for the period
      const existingPayroll = payrollData.filter(
        (p) => p.period_start === periodStart && p.period_end === periodEnd
      );
      if (existingPayroll.length > 0) {
        toast({
          title: "Error",
          description: `Penggajian untuk periode ${format(new Date(periodStart), "MMMM yyyy")} sudah diproses.`,
          variant: "destructive",
        });
        return;
      }

      // Calculate payroll for each employee
      const payrollRecords: TablesInsert<"payroll">[] = employees.map((employee) => {
        const basicSalary = employee.basic_salary ?? 0; // Use employee's basic_salary, default to 0 if null
        if (basicSalary === 0) {
          throw new Error(`Gaji pokok untuk karyawan ${employee.first_name} ${employee.last_name || ""} belum diatur.`);
        }

        const allowances = (employee.incentive || 0) + (employee.transportation_fee || 0);

        // BPJS Calculations (simplified percentages)
        const bpjsKesEmployee = basicSalary * 0.01; // 1% employee contribution
        const bpjsKesCompany = basicSalary * 0.04; // 4% company contribution
        const bpjsTkJhtEmployee = basicSalary * 0.02; // 2% employee contribution
        const bpjsTkJhtCompany = basicSalary * 0.037; // 3.7% company contribution
        const bpjsTkJpEmployee = basicSalary * 0.01; // 1% employee contribution
        const bpjsTkJpCompany = basicSalary * 0.02; // 2% company contribution
        const bpjsTkJkk = basicSalary * 0.0024; // 0.24% company contribution
        const bpjsTkJkm = basicSalary * 0.003; // 0.3% company contribution

        // PPh 21 Calculation (simplified)
        const taxableIncome = (basicSalary + allowances) * 12; // Annualize
        const pph21 = taxableIncome <= 60000000 ? 0 : (taxableIncome * 0.05) / 12; // 5% tax if above 60M annually

        // Net Salary
        const deductions =
          bpjsKesEmployee +
          bpjsTkJhtEmployee +
          bpjsTkJpEmployee +
          pph21;
        const netSalary = basicSalary + allowances - deductions;

        return {
          employee_id: employee.id,
          period_start: periodStart,
          period_end: periodEnd,
          basic_salary: basicSalary,
          allowances: allowances,
          bpjs_kes_employee: bpjsKesEmployee,
          bpjs_kes_company: bpjsKesCompany,
          bpjs_tk_jht_employee: bpjsTkJhtEmployee,
          bpjs_tk_jht_company: bpjsTkJhtCompany,
          bpjs_tk_jp_employee: bpjsTkJpEmployee,
          bpjs_tk_jp_company: bpjsTkJpCompany,
          bpjs_tk_jkk: bpjsTkJkk,
          bpjs_tk_jkm: bpjsTkJkm,
          pph21: pph21,
          net_salary: netSalary,
          payment_status: "paid",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      // Insert payroll records into the database
      const { error: insertError } = await supabase
        .from("payroll")
        .insert(payrollRecords);

      if (insertError) throw insertError;

      toast({
        title: "Sukses",
        description: `Penggajian untuk periode ${format(new Date(periodStart), "MMMM yyyy")} berhasil diproses.`,
        variant: "default",
      });

      // Refresh payroll data
      const { data: newPayrollData, error: fetchError } = await supabase
        .from("payroll")
        .select("*")
        .order("period_start", { ascending: false });

      if (fetchError) throw fetchError;

      const enrichedData: EnrichedPayroll[] = newPayrollData.map((payroll) => {
        const employee = employees.find((emp) => emp.id === payroll.employee_id);
        return {
          ...payroll,
          full_name: employee ? `${employee.first_name} ${employee.last_name || ""}`.trim() : "Unknown",
        };
      });
      setPayrollData(enrichedData);

      setIsDialogOpen(false);
      setPaymentDate("");
      setNotes("");
    } catch (error: any) {
      console.error("Error processing payroll:", error);
      toast({
        title: "Error",
        description: `Gagal memproses penggajian: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Handle calendar synchronization
  const handleSyncCalendar = async () => {
    try {
      // Fetch existing calendar events to avoid duplicates
      const { data: existingEvents, error: fetchError } = await supabase
        .from("calendar_events")
        .select("*");

      if (fetchError) throw fetchError;

      // Create calendar events for each payroll period
      const uniquePeriods = Array.from(
        new Set(
          payrollData.map(
            (p) => `${p.period_start}-${p.period_end}`
          )
        )
      );

      const calendarEvents: TablesInsert<"calendar_events">[] = uniquePeriods
        .map((period): TablesInsert<"calendar_events"> | null => {
          const [startDate, endDate] = period.split("-");
          const payrollForPeriod = payrollData.find(
            (p) => p.period_start === startDate && p.period_end === endDate
          );

          if (!payrollForPeriod) return null;

          // Skip if an event for this period already exists
          const periodDate = new Date(startDate);
          const eventExists = existingEvents.some(
            (event) =>
              event.title === `Penggajian ${format(periodDate, "MMMM yyyy")}` &&
              event.start_time.startsWith(startDate)
          );
          if (eventExists) return null;

          return {
            title: `Penggajian ${format(periodDate, "MMMM yyyy")}`,
            start_time: startDate,
            end_time: endDate,
            description: `Penggajian periode ${format(periodDate, "MMMM yyyy")} untuk ${new Set(payrollData.filter((p) => p.period_start === startDate).map((p) => p.employee_id)).size} karyawan.`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            api_key_id: null, // Adjust if you have an API key requirement
          };
        })
        .filter((event): event is TablesInsert<"calendar_events"> => event !== null);

      if (calendarEvents.length === 0) {
        toast({
          title: "Info",
          description: "Tidak ada periode baru untuk disinkronkan ke kalender.",
          variant: "default",
        });
        return;
      }

      // Insert calendar events
      const { error: insertError } = await supabase
        .from("calendar_events")
        .insert(calendarEvents);

      if (insertError) throw insertError;

      toast({
        title: "Sukses",
        description: "Sinkronisasi kalender berhasil.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error synchronizing calendar:", error);
      toast({
        title: "Error",
        description: `Gagal menyinkronkan kalender: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Handle export to Excel
  const handleExportToExcel = () => {
    try {
      // Prepare data for export by mapping the payroll data to a flat structure
      const exportData = payrollData.map((row) => {
        const periodEmployees = new Set(
          payrollData
            .filter((p) => p.period_start === row.period_start && p.period_end === row.period_end)
            .map((p) => p.employee_id)
        ).size;
        const periodSalary = payrollData
          .filter((p) => p.period_start === row.period_start && p.period_end === row.period_end)
          .reduce((sum, p) => sum + (p.basic_salary || 0), 0);
        const periodPPh21 = payrollData
          .filter((p) => p.period_start === row.period_start && p.period_end === row.period_end)
          .reduce((sum, p) => sum + (p.pph21 || 0), 0);
        const periodBPJS = payrollData
          .filter((p) => p.period_start === row.period_start && p.period_end === row.period_end)
          .reduce(
            (sum, p) =>
              sum +
              (p.bpjs_kes_employee || 0) +
              (p.bpjs_tk_jht_employee || 0) +
              (p.bpjs_tk_jp_employee || 0) +
              (p.bpjs_kes_company || 0) +
              (p.bpjs_tk_jht_company || 0) +
              (p.bpjs_tk_jp_company || 0) +
              (p.bpjs_tk_jkk || 0) +
              (p.bpjs_tk_jkm || 0),
            0
          );
        const periodNetSalary = payrollData
          .filter((p) => p.period_start === row.period_start && p.period_end === row.period_end)
          .reduce((sum, p) => sum + (p.net_salary || 0), 0);

        return {
          Nama: row.full_name,
          Periode: format(new Date(row.period_start), "MMMM yyyy"),
          Status: row.payment_status === "paid" ? "Selesai" : "Belum Diproses",
          "Jumlah Karyawan": periodEmployees,
          "Total Gaji": `Rp ${periodSalary.toLocaleString("id-ID")}`,
          "PPh 21": `Rp ${periodPPh21.toLocaleString("id-ID")}`,
          BPJS: `Rp ${periodBPJS.toLocaleString("id-ID")}`,
          "Gaji Bersih": `Rp ${periodNetSalary.toLocaleString("id-ID")}`,
        };
      });

      // Create a worksheet from the data
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Create a workbook and append the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");

      // Generate the Excel file as a buffer
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

      // Create a Blob for the file and trigger the download
      const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(blob, "payroll.xlsx");

      toast({
        title: "Sukses",
        description: "Data penggajian berhasil diekspor ke Excel.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Error",
        description: `Gagal mengekspor data ke Excel: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Penggajian</h1>
        <p className="text-muted-foreground">Kelola proses penggajian karyawan</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Periode Berjalan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">April 2025</div>
            <p className="text-xs text-muted-foreground">
              {aprilPayroll.length > 0
                ? aprilPayroll[0].payment_status === "paid"
                  ? "Selesai"
                  : "Belum Diproses"
                : "Belum Diproses"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Penggajian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalSalary.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground">{totalEmployees} karyawan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total PPh 21</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalPPh21.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground">
              {totalSalary > 0
                ? `${((totalPPh21 / totalSalary) * 100).toFixed(2)}% dari total gaji`
                : "0%"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total BPJS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalBPJS.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground">Kesehatan & Ketenagakerjaan</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:justify-between md:items-center">
        <div>
          <h2 className="text-xl font-semibold">Riwayat Penggajian</h2>
          <p className="text-muted-foreground">Data periode penggajian sebelumnya</p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Calculator size={16} />
                <span>Proses Penggajian</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Proses Penggajian</DialogTitle>
                <DialogDescription>
                  Proses penggajian untuk periode berikut
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Periode Penggajian</label>
                  <Select
                    value={selectedPeriod}
                    onValueChange={setSelectedPeriod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih periode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="april2025">April 2025</SelectItem>
                      <SelectItem value="mei2025">Mei 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Tanggal Pembayaran</label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Catatan</label>
                  <Input
                    placeholder="Catatan untuk penggajian periode ini"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleProcessPayroll}>Proses Penggajian</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleSyncCalendar}
          >
            <Calendar size={16} />
            <span>Sinkronisasi Kalender</span>
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExportToExcel}
          >
            <FileSpreadsheet size={16} />
            <span>Ekspor ke Excel</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <svg
                className="animate-spin h-8 w-8 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Jumlah Karyawan</TableHead>
                  <TableHead>Total Gaji</TableHead>
                  <TableHead>PPh 21</TableHead>
                  <TableHead>BPJS</TableHead>
                  <TableHead>Gaji Bersih</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollData.map((row) => {
                  const periodEmployees = new Set(
                    payrollData
                      .filter((p) => p.period_start === row.period_start && p.period_end === row.period_end)
                      .map((p) => p.employee_id)
                  ).size;
                  const periodSalary = payrollData
                    .filter((p) => p.period_start === row.period_start && p.period_end === row.period_end)
                    .reduce((sum, p) => sum + (p.basic_salary || 0), 0);
                  const periodPPh21 = payrollData
                    .filter((p) => p.period_start === row.period_start && p.period_end === row.period_end)
                    .reduce((sum, p) => sum + (p.pph21 || 0), 0);
                  const periodBPJS = payrollData
                    .filter((p) => p.period_start === row.period_start && p.period_end === row.period_end)
                    .reduce(
                      (sum, p) =>
                        sum +
                        (p.bpjs_kes_employee || 0) +
                        (p.bpjs_tk_jht_employee || 0) +
                        (p.bpjs_tk_jp_employee || 0) +
                        (p.bpjs_kes_company || 0) +
                        (p.bpjs_tk_jht_company || 0) +
                        (p.bpjs_tk_jp_company || 0) +
                        (p.bpjs_tk_jkk || 0) +
                        (p.bpjs_tk_jkm || 0),
                      0
                    );
                  const periodNetSalary = payrollData
                    .filter((p) => p.period_start === row.period_start && p.period_end === row.period_end)
                    .reduce((sum, p) => sum + (p.net_salary || 0), 0);

                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {format(new Date(row.period_start), "MMMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            row.payment_status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {row.payment_status === "paid" ? "Selesai" : "Belum Diproses"}
                        </span>
                      </TableCell>
                      <TableCell>{periodEmployees}</TableCell>
                      <TableCell>Rp {periodSalary.toLocaleString("id-ID")}</TableCell>
                      <TableCell>Rp {periodPPh21.toLocaleString("id-ID")}</TableCell>
                      <TableCell>Rp {periodBPJS.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="font-medium">
                        Rp {periodNetSalary.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}