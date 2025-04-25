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
import { FileText, Download, PieChart, BarChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

// Define interface for department summary (not a database table)
interface DepartmentSummary {
  department: string;
  totalSalary: number;
  color: string;
}

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState("april2025");
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Tables<"employees">[]>([]);
  const [departments, setDepartments] = useState<Tables<"departments">[]>([]);
  const [positions, setPositions] = useState<Tables<"positions">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch data for reports
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const startDate = selectedMonth === "april2025" ? "2025-04-01" : 
                         selectedMonth === "maret2025" ? "2025-03-01" : "2025-02-01";
        const endDate = selectedMonth === "april2025" ? "2025-04-30" : 
                       selectedMonth === "maret2025" ? "2025-03-31" : "2025-02-28";

        // Fetch payroll data with join to include bank details
        const { data: payrollData, error: payrollError } = await supabase
          .from('payroll_summary') // Use the updated view that includes bank details
          .select('*')
          .gte('period_start', startDate)
          .lte('period_end', endDate);
        
        if (payrollError) throw payrollError;
        setPayrollData(payrollData || []);

        // Fetch employees
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('*');
        
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

      } catch (error) {
        console.error('Error fetching data for reports:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data laporan.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, toast]);

  // Aggregate data for summary
  const totalGrossSalary = payrollData.reduce((sum, p) => sum + (p.basic_salary || 0), 0);
  const totalPPh21 = payrollData.reduce((sum, p) => sum + (p.pph21 || 0), 0);
  const totalBPJSKesehatan = payrollData.reduce((sum, p) => sum + 
    (p.bpjs_kesehatan_total || 0), 0);
  const totalBPJSKetenagakerjaan = payrollData.reduce((sum, p) => sum + 
    (p.bpjs_ketenagakerjaan_total || 0), 0);
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
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500'];
    return {
      department: dep.name,
      totalSalary,
      color: colors[index % colors.length],
    };
  }).filter(summary => summary.totalSalary > 0);

  // Handle download action
  const handleDownloadReport = (reportType: string) => {
    toast({
      title: "Mengunduh laporan",
      description: `Laporan ${reportType} sedang diunduh`,
    });
  };

  // Add a function to generate a payroll report with bank details
  const generatePayrollReport = () => {
    // In a real implementation, this would generate a PDF or Excel file
    // For now, we'll just show what data would be included
    
    const reportData = payrollData.map(item => ({
      name: item.full_name,
      position: item.position,
      department: item.department,
      salary: item.basic_salary,
      bank_name: item.bank_name,
      bank_account: item.bank_account,
      net_amount: item.net_salary,
      payment_status: item.payment_status
    }));
    
    console.log('Generating payroll report with bank details:', reportData);
    
    toast({
      title: "Generating Report",
      description: "Generating payroll report with bank account details.",
    });
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
          onClick={() => handleDownloadReport('semua')}
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
                  onClick={() => handleDownloadReport('ringkasan penggajian')}
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
                <div className="h-40 w-full flex items-center justify-center border rounded-md">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <PieChart size={40} />
                    <p className="text-sm mt-2">Grafik departemen</p>
                  </div>
                </div>
                {isLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : departmentSummaries.length > 0 ? (
                  <div className="space-y-2">
                    {departmentSummaries.map((summary, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${summary.color}`}></div>
                          <span className="text-sm">{summary.department}</span>
                        </div>
                        <span className="text-sm font-medium">Rp {summary.totalSalary.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
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
                  onClick={() => handleDownloadReport('rincian departemen')}
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
              <div className="h-60 w-full flex items-center justify-center border rounded-md">
                <div className="flex flex-col items-center text-muted-foreground">
                  <BarChart size={40} />
                  <p className="text-sm mt-2">Grafik tren penggajian</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => handleDownloadReport('tren penggajian')}
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
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Karyawan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Rekening</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gaji Bersih</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payrollData.slice(0, 5).map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.full_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.bank_name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.bank_account || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {item.net_salary?.toLocaleString('id-ID')}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                item.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.payment_status === 'paid' ? 'Dibayar' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                <Button
                  variant="outline"
                  onClick={generatePayrollReport}
                  disabled={isLoading || payrollData.length === 0}
                >
                  Lihat Laporan Lengkap
                </Button>
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => handleDownloadReport('penggajian detail')}
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
                <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-md">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <FileText size={40} />
                    <p className="mt-2">Laporan PPh 21</p>
                    <p className="text-sm">Berisi rincian pajak penghasilan karyawan</p>
                    <Button 
                      className="mt-4" 
                      variant="outline"
                      onClick={() => handleDownloadReport('PPh 21')}
                    >
                      Download Laporan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="bpjs" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Laporan BPJS Kesehatan</CardTitle>
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
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-muted-foreground">Total Iuran Karyawan</span>
                      <span className="font-medium">Rp {payrollData.reduce((sum, p) => sum + (p.bpjs_kes_employee || 0), 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-muted-foreground">Total Iuran Perusahaan</span>
                      <span className="font-medium">Rp {payrollData.reduce((sum, p) => sum + (p.bpjs_kes_company || 0), 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-medium">Total Iuran</span>
                      <span className="font-bold">Rp {totalBPJSKesehatan.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-md">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <FileText size={40} />
                      <p className="mt-2">Tidak ada data BPJS Kesehatan</p>
                      <p className="text-sm">Data iuran BPJS Kesehatan belum tersedia</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => handleDownloadReport('BPJS Kesehatan')}
                >
                  <Download size={16} />
                  <span>Download Laporan</span>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Laporan BPJS Ketenagakerjaan</CardTitle>
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
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-muted-foreground">Total JHT (Karyawan)</span>
                      <span className="font-medium">Rp {payrollData.reduce((sum, p) => sum + (p.bpjs_tk_jht_employee || 0), 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-muted-foreground">Total JHT (Perusahaan)</span>
                      <span className="font-medium">Rp {payrollData.reduce((sum, p) => sum + (p.bpjs_tk_jht_company || 0), 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-muted-foreground">Total JP (Karyawan)</span>
                      <span className="font-medium">Rp {payrollData.reduce((sum, p) => sum + (p.bpjs_tk_jp_employee || 0), 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-muted-foreground">Total JP (Perusahaan)</span>
                      <span className="font-medium">Rp {payrollData.reduce((sum, p) => sum + (p.bpjs_tk_jp_company || 0), 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-muted-foreground">Total JKK & JKM</span>
                      <span className="font-medium">Rp {(payrollData.reduce((sum, p) => sum + (p.bpjs_tk_jkk || 0) + (p.bpjs_tk_jkm || 0), 0)).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-medium">Total Iuran</span>
                      <span className="font-bold">Rp {totalBPJSKetenagakerjaan.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-md">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <FileText size={40} />
                      <p className="mt-2">Tidak ada data BPJS Ketenagakerjaan</p>
                      <p className="text-sm">Data iuran BPJS Ketenagakerjaan belum tersedia</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => handleDownloadReport('BPJS Ketenagakerjaan')}
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
