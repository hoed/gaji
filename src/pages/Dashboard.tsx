import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Users, Calendar, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { Line } from "recharts";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPayroll: 0,
    attendanceRate: 0,
    pendingPayments: 0,
    trends: [] as { date: string; value: number }[]
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Get employee count
        const { count: employeeCount } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true });

        // Get total payroll amount for current month
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const { data: payrollData } = await supabase
          .from('payroll')
          .select('net_salary')
          .gte('period_start', firstDayOfMonth.toISOString().split('T')[0])
          .lte('period_end', lastDayOfMonth.toISOString().split('T')[0]);
        
        const totalPayroll = payrollData?.reduce((sum, item) => sum + (item.net_salary || 0), 0) || 0;

        // Get attendance data
        const today = new Date().toISOString().split('T')[0];
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('status')
          .eq('date', today);

        const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
        const attendanceRate = employeeCount ? Math.round((presentCount / employeeCount) * 100) : 0;

        // Get pending payments
        const { data: pendingPayments } = await supabase
          .from('payroll')
          .select('id')
          .eq('payment_status', 'pending')
          .is('payment_date', null);

        // Get trend data (last 6 months of payroll)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: trendData } = await supabase
          .from('payroll')
          .select('period_start, net_salary')
          .gte('period_start', sixMonthsAgo.toISOString().split('T')[0])
          .order('period_start', { ascending: true });

        // Aggregate trend data by month
        const trendsByMonth: Record<string, number> = {};
        
        trendData?.forEach(item => {
          const month = item.period_start.substring(0, 7); // YYYY-MM format
          trendsByMonth[month] = (trendsByMonth[month] || 0) + (item.net_salary || 0);
        });

        const trendArray = Object.entries(trendsByMonth).map(([date, value]) => ({
          date, 
          value
        }));

        setStats({
          totalEmployees: employeeCount || 0,
          totalPayroll,
          attendanceRate,
          pendingPayments: pendingPayments?.length || 0,
          trends: trendArray
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Create chart data for trend visualization
  const chartData = stats.trends.map(trend => ({
    date: trend.date,
    value: trend.value
  }));

  const chartConfig = {
    payroll: {
      label: "Total Payroll",
      theme: {
        light: "hsl(var(--primary))",
        dark: "hsl(var(--primary))",
      },
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan informasi karyawan, penggajian, dan kehadiran
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Karyawan
                </p>
                {isLoading ? (
                  <div className="h-7 w-12 bg-muted/40 animate-pulse rounded-md mt-1"></div>
                ) : (
                  <h3 className="text-2xl font-bold">{stats.totalEmployees}</h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Penggajian
                </p>
                {isLoading ? (
                  <div className="h-7 w-24 bg-muted/40 animate-pulse rounded-md mt-1"></div>
                ) : (
                  <h3 className="text-2xl font-bold">Rp {stats.totalPayroll.toLocaleString("id-ID")}</h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tingkat Kehadiran
                </p>
                {isLoading ? (
                  <div className="h-7 w-14 bg-muted/40 animate-pulse rounded-md mt-1"></div>
                ) : (
                  <h3 className="text-2xl font-bold">{stats.attendanceRate}%</h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pembayaran Pending
                </p>
                {isLoading ? (
                  <div className="h-7 w-12 bg-muted/40 animate-pulse rounded-md mt-1"></div>
                ) : (
                  <h3 className="text-2xl font-bold">{stats.pendingPayments}</h3>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tren Penggajian</CardTitle>
              <CardDescription>
                Total penggajian 6 bulan terakhir
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-72 w-full bg-muted/20 animate-pulse rounded-md"></div>
              ) : stats.trends.length > 0 ? (
                <div className="h-72">
                  <ChartContainer
                    config={chartConfig}
                    className="h-full"
                  >
                    {/* Wrapping Line component in a fragment */}
                    <>
                      <Line
                        data={chartData}
                        dataKey="value"
                        name="payroll"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 6,
                          style: { fill: "hsl(var(--primary))" }
                        }}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelKey="date"
                            labelFormatter={(value) => {
                              const [year, month] = value.split('-');
                              return `${month}/${year.substring(2)}`;
                            }}
                            formatter={(value) => `Rp${value.toLocaleString('id-ID')}`}
                          />
                        }
                      />
                    </>
                  </ChartContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-muted-foreground">
                  <p>Tidak ada data tren penggajian</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analitik</CardTitle>
              <CardDescription>
                Informasi lengkap analitik penggajian dan karyawan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                <p>Konten analitik akan tersedia segera</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Laporan</CardTitle>
              <CardDescription>
                Laporan keuangan dan transaksi penggajian
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                <p>Konten laporan akan tersedia segera</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
