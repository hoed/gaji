/* src/pages/Dashboard.tsx */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AttendanceData {
  month: string;
  attendance_count: number;
}

interface SalaryByDepartment {
  department: string;
  total_salary: number;
}

interface BPJSSummary {
  bpjs_kesehatan: number;
  bpjs_ketenagakerjaan: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
}

interface EmployeeWithDepartment {
  id: string;
  department_id: string | null;
}

export default function Dashboard() {
  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [totalPayroll, setTotalPayroll] = useState<number>(0);
  const [pph21, setPph21] = useState<number>(0);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [bpjsSummary, setBpjsSummary] = useState<BPJSSummary>({ bpjs_kesehatan: 0, bpjs_ketenagakerjaan: 0 });
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [salaryByDepartment, setSalaryByDepartment] = useState<SalaryByDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Silakan login untuk mengakses dashboard.");
        setIsLoading(false);
        return;
      }
      fetchDashboardData();
    };

    checkSession();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch total employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("id", { count: "exact" });
      if (employeesError) throw employeesError;
      setTotalEmployees(employeesData.length);

      // Fetch total payroll for April 2025
      const { data: payrollData, error: payrollError } = await supabase
        .from("payroll")
        .select("net_salary, pph21")
        .gte("period_start", "2025-04-01")
        .lte("period_end", "2025-04-30");
      if (payrollError) throw payrollError;
      const totalPayrollSum = payrollData.reduce((sum, record) => sum + (record.net_salary || 0), 0);
      const totalPph21 = payrollData.reduce((sum, record) => sum + (record.pph21 || 0), 0);
      setTotalPayroll(totalPayrollSum);
      setPph21(totalPph21);

      // Fetch upcoming events
      const { data: eventsData, error: eventsError } = await supabase
        .from("calendar_events")
        .select("id, title, start_time")
        .gt("start_time", "2025-04-25")
        .order("start_time", { ascending: true });
      if (eventsError) throw eventsError;
      setUpcomingEvents(eventsData);

      // Fetch BPJS summary for April 2025
      const { data: bpjsData, error: bpjsError } = await supabase
        .from("payroll")
        .select("bpjs_kes_employee, bpjs_kes_company, bpjs_tk_jht_employee, bpjs_tk_jht_company, bpjs_tk_jkk, bpjs_tk_jkm, bpjs_tk_jp_employee, bpjs_tk_jp_company")
        .gte("period_start", "2025-04-01")
        .lte("period_end", "2025-04-30");
      if (bpjsError) throw bpjsError;
      const bpjsKesehatan = bpjsData.reduce(
        (sum, record) => sum + (record.bpjs_kes_employee || 0) + (record.bpjs_kes_company || 0),
        0
      );
      const bpjsKetenagakerjaan = bpjsData.reduce(
        (sum, record) =>
          sum +
          (record.bpjs_tk_jht_employee || 0) +
          (record.bpjs_tk_jht_company || 0) +
          (record.bpjs_tk_jkk || 0) +
          (record.bpjs_tk_jkm || 0) +
          (record.bpjs_tk_jp_employee || 0) +
          (record.bpjs_tk_jp_company || 0),
        0
      );
      setBpjsSummary({ bpjs_kesehatan: bpjsKesehatan, bpjs_ketenagakerjaan: bpjsKetenagakerjaan });

      // Fetch attendance data for the last 4 months
      const { data: attendanceRaw, error: attendanceError } = await supabase
        .from("attendance")
        .select("date")
        .gte("date", "2025-01-01")
        .lte("date", "2025-04-30");
      if (attendanceError) throw attendanceError;
      const attendanceByMonth: { [key: string]: number } = {};
      attendanceRaw.forEach(record => {
        const month = new Date(record.date).toLocaleString("id-ID", { month: "short" });
        attendanceByMonth[month] = (attendanceByMonth[month] || 0) + 1;
      });
      const attendanceFormatted = Object.keys(attendanceByMonth).map(month => ({
        month,
        attendance_count: attendanceByMonth[month],
      }));
      setAttendanceData(attendanceFormatted);

      // Fetch salary by department for April 2025
      const { data: salaryData, error: salaryError } = await supabase
        .from("payroll")
        .select("net_salary, employee_id")
        .gte("period_start", "2025-04-01")
        .lte("period_end", "2025-04-30");
      if (salaryError) throw salaryError;

      const { data: employeesWithDept, error: empDeptError } = await supabase
        .from("employees")
        .select("id, department_id")
        .in("id", salaryData.map(record => record.employee_id));
      if (empDeptError) throw empDeptError;

      // Safer type assertion
      if (!employeesWithDept) {
        throw new Error("No employee data found");
      }
      const employeesWithDeptTyped = employeesWithDept as unknown as EmployeeWithDepartment[];

      const { data: departmentsData, error: deptError } = await supabase
        .from("departments")
        .select("id, name");
      if (deptError) throw deptError;

      const salaryByDeptMap: { [key: string]: number } = {};
      salaryData.forEach(record => {
        const employee = employeesWithDeptTyped.find(emp => emp.id === record.employee_id);
        if (employee && employee.department_id) {
          const dept = departmentsData.find(d => d.id === employee.department_id);
          const deptName = dept ? dept.name : "Unknown";
          salaryByDeptMap[deptName] = (salaryByDeptMap[deptName] || 0) + (record.net_salary || 0);
        }
      });
      const salaryByDeptFormatted = Object.keys(salaryByDeptMap).map(dept => ({
        department: dept,
        total_salary: salaryByDeptMap[dept],
      }));
      setSalaryByDepartment(salaryByDeptFormatted);

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error(`Gagal memuat data dashboard: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Kita</h1>
        <p className="text-muted-foreground">Selamat datang di Gaji Kita Seterus</p>
      </div>

      {/* Top Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Karyawan</CardTitle>
            <CardDescription>{totalEmployees} Karyawan saat ini</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Penggajian</CardTitle>
            <CardDescription>
              Rp {(totalPayroll / 1_000_000).toFixed(1)} Jt Bulan April 2025
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Iuran BPJS</CardTitle>
            <CardDescription>0% Iuran</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pajak PPh 21</CardTitle>
            <CardDescription>
              Rp {(pph21 / 1_000_000).toFixed(1)} Jt bulan terakhir
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Agenda */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agenda Mendatang</CardTitle>
            <CardDescription>Jadwal pembayaran dan kewajiban perusahaan</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {upcomingEvents.map(event => (
                <li key={event.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {new Date(event.start_time).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      {event.title}
                    </p>
                  </div>
                  <span className="text-yellow-600 font-medium">Mendatang</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* BPJS Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ringkasan BPJS</CardTitle>
            <CardDescription>Kontribusi BPJS Bulan April 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span>BPJS Kesehatan</span>
                <span>Rp {bpjsSummary.bpjs_kesehatan.toLocaleString("id-ID")}</span>
              </li>
              <li className="flex justify-between">
                <span>BPJS Kesehatan (4%)</span>
                <span>Rp {(bpjsSummary.bpjs_kesehatan * 0.04).toLocaleString("id-ID")}</span>
              </li>
              <li className="flex justify-between">
                <span>BPJS Ketenagakerjaan (7%)</span>
                <span>Rp {(bpjsSummary.bpjs_ketenagakerjaan * 0.07).toLocaleString("id-ID")}</span>
              </li>
              <li className="flex justify-between font-bold">
                <span>Total BPJS</span>
                <span>Rp {(bpjsSummary.bpjs_kesehatan + bpjsSummary.bpjs_ketenagakerjaan).toLocaleString("id-ID")}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Employee Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kehadiran Karyawan</CardTitle>
            <CardDescription>Kehadiran bulanan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="attendance_count" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Salary by Department Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Gaji per Departemen</CardTitle>
            <CardDescription>Distribusi gaji April 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salaryByDepartment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis domain={[0, 300000000]} tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString("id-ID")}`} />
                <Bar dataKey="total_salary" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}