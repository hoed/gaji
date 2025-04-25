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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calculator, FileSpreadsheet, Calendar, ArrowRight, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { format } from "date-fns";

// Define interface for enriched payroll (not a database table)
interface EnrichedPayroll extends Tables<"payroll"> {
  full_name: string;
}

// Define interface for employee data with additional fields
interface EmployeeData {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  incentive: number | null;
  transportation_fee: number | null;
  basic_salary: number | null;
}

export default function Payroll() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [payrollData, setPayrollData] = useState<EnrichedPayroll[]>([]);

  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Form state for payroll processing
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [basicSalary, setBasicSalary] = useState<number>(0);
  const [incentive, setIncentive] = useState<number>(0);
  const [transportationFee, setTransportationFee] = useState<number>(0);
  const [bpjsKesEmployee, setBpjsKesEmployee] = useState<number>(0);
  const [bpjsKesCompany, setBpjsKesCompany] = useState<number>(0);
  const [bpjsTkJhtEmployee, setBpjsTkJhtEmployee] = useState<number>(0);
  const [bpjsTkJhtCompany, setBpjsTkJhtCompany] = useState<number>(0);
  const [bpjsTkJkk, setBpjsTkJkk] = useState<number>(0);
  const [bpjsTkJkm, setBpjsTkJkm] = useState<number>(0);
  const [bpjsTkJpEmployee, setBpjsTkJpEmployee] = useState<number>(0);
  const [bpjsTkJpCompany, setBpjsTkJpCompany] = useState<number>(0);
  const [pph21, setPph21] = useState<number>(0);
  const [netSalary, setNetSalary] = useState<number>(0);

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

        // Enrich employees data with full_name
        const enrichedEmployees: EmployeeData[] = (employeesData || []).map(emp => ({
          ...emp,
          full_name: `${emp.first_name} ${emp.last_name || ""}`.trim(),
        }));
        setEmployees(enrichedEmployees);

        // Enrich payroll data with employee names
        const enrichedData: EnrichedPayroll[] = payrollData.map((payroll) => {
          const employee = enrichedEmployees.find((emp) => emp.id === payroll.employee_id);
          return {
            ...payroll,
            full_name: employee ? employee.full_name : "Unknown",
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

  // Determine the most recent period dynamically
  const mostRecentPeriod = payrollData.length > 0
    ? payrollData.reduce((latest, current) =>
        new Date(current.period_start) > new Date(latest.period_start) ? current : latest
      ).period_start
    : null;

  // Filter payroll data for the most recent period
  const recentPayroll = mostRecentPeriod
    ? payrollData.filter((p) => p.period_start === mostRecentPeriod)
    : [];

  // Calculate summary metrics for the most recent period
  const totalEmployees = new Set(recentPayroll.map((p) => p.employee_id)).size;
  const totalSalary = recentPayroll.reduce((sum, p) => sum + (p.basic_salary || 0), 0);
  const totalPPh21 = recentPayroll.reduce((sum, p) => sum + (p.pph21 || 0), 0);
  const totalBPJS = recentPayroll.reduce(
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

  // Format the most recent period for display
  const displayPeriod = mostRecentPeriod
    ? format(new Date(mostRecentPeriod), "MMMM yyyy")
    : "Tidak ada data";

  // Handle employee selection change
  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      const salary = employee.basic_salary ?? 0;
      const employeeIncentive = employee.incentive ?? 0;
      const employeeTransportationFee = employee.transportation_fee ?? 0;

      setBasicSalary(salary);
      setIncentive(employeeIncentive);
      setTransportationFee(employeeTransportationFee);

      // Recalculate BPJS contributions based on basic salary
      setBpjsKesEmployee(salary * 0.01); // 1% employee contribution
      setBpjsKesCompany(salary * 0.04); // 4% company contribution
      setBpjsTkJhtEmployee(salary * 0.02); // 2% employee contribution
      setBpjsTkJhtCompany(salary * 0.037); // 3.7% company contribution
      setBpjsTkJpEmployee(salary * 0.01); // 1% employee contribution
      setBpjsTkJpCompany(salary * 0.02); // 2% company contribution
      setBpjsTkJkk(salary * 0.0024); // 0.24% company contribution
      setBpjsTkJkm(salary * 0.003); // 0.3% company contribution

      // Recalculate PPh21 and net salary
      const allowances = employeeIncentive + employeeTransportationFee;
      const taxableIncome = (salary + allowances) * 12; // Annualize
      const newPph21 = taxableIncome <= 60000000 ? 0 : (taxableIncome * 0.05) / 12; // 5% tax if above 60M annually
      setPph21(newPph21);

      const deductions = (salary * 0.01) + (salary * 0.02) + (salary * 0.01) + newPph21;
      setNetSalary(salary + allowances - deductions);
    } else {
      setBasicSalary(0);
      setIncentive(0);
      setTransportationFee(0);
      setBpjsKesEmployee(0);
      setBpjsKesCompany(0);
      setBpjsTkJhtEmployee(0);
      setBpjsTkJhtCompany(0);
      setBpjsTkJkk(0);
      setBpjsTkJkm(0);
      setBpjsTkJpEmployee(0);
      setBpjsTkJpCompany(0);
      setPph21(0);
      setNetSalary(0);
    }
  };

  // Shared validation and record creation logic
  const validateAndCreatePayrollRecord = async (status: "pending" | "success") => {
    // Validate required fields
    if (!selectedPeriod) {
      toast({
        title: "Error",
        description: "Periode penggajian harus dipilih.",
        variant: "destructive",
      });
      return null;
    }
    if (!paymentDate) {
      toast({
        title: "Error",
        description: "Tanggal pembayaran harus diisi.",
        variant: "destructive",
      });
      return null;
    }
    if (!selectedEmployeeId) {
      toast({
        title: "Error",
        description: "Nama karyawan harus dipilih.",
        variant: "destructive",
      });
      return null;
    }
    if (basicSalary <= 0) {
      toast({
        title: "Error",
        description: "Gaji pokok harus lebih besar dari 0.",
        variant: "destructive",
      });
      return null;
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

    // Check if payroll already exists for this employee in the selected period
    const existingPayroll = payrollData.find(
      (p) =>
        p.period_start === periodStart &&
        p.period_end === periodEnd &&
        p.employee_id === selectedEmployeeId
    );
    if (existingPayroll) {
      toast({
        title: "Error",
        description: `Penggajian untuk karyawan ini pada periode ${format(new Date(periodStart), "MMMM yyyy")} sudah diproses.`,
        variant: "destructive",
      });
      return null;
    }

    // Prepare payroll record
    const payrollRecord: TablesInsert<"payroll"> = {
      employee_id: selectedEmployeeId,
      period_start: periodStart,
      period_end: periodEnd,
      basic_salary: basicSalary,
      allowances: incentive + transportationFee,
      bpjs_kes_employee: bpjsKesEmployee,
      bpjs_kes_company: bpjsKesCompany,
      bpjs_tk_jht_employee: bpjsTkJhtEmployee,
      bpjs_tk_jht_company: bpjsTkJhtCompany,
      bpjs_tk_jkk: bpjsTkJkk,
      bpjs_tk_jkm: bpjsTkJkm,
      bpjs_tk_jp_employee: bpjsTkJpEmployee,
      bpjs_tk_jp_company: bpjsTkJpCompany,
      pph21: pph21,
      net_salary: netSalary,
      payment_status: status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return { payrollRecord, periodStart };
  };

  // Refresh payroll data after save or process
  const refreshPayrollData = async () => {
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
  };

  // Handle payroll processing (status: success)
  const handleProcessPayroll = async () => {
    try {
      const result = await validateAndCreatePayrollRecord("success");
      if (!result) return;

      const { payrollRecord, periodStart } = result;

      // Insert payroll record into the database
      const { error: insertError } = await supabase
        .from("payroll")
        .insert([payrollRecord]);

      if (insertError) throw insertError;

      toast({
        title: "Sukses",
        description: `Penggajian untuk periode ${format(new Date(periodStart), "MMMM yyyy")} berhasil diproses.`,
        variant: "default",
      });

      // Refresh payroll data to update summary cards
      await refreshPayrollData();

      // Reset form and close dialog
      setIsDialogOpen(false);
      setSelectedPeriod("");
      setPaymentDate("");
      setSelectedEmployeeId("");
      setBasicSalary(0);
      setIncentive(0);
      setTransportationFee(0);
      setBpjsKesEmployee(0);
      setBpjsKesCompany(0);
      setBpjsTkJhtEmployee(0);
      setBpjsTkJhtCompany(0);
      setBpjsTkJkk(0);
      setBpjsTkJkm(0);
      setBpjsTkJpEmployee(0);
      setBpjsTkJpCompany(0);
      setPph21(0);
      setNetSalary(0);
    } catch (error: any) {
      console.error("Error processing payroll:", error);
      toast({
        title: "Error",
        description: `Gagal memproses penggajian: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Handle saving payroll (status: pending)
  const handleSavePayroll = async () => {
    try {
      const result = await validateAndCreatePayrollRecord("pending");
      if (!result) return;

      const { payrollRecord, periodStart } = result;

      // Insert payroll record into the database
      const { error: insertError } = await supabase
        .from("payroll")
        .insert([payrollRecord]);

      if (insertError) throw insertError;

      toast({
        title: "Sukses",
        description: `Penggajian untuk periode ${format(new Date(periodStart), "MMMM yyyy")} telah disimpan sebagai draft.`,
        variant: "default",
      });

      // Refresh payroll data to reflect the new entry
      await refreshPayrollData();

      // Reset employee-related fields to allow saving another record
      setSelectedEmployeeId("");
      setBasicSalary(0);
      setIncentive(0);
      setTransportationFee(0);
      setBpjsKesEmployee(0);
      setBpjsKesCompany(0);
      setBpjsTkJhtEmployee(0);
      setBpjsTkJhtCompany(0);
      setBpjsTkJkk(0);
      setBpjsTkJkm(0);
      setBpjsTkJpEmployee(0);
      setBpjsTkJpCompany(0);
      setPph21(0);
      setNetSalary(0);
    } catch (error: any) {
      console.error("Error saving payroll:", error);
      toast({
        title: "Error",
        description: `Gagal menyimpan penggajian: ${error.message}`,
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
            api_key_id: null,
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
  const handleExportToExcel = async () => {
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
          Status: row.payment_status === "success" ? "Selesai" : "Belum Diproses",
          "Jumlah Karyawan": periodEmployees,
          "Total Gaji": `Rp ${periodSalary.toLocaleString("id-ID")}`,
          "PPh 21": `Rp ${periodPPh21.toLocaleString("id-ID")}`,
          BPJS: `Rp ${periodBPJS.toLocaleString("id-ID")}`,
          "Gaji Bersih": `Rp ${periodNetSalary.toLocaleString("id-ID")}`,
        };
      });

      // Dynamically import XLSX and file-saver to avoid server-side issues
      const XLSX = await import("xlsx");
      const { saveAs } = await import("file-saver");

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

  // Handle import from Excel
  const handleImportFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) {
        toast({
          title: "Error",
          description: "Silakan pilih file Excel untuk diimpor.",
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

        // Map the imported data to the payroll table structure
        const payrollRecords: TablesInsert<"payroll">[] = jsonData.map((row: any) => {
          // Parse the period to determine period_start and period_end
          let periodStart: string, periodEnd: string;
          const period = row["Periode"];
          if (period === "April 2025") {
            periodStart = "2025-04-01";
            periodEnd = "2025-04-30";
          } else if (period === "Mei 2025") {
            periodStart = "2025-05-01";
            periodEnd = "2025-05-31";
          } else {
            throw new Error(`Periode tidak valid: ${period}`);
          }

          // Find employee ID based on full_name
          const employee = employees.find(emp => emp.full_name === row["Nama"]);
          if (!employee) {
            throw new Error(`Karyawan tidak ditemukan: ${row["Nama"]}`);
          }

          // Parse currency fields (remove "Rp " and commas)
          const parseCurrency = (value: string) => {
            if (!value) return 0;
            return Number(value.replace("Rp ", "").replace(/,/g, ""));
          };

          // Determine payment status
          const paymentStatus = row["Status"] === "Selesai" ? "success" : "pending";

          return {
            employee_id: employee.id,
            period_start: periodStart,
            period_end: periodEnd,
            basic_salary: employee.basic_salary ?? 0,
            allowances: (employee.incentive ?? 0) + (employee.transportation_fee ?? 0),
            bpjs_kes_employee: employee.basic_salary ? employee.basic_salary * 0.01 : 0,
            bpjs_kes_company: employee.basic_salary ? employee.basic_salary * 0.04 : 0,
            bpjs_tk_jht_employee: employee.basic_salary ? employee.basic_salary * 0.02 : 0,
            bpjs_tk_jht_company: employee.basic_salary ? employee.basic_salary * 0.037 : 0,
            bpjs_tk_jkk: employee.basic_salary ? employee.basic_salary * 0.0024 : 0,
            bpjs_tk_jkm: employee.basic_salary ? employee.basic_salary * 0.003 : 0,
            bpjs_tk_jp_employee: employee.basic_salary ? employee.basic_salary * 0.01 : 0,
            bpjs_tk_jp_company: employee.basic_salary ? employee.basic_salary * 0.02 : 0,
            pph21: parseCurrency(row["PPh 21"]),
            net_salary: parseCurrency(row["Gaji Bersih"]),
            payment_status: paymentStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        });

        // Insert records into the payroll table
        const { error: insertError } = await supabase
          .from("payroll")
          .insert(payrollRecords);

        if (insertError) throw insertError;

        // Refresh payroll data to reflect the new entries
        await refreshPayrollData();

        toast({
          title: "Sukses",
          description: "Data penggajian berhasil diimpor dari Excel.",
          variant: "default",
        });
      };
      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      console.error("Error importing from Excel:", error);
      toast({
        title: "Error",
        description: `Gagal mengimpor data dari Excel: ${error.message}`,
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
            <div className="text-2xl font-bold">{displayPeriod}</div>
            <p className="text-xs text-muted-foreground">
              {recentPayroll.length > 0
                ? recentPayroll[0].payment_status === "success"
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
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Proses Penggajian</DialogTitle>
                <DialogDescription>
                  Isi detail penggajian untuk karyawan
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid gap-2">
                  <Label htmlFor="period">Periode Penggajian</Label>
                  <Select
                    value={selectedPeriod}
                    onValueChange={setSelectedPeriod}
                  >
                    <SelectTrigger id="period">
                      <SelectValue placeholder="Pilih periode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="april2025">April 2025</SelectItem>
                      <SelectItem value="mei2025">Mei 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="payment-date">Tanggal Pembayaran</Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="employee">Nama Karyawan</Label>
                  <Select
                    value={selectedEmployeeId}
                    onValueChange={handleEmployeeChange}
                  >
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Pilih karyawan" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="basic-salary">Gaji Pokok (Rp)</Label>
                  <Input
                    id="basic-salary"
                    type="number"
                    value={basicSalary}
                    readOnly
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="incentive">Insentif (Rp)</Label>
                  <Input
                    id="incentive"
                    type="number"
                    value={incentive}
                    readOnly
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="transportation-fee">Biaya Transportasi (Rp)</Label>
                  <Input
                    id="transportation-fee"
                    type="number"
                    value={transportationFee}
                    readOnly
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bpjs-kes-employee">BPJS Kesehatan Karyawan (Rp)</Label>
                  <Input
                    id="bpjs-kes-employee"
                    type="number"
                    value={bpjsKesEmployee}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setBpjsKesEmployee(value);
                      const deductions = value + bpjsTkJhtEmployee + bpjsTkJpEmployee + pph21;
                      setNetSalary(basicSalary + incentive + transportationFee - deductions);
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bpjs-kes-company">BPJS Kesehatan Perusahaan (Rp)</Label>
                  <Input
                    id="bpjs-kes-company"
                    type="number"
                    value={bpjsKesCompany}
                    onChange={(e) => setBpjsKesCompany(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bpjs-tk-jht-employee">BPJS TK JHT Karyawan (Rp)</Label>
                  <Input
                    id="bpjs-tk-jht-employee"
                    type="number"
                    value={bpjsTkJhtEmployee}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setBpjsTkJhtEmployee(value);
                      const deductions = bpjsKesEmployee + value + bpjsTkJpEmployee + pph21;
                      setNetSalary(basicSalary + incentive + transportationFee - deductions);
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bpjs-tk-jht-company">BPJS TK JHT Perusahaan (Rp)</Label>
                  <Input
                    id="bpjs-tk-jht-company"
                    type="number"
                    value={bpjsTkJhtCompany}
                    onChange={(e) => setBpjsTkJhtCompany(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bpjs-tk-jkk">BPJS TK JKK (Rp)</Label>
                  <Input
                    id="bpjs-tk-jkk"
                    type="number"
                    value={bpjsTkJkk}
                    onChange={(e) => setBpjsTkJkk(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bpjs-tk-jkm">BPJS TK JKM (Rp)</Label>
                  <Input
                    id="bpjs-tk-jkm"
                    type="number"
                    value={bpjsTkJkm}
                    onChange={(e) => setBpjsTkJkm(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bpjs-tk-jp-employee">BPJS TK JP Karyawan (Rp)</Label>
                  <Input
                    id="bpjs-tk-jp-employee"
                    type="number"
                    value={bpjsTkJpEmployee}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setBpjsTkJpEmployee(value);
                      const deductions = bpjsKesEmployee + bpjsTkJhtEmployee + value + pph21;
                      setNetSalary(basicSalary + incentive + transportationFee - deductions);
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bpjs-tk-jp-company">BPJS TK JP Perusahaan (Rp)</Label>
                  <Input
                    id="bpjs-tk-jp-company"
                    type="number"
                    value={bpjsTkJpCompany}
                    onChange={(e) => setBpjsTkJpCompany(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pph21">PPh 21 (Rp)</Label>
                  <Input
                    id="pph21"
                    type="number"
                    value={pph21}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setPph21(value);
                      const deductions = bpjsKesEmployee + bpjsTkJhtEmployee + bpjsTkJpEmployee + value;
                      setNetSalary(basicSalary + incentive + transportationFee - deductions);
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="net-salary">Gaji Bersih (Rp)</Label>
                  <Input
                    id="net-salary"
                    type="number"
                    value={netSalary}
                    readOnly
                  />
                </div>
              </div>
              <DialogFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleSavePayroll}>
                    Simpan
                  </Button>
                  <Button onClick={handleProcessPayroll}>Proses Penggajian</Button>
                </div>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FileSpreadsheet size={16} />
                <span>Ekspor/Impor</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportToExcel}>
                Ekspor ke Excel
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleImportFromExcel}
                    className="hidden"
                  />
                  Impor dari Excel
                </label>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
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
                  <TableHead />
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
                          className={
                            row.payment_status === "success"
                              ? "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800"
                              : "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800"
                          }
                        >
                          {row.payment_status === "success" ? "Selesai" : "Belum Diproses"}
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