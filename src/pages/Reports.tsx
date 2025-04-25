/* src/pages/Reports.tsx */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, PieChart, BarChart, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { exportToExcel, exportToCSV, exportToPDF } from "@/utils/exportUtils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Pie, 
  Cell 
} from "recharts";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Define interface for department summary (not a database table)
interface DepartmentSummary {
  department: string;
  totalSalary: number;
  employeeCount: number;
  color: string;
}

// Define interface for enriched payroll data (not a database table)
interface EnrichedPayroll extends Tables<"payroll"> {
  full_name: string;
  position: string;
  department: string;
  bank_name: string;
  bank_account: string;
  bpjs_kesehatan_total: number;
  bpjs_ketenagakerjaan_total: number;
}

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState("april2025");
  const [payrollData, setPayrollData] = useState<EnrichedPayroll[]>([]);
  const [employees, setEmployees] = useState<Tables<"employees">[]>([]);
  const [departments, setDepartments] = useState<Tables<"departments">[]>([]);
  const [positions, setPositions] = useState<Tables<"positions">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trendData, setTrendData] = useState<{ month: string; value: number }[]>([]);

  // Fetch data for reports
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const startDate = selectedMonth === "april2025" ? "2025-04-01" : 
                         selectedMonth === "maret2025" ? "2025-03-01" : "2025-02-01";
        const endDate = selectedMonth === "april2025" ? "2025-04-30" : 
                       selectedMonth === "maret2025" ? "2025-03-31" : "2025-02-28";

        // Fetch employees
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('*, positions (id, title, department_id, departments (id, name))');
        
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

        // Fetch payroll data
        const { data: payrollRawData, error: payrollError } = await supabase
          .from('payroll')
          .select('*')
          .gte('period_start', startDate)
          .lte('period_end', endDate);
        
        if (payrollError) throw payrollError;

        // Enrich payroll data with employee details (name, position, department, bank details)
        const enrichedPayrollData: EnrichedPayroll[] = payrollRawData.map(payroll => {
          const employee = employeesData.find(emp => emp.id === payroll.employee_id);
          const position = positionsData.find(pos => pos.id === employee?.position_id);
          const department = departmentsData.find(dep => dep.id === position?.department_id);
          
          const bpjs_kesehatan_total = 
            (payroll.bpjs_kes_employee || 0) + (payroll.bpjs_kes_company || 0);
          const bpjs_ketenagakerjaan_total = 
            (payroll.bpjs_tk_jht_employee || 0) + 
            (payroll.bpjs_tk_jp_employee || 0) + 
            (payroll.bpjs_tk_jht_company || 0) + 
            (payroll.bpjs_tk_jp_company || 0) + 
            (payroll.bpjs_tk_jkk || 0) + 
            (payroll.bpjs_tk_jkm || 0);

          return {
            ...payroll,
            full_name: employee ? `${employee.first_name} ${employee.last_name || ''}`.trim() : 'Unknown',
            position: position?.title || 'N/A',
            department: department?.name || 'N/A',
            bank_name: employee?.bank_name || 'N/A',
            bank_account: employee?.bank_account || 'N/A',
            bpjs_kesehatan_total,
            bpjs_ketenagakerjaan_total
          };
        });
        setPayrollData(enrichedPayrollData);

        // Fetch trend data (last 6 months of payroll)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: trendDataResult, error: trendError } = await supabase
          .from('payroll')
          .select('period_start, net_salary')
          .gte('period_start', sixMonthsAgo.toISOString().split('T')[0])
          .order('period_start', { ascending: true });
        
        if (trendError) throw trendError;

        // Aggregate trend data by month
        const trendsByMonth: Record<string, number> = {};
        
        trendDataResult?.forEach(item => {
          const month = item.period_start.substring(0, 7); // YYYY-MM format
          trendsByMonth[month] = (trendsByMonth[month] || 0) + (item.net_salary || 0);
        });

        const trendArray = Object.entries(trendsByMonth).map(([date, value]) => ({
          month: date,
          value
        }));

        setTrendData(trendArray);

      } catch (error) {
        console.error('Error fetching data for reports:', error);
        toast.error("Gagal memuat data laporan.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth]);

  // Aggregate data for summary
  const totalGrossSalary = payrollData.reduce((sum, p) => sum + (p.basic_salary || 0), 0);
  const totalPPh21 = payrollData.reduce((sum, p) => sum + (p.pph21 || 0), 0);
  const totalBPJSKesehatan = payrollData.reduce((sum, p) => sum + (p.bpjs_kesehatan_total || 0), 0);
  const totalBPJSKetenagakerjaan = payrollData.reduce((sum, p) => sum + (p.bpjs_ketenagakerjaan_total || 0), 0);
  const totalNetSalary = payrollData.reduce((sum, p) => sum + (p.net_salary || 0), 0);

  // Aggregate data by department
  const departmentSummaries: DepartmentSummary[] = departments.map((dep, index) => {
    const departmentPositions = positions.filter(pos => pos.department_id === dep.id);
    const departmentEmployees = employees.filter(emp => 
      departmentPositions.some(pos => pos.id === emp.position_id)
    );
    const departmentPayroll = payrollData.filter(p => 
      departmentEmployees.some(emp => emp.id === p.employee_id)
    );
    const totalSalary = departmentPayroll.reduce((sum, p) => sum + (p.basic_salary || 0), 0);
    const colors = ['#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EC4899', '#6366F1'];
    return {
      department: dep.name,
      totalSalary,
      employeeCount: departmentEmployees.length,
      color: colors[index % colors.length],
    };
  }).filter(summary => summary.totalSalary > 0);

  // Chart config for departments pie chart
  const departmentChartData = departmentSummaries.map(dep => ({
    name: dep.department,
    value: dep.totalSalary,
    fill: dep.color
  }));

  const departmentChartConfig = departmentSummaries.reduce((config, dep) => {
    config[dep.department] = {
      label: dep.department,
      color: dep.color
    };
    return config;
  }, {} as Record<string, {label: string, color: string}>);

  // Chart config for payroll trends
  const payrollTrendData = trendData.map(item => {
    const [year, month] = item.month.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNum = parseInt(month, 10) - 1; // Convert to zero-based index
    
    return {
      month: `${monthNames[monthNum]} ${year}`,
      value: item.value
    };
  });

  const payrollTrendConfig = {
    payroll: {
      label: "Penggajian",
      theme: {
        light: "#8B5CF6",
        dark: "#A78BFA",
      },
    },
  };

  // Prepare tax and BPJS data for export
  const prepareTaxData = () => {
    return payrollData.map(item => ({
      nama_karyawan: item.full_name,
      posisi: item.position,
      departemen: item.department,
      gaji_pokok: item.basic_salary,
      pajak_pph21: item.pph21,
      tanggal_periode: `${new Date(item.period_start).toLocaleDateString('id-ID')} - ${new Date(item.period_end).toLocaleDateString('id-ID')}`,
    }));
  };

  const prepareBPJSData = () => {
    return payrollData.map(item => ({
      nama_karyawan: item.full_name,
      posisi: item.position,
      departemen: item.department,
      bpjs_kesehatan: item.bpjs_kesehatan_total,
      bpjs_ketenagakerjaan: item.bpjs_ketenagakerjaan_total,
      tanggal_periode: `${new Date(item.period_start).toLocaleDateString('id-ID')} - ${new Date(item.period_end).toLocaleDateString('id-ID')}`,
    }));
  };

  const preparePayrollData = () => {
    return payrollData.map(item => ({
      nama_karyawan: item.full_name,
      posisi: item.position,
      departemen: item.department,
      gaji_pokok: item.basic_salary,
      bank: item.bank_name,
      rekening: item.bank_account,
      gaji_bersih: item.net_salary,
      status_pembayaran: item.payment_status,
    }));
  };

  // Handle download action for various formats
  const handleDownload = (dataType: 'payroll' | 'tax' | 'bpjs', format: 'excel' | 'csv' | 'pdf') => {
    let data: any[] = [];
    let headers: string[] = [];
    let filename = '';
    let title = '';
    
    if (dataType === 'payroll') {
      data = preparePayrollData();
      headers = ['nama_karyawan', 'posisi', 'departemen', 'gaji_pokok', 'bank', 'rekening', 'gaji_bersih', 'status_pembayaran'];
      filename = `Laporan_Penggajian_${selectedMonth}`;
      title = 'Laporan Penggajian';
    } else if (dataType === 'tax') {
      data = prepareTaxData();
      headers = ['nama_karyawan', 'posisi', 'departemen', 'gaji_pokok', 'pajak_pph21', 'tanggal_periode'];
      filename = `Laporan_Pajak_${selectedMonth}`;
      title = 'Laporan Pajak PPh 21';
    } else if (dataType === 'bpjs') {
      data = prepareBPJSData();
      headers = ['nama_karyawan', 'posisi', 'departemen', 'bpjs_kesehatan', 'bpjs_ketenagakerjaan', 'tanggal_periode'];
      filename = `Laporan_BPJS_${selectedMonth}`;
      title = 'Laporan BPJS';
    }
    
    if (format === 'excel') {
      exportToExcel(data, { filename, sheetName: title });
    } else if (format === 'csv') {
      exportToCSV(data, { filename });
    } else if (format === 'pdf') {
      exportToPDF(data, headers, { filename, title, orientation: 'landscape' });
    }
  };

  // Generate a comprehensive report for all data
  const handleDownloadAllReport = () => {
    // Create workbook with multiple sheets
    try {
      const wb = XLSX.utils.book_new();
      
      // Payroll data
      const payrollDataExport = preparePayrollData();
      const payrollWs = XLSX.utils.json_to_sheet(payrollDataExport);
      XLSX.utils.book_append_sheet(wb, payrollWs, "Penggajian");
      
      // Tax data
      const taxData = prepareTaxData();
      const taxWs = XLSX.utils.json_to_sheet(taxData);
      XLSX.utils.book_append_sheet(wb, taxWs, "Pajak");
      
      // BPJS data
      const bpjsData = prepareBPJSData();
      const bpjsWs = XLSX.utils.json_to_sheet(bpjsData);
      XLSX.utils.book_append_sheet(wb, bpjsWs, "BPJS");
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      saveAs(blob, `Semua_Laporan_${selectedMonth}.xlsx`);
      toast.success('Semua laporan berhasil diunduh');
    } catch (error) {
      console.error('Error exporting all reports:', error);
      toast.error('Gagal mengunduh semua laporan');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Laporan</h1>
        <p className="text-muted-foreground">
          Laporan penggajian, pajak, dan BPJS
        </p>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="w-full max-w-xs">
          <Select
            value={selectedMonth}
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="april2025">April 2025</SelectItem>
              <SelectItem value="maret2025">Maret 2025</SelectItem>
              <SelectItem value="februari2025">Februari 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={handleDownloadAllReport}
          disabled={isLoading || payrollData.length === 0}
        >
          <Download size={16} />
          <span>Download Semua Laporan</span>
        </Button>
      </div>
      
      <Tabs defaultValue="summary">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="summary">Ringkasan</TabsTrigger>
          <TabsTrigger value="payroll">Penggajian</TabsTrigger>
          <TabsTrigger value="tax">Pajak</TabsTrigger>
          <TabsTrigger value="bpjs">BPJS</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Ringkasan Penggajian
                </CardTitle>
                <CardDescription>
                  {selectedMonth === "april2025" ? "April 2025" : selectedMonth === "maret2025" ? "Maret 2025" : "Februari 2025"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-muted-foreground">Total Gaji Kotor</span>
                      <span className="font-medium">Rp {totalGrossSalary.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-muted-foreground">Total PPh 21</span>
                      <span className="font-medium">Rp {totalPPh21.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-muted-foreground">Total BPJS Kesehatan</span>
                      <span className="font-medium">Rp {totalBPJSKesehatan.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-muted-foreground">Total BPJS Ketenagakerjaan</span>
                      <span className="font-medium">Rp {totalBPJSKetenagakerjaan.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-medium">Total Gaji Bersih</span>
                      <span className="font-bold">Rp {totalNetSalary.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={() => handleDownload('payroll', 'excel')}
                  disabled={isLoading || payrollData.length === 0}
                >
                  <Download size={14} />
                  <span>Unduh</span>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rincian Departemen</CardTitle>
                <CardDescription>Distribusi biaya gaji per departemen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : departmentSummaries.length > 0 ? (
                  <>
                    <div className="h-40 w-full">
                      <ChartContainer
                        config={departmentChartConfig}
                        className="h-full"
                      >
                        <Pie
                          data={departmentChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          stroke="#fff"
                          strokeWidth={2}
                        >
                          {departmentChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                          <ChartTooltip content={<ChartTooltipContent formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />} />
                          <ChartLegend content={<ChartLegendContent />} />
                        </Pie>
                      </ChartContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                      {departmentSummaries.map((summary, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: summary.color }}></div>
                            <span className="text-sm">{summary.department} ({summary.employeeCount} karyawan)</span>
                          </div>
                          <span className="text-sm font-medium">Rp {summary.totalSalary.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>Tidak ada data untuk ditampilkan</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={() => handleDownload('payroll', 'excel')}
                  disabled={isLoading || departmentSummaries.length === 0}
                >
                  <Download size={14} />
                  <span>Unduh</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Tren Penggajian</CardTitle>
              <CardDescription>6 bulan terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : payrollTrendData.length > 0 ? (
                <div className="h-60">
                  <ChartContainer config={payrollTrendConfig} className="h-full">
                    <LineChart data={payrollTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis
                        tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                          />
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="payroll"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={{
                          stroke: '#8B5CF6',
                          strokeWidth: 2,
                          r: 4,
                          fill: 'white',
                        }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center border rounded-md">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <BarChart size={40} />
                    <p className="text-sm mt-2">Tidak ada data tren penggajian</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => handleDownload('payroll', 'excel')}
                disabled={isLoading || payrollTrendData.length === 0}
              >
                <Download size={14} />
                <span>Unduh</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="payroll" className="mt-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Laporan Penggajian Detail</CardTitle>
                <CardDescription>
                  {selectedMonth === "april2025" ? "April 2025" : selectedMonth === "maret2025" ? "Maret 2025" : "Februari 2025"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : payrollData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Karyawan</TableHead>
                          <TableHead>Bank</TableHead>
                          <TableHead>No. Rekening</TableHead>
                          <TableHead>Gaji Bersih</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payrollData.slice(0, 5).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.full_name}</TableCell>
                            <TableCell>{item.bank_name}</TableCell>
                            <TableCell>{item.bank_account}</TableCell>
                            <TableCell>Rp {(item.net_salary || 0).toLocaleString('id-ID')}</TableCell>
                            <TableCell>
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.payment_status === 'paid' ? 'Dibayar' : 'Pending'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {payrollData.length > 5 && (
                      <div className="text-center py-3 text-sm text-gray-500">
                        Menampilkan 5 dari {payrollData.length} data
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-md">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <FileText size={40} />
                      <p className="mt-2">Tidak ada data penggajian</p>
                      <p className="text-sm">Belum ada data penggajian untuk periode ini</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleDownload('payroll', 'excel')}
                    disabled={isLoading || payrollData.length === 0}
                  >
                    <FileSpreadsheet size={14} />
                    <span>Excel</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleDownload('payroll', 'csv')}
                    disabled={isLoading || payrollData.length === 0}
                  >
                    <FileText size={14} />
                    <span>CSV</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleDownload('payroll', 'pdf')}
                    disabled={isLoading || payrollData.length === 0}
                  >
                    <FileText size={14} />
                    <span>PDF</span>
                  </Button>
                </div>
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => handleDownload('payroll', 'excel')}
                  disabled={isLoading || payrollData.length === 0}
                >
                  <Download size={16} />
                  <span>Download Laporan</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tax" className="mt-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Laporan PPh 21</CardTitle>
                <CardDescription>
                  {selectedMonth === "april2025" ? "April 2025" : selectedMonth === "maret2025" ? "Maret 2025" : "Februari 2025"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : payrollData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Karyawan</TableHead>
                          <TableHead>Posisi</TableHead>
                          <TableHead>Departemen</TableHead>
                          <TableHead>Gaji Pokok</TableHead>
                          <TableHead>PPh 21</TableHead>
                          <TableHead>Periode</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payrollData.slice(0, 5).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.full_name}</TableCell>
                            <TableCell>{item.position}</TableCell>
                            <TableCell>{item.department}</TableCell>
                            <TableCell>Rp {(item.basic_salary || 0).toLocaleString('id-ID')}</TableCell>
                            <TableCell>Rp {(item.pph21 || 0).toLocaleString('id-ID')}</TableCell>
                            <TableCell>
                              {new Date(item.period_start).toLocaleDateString('id-ID')} - {new Date(item.period_end).toLocaleDateString('id-ID')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {payrollData.length > 5 && (
                      <div className="text-center py-3 text-sm text-gray-500">
                        Menampilkan 5 dari {payrollData.length} data
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-md">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <FileText size={40} />
                      <p className="mt-2">Tidak ada data pajak</p>
                      <p className="text-sm">Belum ada data pajak untuk periode ini</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleDownload('tax', 'excel')}
                    disabled={isLoading || payrollData.length === 0}
                  >
                    <FileSpreadsheet size={14} />
                    <span>Excel</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleDownload('tax', 'csv')}
                    disabled={isLoading || payrollData.length === 0}
                  >
                    <FileText size={14} />
                    <span>CSV</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleDownload('tax', 'pdf')}
                    disabled={isLoading || payrollData.length === 0}
                  >
                    <FileText size={14} />
                    <span>PDF</span>
                  </Button>
                </div>
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => handleDownload('tax', 'excel')}
                  disabled={isLoading || payrollData.length === 0}
                >
                  <Download size={16} />
                  <span>Download Laporan</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="bpjs" className="mt-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Laporan BPJS</CardTitle>
                <CardDescription>
                  {selectedMonth === "april2025" ? "April 2025" : selectedMonth === "maret2025" ? "Maret 2025" : "Februari 2025"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : payrollData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Karyawan</TableHead>
                          <TableHead>Posisi</TableHead>
                          <TableHead>Departemen</TableHead>
                          <TableHead>BPJS Kesehatan</TableHead>
                          <TableHead>BPJS Ketenagakerjaan</TableHead>
                          <TableHead>Periode</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payrollData.slice(0, 5).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.full_name}</TableCell>
                            <TableCell>{item.position}</TableCell>
                            <TableCell>{item.department}</TableCell>
                            <TableCell>Rp {(item.bpjs_kesehatan_total || 0).toLocaleString('id-ID')}</TableCell>
                            <TableCell>Rp {(item.bpjs_ketenagakerjaan_total || 0).toLocaleString('id-ID')}</TableCell>
                            <TableCell>
                              {new Date(item.period_start).toLocaleDateString('id-ID')} - {new Date(item.period_end).toLocaleDateString('id-ID')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {payrollData.length > 5 && (
                      <div className="text-center py-3 text-sm text-gray-500">
                        Menampilkan 5 dari {payrollData.length} data
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-md">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <FileText size={40} />
                      <p className="mt-2">Tidak ada data BPJS</p>
                      <p className="text-sm">Belum ada data BPJS untuk periode ini</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleDownload('bpjs', 'excel')}
                    disabled={isLoading || payrollData.length === 0}
                  >
                    <FileSpreadsheet size={14} />
                    <span>Excel</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleDownload('bpjs', 'csv')}
                    disabled={isLoading || payrollData.length === 0}
                  >
                    <FileText size={14} />
                    <span>CSV</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleDownload('bpjs', 'pdf')}
                    disabled={isLoading || payrollData.length === 0}
                  >
                    <FileText size={14} />
                    <span>PDF</span>
                  </Button>
                </div>
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => handleDownload('bpjs', 'excel')}
                  disabled={isLoading || payrollData.length === 0}
                >
                  <Download size={16} />
                  <span>Download Laporan</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}