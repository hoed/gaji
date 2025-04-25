/* src/pages/Reports.tsx */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Reports() {
  const [reportType, setReportType] = useState<"payroll" | "attendance" | "employee">("payroll");
  const [month, setMonth] = useState<string>("2025-04");
  const [isLoading, setIsLoading] = useState(false);
  const [summaryData, setSummaryData] = useState({
    totalPayroll: 0,
    totalPph21: 0,
    totalBpjs: 0,
    employeeCount: 0,
    attendanceCount: 0,
  });
  const [departmentDistribution, setDepartmentDistribution] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Silakan login untuk mengakses laporan.");
      }
    };
    checkSession();
    fetchSummaryData();
    fetchDepartmentDistribution();
  }, [month]);

  const fetchSummaryData = async () => {
    try {
      const [year, monthNum] = month.split("-");
      const startDate = `${year}-${monthNum}-01`;
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split("T")[0];

      // Fetch payroll summary
      const { data: payrollData, error: payrollError } = await supabase
        .from("payroll")
        .select("net_salary, pph21, bpjs_kes_employee, bpjs_kes_company, bpjs_tk_jht_employee, bpjs_tk_jht_company, bpjs_tk_jkk, bpjs_tk_jkm, bpjs_tk_jp_employee, bpjs_tk_jp_company")
        .gte("period_start", startDate)
        .lte("period_end", endDate);

      if (payrollError) throw payrollError;

      const totalPayroll = payrollData?.reduce((sum: number, record: any) => sum + (record.net_salary || 0), 0) || 0;
      const totalPph21 = payrollData?.reduce((sum: number, record: any) => sum + (record.pph21 || 0), 0) || 0;
      const totalBpjs = payrollData?.reduce((sum: number, record: any) => {
        return sum + 
          (record.bpjs_kes_employee || 0) +
          (record.bpjs_kes_company || 0) +
          (record.bpjs_tk_jht_employee || 0) +
          (record.bpjs_tk_jht_company || 0) +
          (record.bpjs_tk_jkk || 0) +
          (record.bpjs_tk_jkm || 0) +
          (record.bpjs_tk_jp_employee || 0) +
          (record.bpjs_tk_jp_company || 0);
      }, 0) || 0;

      // Fetch employee count
      const { count: employeeCount, error: employeeError } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });

      if (employeeError) throw employeeError;

      // Fetch attendance count for the month
      const { count: attendanceCount, error: attendanceError } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .gte("date", startDate)
        .lte("date", endDate);

      if (attendanceError) throw attendanceError;

      setSummaryData({
        totalPayroll,
        totalPph21,
        totalBpjs,
        employeeCount: employeeCount || 0,
        attendanceCount: attendanceCount || 0,
      });
    } catch (error: any) {
      toast.error(`Gagal mengambil data ringkasan: ${error.message}`);
    }
  };

  const fetchDepartmentDistribution = async () => {
    try {
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("department_id, departments(name)");

      if (employeesError) throw employeesError;

      const distribution: { [key: string]: number } = {};
      employeesData.forEach((employee: any) => {
        const deptName = employee.departments?.name || "Unknown";
        distribution[deptName] = (distribution[deptName] || 0) + 1;
      });

      setDepartmentDistribution(distribution);
    } catch (error: any) {
      toast.error(`Gagal mengambil distribusi departemen: ${error.message}`);
    }
  };

  const fetchPayrollReport = async () => {
    setIsLoading(true);
    try {
      const [year, monthNum] = month.split("-");
      const startDate = `${year}-${monthNum}-01`;
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split("T")[0];

      const { data: payrollData, error: payrollError } = await supabase
        .from("payroll")
        .select("*")
        .gte("period_start", startDate)
        .lte("period_end", endDate);

      if (payrollError) throw payrollError;
      if (!payrollData || payrollData.length === 0) {
        toast.info("Tidak ada data penggajian untuk periode ini.");
        return;
      }

      const employeeIds = payrollData.map((record: Tables<"payroll">) => record.employee_id);
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*, positions(name)")
        .in("id", employeeIds);

      if (employeesError) throw employeesError;

      const { data: departmentsData, error: departmentsError } = await supabase
        .from("departments")
        .select("id, name");

      if (departmentsError) throw departmentsError;

      const csvRows = [
        [
          "Employee Name",
          "Department",
          "Position",
          "Basic Salary",
          "Net Salary",
          "PPh 21",
          "BPJS Kesehatan (Employee)",
          "BPJS Kesehatan (Company)",
          "BPJS TK JHT (Employee)",
          "BPJS TK JHT (Company)",
          "BPJS TK JKK",
          "BPJS TK JKM",
          "BPJS TK JP (Employee)",
          "BPJS TK JP (Company)",
          "Bank Name",
          "Bank Account",
          "Period Start",
          "Period End",
        ],
      ];

      payrollData.forEach((record: Tables<"payroll">) => {
        const employee = employeesData.find((emp: any) => emp.id === record.employee_id);
        const department = departmentsData.find((dept: Tables<"departments">) => dept.id === employee?.department_id);
        const positionName = employee?.positions?.name || "Unknown";

        csvRows.push([
          `${employee?.first_name} ${employee?.last_name || ""}`,
          department?.name || "Unknown",
          positionName,
          record.basic_salary?.toString() || "0",
          record.net_salary?.toString() || "0",
          record.pph21?.toString() || "0",
          record.bpjs_kes_employee?.toString() || "0",
          record.bpjs_kes_company?.toString() || "0",
          record.bpjs_tk_jht_employee?.toString() || "0",
          record.bpjs_tk_jht_company?.toString() || "0",
          record.bpjs_tk_jkk?.toString() || "0",
          record.bpjs_tk_jkm?.toString() || "0",
          record.bpjs_tk_jp_employee?.toString() || "0",
          record.bpjs_tk_jp_company?.toString() || "0",
          employee?.bank_name || "N/A",
          employee?.bank_account || "N/A",
          record.period_start || "",
          record.period_end || "",
        ]);
      });

      downloadCSV(csvRows, `payroll_report_${month}.csv`);
    } catch (error: any) {
      toast.error(`Gagal mengambil laporan penggajian: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendanceReport = async () => {
    setIsLoading(true);
    try {
      const [year, monthNum] = month.split("-");
      const startDate = `${year}-${monthNum}-01`;
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split("T")[0];

      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate);

      if (attendanceError) throw attendanceError;
      if (!attendanceData || attendanceData.length === 0) {
        toast.info("Tidak ada data kehadiran untuk periode ini.");
        return;
      }

      const employeeIds = attendanceData.map((record: Tables<"attendance">) => record.employee_id);
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .in("id", employeeIds);

      if (employeesError) throw employeesError;

      const csvRows = [
        ["Employee Name", "Date", "Check In", "Check Out"],
      ];

      attendanceData.forEach((record: Tables<"attendance">) => {
        const employee = employeesData.find((emp: Tables<"employees">) => emp.id === record.employee_id);
        csvRows.push([
          `${employee?.first_name} ${employee?.last_name || ""}`,
          record.date || "",
          record.check_in || "",
          record.check_out || "",
        ]);
      });

      downloadCSV(csvRows, `attendance_report_${month}.csv`);
    } catch (error: any) {
      toast.error(`Gagal mengambil laporan kehadiran: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployeeReport = async () => {
    setIsLoading(true);
    try {
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*, positions(name), departments(name)");

      if (employeesError) throw employeesError;
      if (!employeesData || employeesData.length === 0) {
        toast.info("Tidak ada data karyawan.");
        return;
      }

      const csvRows = [
        [
          "Employee Name",
          "Email",
          "Phone",
          "Department",
          "Position",
          "Hire Date",
          "Birth Date",
        ],
      ];

      employeesData.forEach((employee: any) => {
        const positionName = employee.positions?.name || "Unknown";
        const departmentName = employee.departments?.name || "Unknown";
        csvRows.push([
          `${employee.first_name} ${employee.last_name || ""}`,
          employee.email || "",
          employee.phone || "",
          departmentName,
          positionName,
          employee.hire_date || "",
          employee.birth_date || "",
        ]);
      });

      downloadCSV(csvRows, `employee_report_${month}.csv`);
    } catch (error: any) {
      toast.error(`Gagal mengambil laporan karyawan: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = (rows: string[][], filename: string) => {
    const csvContent = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateReport = () => {
    if (reportType === "payroll") {
      fetchPayrollReport();
    } else if (reportType === "attendance") {
      fetchAttendanceReport();
    } else if (reportType === "employee") {
      fetchEmployeeReport();
    }
  };

  // Bar Chart Data (Payroll Breakdown)
  const barChartData = {
    labels: ["Net Salary", "PPh 21", "Total BPJS"],
    datasets: [
      {
        label: "Amount (IDR)",
        data: [summaryData.totalPayroll, summaryData.totalPph21, summaryData.totalBpjs],
        backgroundColor: ["#4CAF50", "#F44336", "#2196F3"],
        borderColor: ["#388E3C", "#D32F2F", "#1976D2"],
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: `Payroll Breakdown for ${month}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount (IDR)",
        },
      },
    },
  };

  // Pie Chart Data (Department Distribution)
  const pieChartData = {
    labels: Object.keys(departmentDistribution),
    datasets: [
      {
        label: "Employees",
        data: Object.values(departmentDistribution),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ],
        borderColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Employee Distribution by Department",
      },
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Laporan</h1>
        <p className="text-muted-foreground">Ringkasan dan laporan untuk penggajian, kehadiran, dan kary 

kapan saja, dan karyawan.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Penggajian</CardTitle>
            <CardDescription>Periode {month}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summaryData.totalPayroll.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total PPh 21</CardTitle>
            <CardDescription>Periode {month}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summaryData.totalPph21.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total BPJS</CardTitle>
            <CardDescription>Periode {month}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summaryData.totalBpjs.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jumlah Karyawan</CardTitle>
            <CardDescription>Total Aktif</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summaryData.employeeCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rekaman Kehadiran</CardTitle>
            <CardDescription>Periode {month}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summaryData.attendanceCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Breakdown Penggajian</CardTitle>
            <CardDescription>Periode {month}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Karyawan per Departemen</CardTitle>
            <CardDescription>Total Karyawan: {summaryData.employeeCount}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 flex justify-center">
              <div className="w-80">
                <Pie data={pieChartData} options={pieChartOptions} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Generation Section */}
      <Card>
        <CardHeader>
          <CardTitle>Buat Laporan</CardTitle>
          <CardDescription>Pilih jenis laporan dan periode untuk menghasilkan laporan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reportType">Jenis Laporan</Label>
              <Select
                value={reportType}
                onValueChange={(value: "payroll" | "attendance" | "employee") => setReportType(value)}
              >
                <SelectTrigger id="reportType">
                  <SelectValue placeholder="Pilih jenis laporan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payroll">Penggajian</SelectItem>
                  <SelectItem value="attendance">Kehadiran</SelectItem>
                  <SelectItem value="employee">Karyawan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month">Periode (Bulan)</Label>
              <Input
                id="month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>

            <Button onClick={handleGenerateReport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
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
                  Memproses...
                </>
              ) : (
                "Hasilkan dan Unduh Laporan"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}