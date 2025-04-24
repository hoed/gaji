
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, Calculator } from "lucide-react";
import { 
  ChartContainer,
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [summaryData, setSummaryData] = useState({
    totalEmployees: 0,
    totalSalary: 0,
    attendanceRate: 0,
    totalTax: 0
  });

  useEffect(() => {
    const fetchSummaryData = async () => {
      // Get total employees
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      // Get total salary from latest payroll
      const { data: payrollData } = await supabase
        .from('payroll')
        .select('net_salary')
        .order('created_at', { ascending: false })
        .limit(1);

      // Get attendance rate for current month
      const { data: attendanceData } = await supabase
        .from('attendance_summary')
        .select('present_days, total_days')
        .single();

      // Get total tax from latest payroll
      const { data: taxData } = await supabase
        .from('payroll')
        .select('pph21')
        .order('created_at', { ascending: false })
        .limit(1);

      const totalSalary = payrollData?.[0]?.net_salary || 0;
      const attendanceRate = attendanceData ? 
        (attendanceData.present_days / attendanceData.total_days) * 100 : 0;
      const totalTax = taxData?.[0]?.pph21 || 0;

      setSummaryData({
        totalEmployees: employeeCount || 0,
        totalSalary,
        attendanceRate,
        totalTax
      });
    };

    fetchSummaryData();
  }, []);

  const summaryCards = [
    {
      title: "Total Karyawan",
      value: summaryData.totalEmployees.toString(),
      description: "Aktif bulan ini",
      icon: Users,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Total Penggajian",
      value: `Rp ${(summaryData.totalSalary / 1000000).toFixed(1)}jt`,
      description: "Bulan April 2025",
      icon: Calculator,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Kehadiran",
      value: `${summaryData.attendanceRate.toFixed(0)}%`,
      description: "Tingkat kehadiran",
      icon: Calendar,
      color: "bg-amber-100 text-amber-700",
    },
    {
      title: "Pajak PPh 21",
      value: `Rp ${(summaryData.totalTax / 1000000).toFixed(1)}jt`,
      description: "Bulan April 2025",
      icon: FileText,
      color: "bg-purple-100 text-purple-700",
    },
  ];

  const upcomingEvents = [
    {
      title: "Pembayaran Gaji",
      date: "25 April 2025",
      status: "upcoming",
    },
    {
      title: "Pembayaran PPh 21",
      date: "10 Mei 2025",
      status: "upcoming",
    },
    {
      title: "Pembayaran BPJS Kesehatan",
      date: "10 Mei 2025", 
      status: "upcoming",
    },
    {
      title: "Pembayaran BPJS Ketenagakerjaan",
      date: "15 Mei 2025",
      status: "upcoming",
    },
  ];

  // Chart data for attendance
  const attendanceData = [
    { month: "Jan", present: 92, absent: 5, leave: 3 },
    { month: "Feb", present: 94, absent: 3, leave: 3 },
    { month: "Mar", present: 90, absent: 7, leave: 3 },
    { month: "Apr", present: 95, absent: 2, leave: 3 },
  ];

  // Chart data for salary distribution
  const salaryDistributionData = [
    { department: "HR", salary: 23000000 },
    { department: "Finance", salary: 25000000 },
    { department: "IT", salary: 30000000 },
    { department: "Ops", salary: 21500000 },
    { department: "Marketing", salary: 23000000 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <ChartTooltipContent className="bg-white shadow-md border border-gray-200">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </ChartTooltipContent>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang di Gaji Kita Selaras</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </div>
                <div className={`p-2 rounded-full ${card.color}`}>
                  <card.icon size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agenda Mendatang</CardTitle>
            <CardDescription>Jadwal pembayaran dan kewajiban perusahaan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.title} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="warning">Mendatang</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan BPJS</CardTitle>
            <CardDescription>Kontribusi BPJS bulan April 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between">
                  <p className="text-sm font-medium">BPJS Kesehatan</p>
                  <p className="text-sm font-medium">Rp 4.250.000</p>
                </div>
                <p className="text-xs text-muted-foreground">Kontribusi perusahaan (4%)</p>
              </div>
              <div>
                <div className="flex justify-between">
                  <p className="text-sm font-medium">BPJS Kesehatan</p>
                  <p className="text-sm font-medium">Rp 2.125.000</p>
                </div>
                <p className="text-xs text-muted-foreground">Kontribusi karyawan (1%)</p>
              </div>
              <div>
                <div className="flex justify-between">
                  <p className="text-sm font-medium">BPJS Ketenagakerjaan</p>
                  <p className="text-sm font-medium">Rp 8.500.000</p>
                </div>
                <p className="text-xs text-muted-foreground">Total kontribusi (3.7% + 2%)</p>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <p className="font-medium">Total BPJS</p>
                  <p className="font-medium">Rp 14.875.000</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kehadiran Karyawan</CardTitle>
            <CardDescription>Tren kehadiran 4 bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="aspect-[4/3]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={CustomTooltip} />
                  <Legend />
                  <Bar dataKey="present" name="Hadir" fill="#4ade80" />
                  <Bar dataKey="absent" name="Absen" fill="#f87171" />
                  <Bar dataKey="leave" name="Cuti" fill="#fbbf24" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Gaji per Departemen</CardTitle>
            <CardDescription>Distribusi gaji April 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="aspect-[4/3]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salaryDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip content={CustomTooltip} />
                  <Legend />
                  <Bar dataKey="salary" name="Total Gaji (Rp)" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
