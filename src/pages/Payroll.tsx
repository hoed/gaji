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
import { Calculator, Download, Calendar, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

// Define interface for enriched payroll (not a database table)
interface EnrichedPayroll extends Tables<"payroll"> {
  full_name: string;
}

export default function Payroll() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [payrollData, setPayrollData] = useState<EnrichedPayroll[]>([]);
  const [employees, setEmployees] = useState<{ id: string; first_name: string; last_name: string; }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch payroll and employees data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch payroll data
        const { data: payrollData, error: payrollError } = await supabase
          .from('payroll')
          .select('*')
          .order('period_start', { ascending: false });
        
        if (payrollError) throw payrollError;

        // Fetch employees
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, first_name, last_name');
        
        if (employeesError) throw employeesError;
        setEmployees(employeesData || []);

        // Enrich payroll data with employee names
        const enrichedData: EnrichedPayroll[] = payrollData.map(payroll => {
          const employee = employeesData.find(emp => emp.id === payroll.employee_id);
          return {
            ...payroll,
            full_name: employee ? `${employee.first_name} ${employee.last_name || ''}`.trim() : 'Unknown',
          };
        });
        setPayrollData(enrichedData);
      } catch (error) {
        console.error('Error fetching payroll data:', error);
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
  const aprilPayroll = payrollData.filter(p => p.period_start.startsWith('2025-04'));
  const totalEmployees = new Set(aprilPayroll.map(p => p.employee_id)).size;
  const totalSalary = aprilPayroll.reduce((sum, p) => sum + (p.basic_salary || 0), 0);
  const totalPPh21 = aprilPayroll.reduce((sum, p) => sum + (p.pph21 || 0), 0);
  const totalBPJS = aprilPayroll.reduce((sum, p) => sum + 
    (p.bpjs_kes_employee || 0) + 
    (p.bpjs_tk_jht_employee || 0) + 
    (p.bpjs_tk_jp_employee || 0) + 
    (p.bpjs_kes_company || 0) + 
    (p.bpjs_tk_jht_company || 0) + 
    (p.bpjs_tk_jp_company || 0) + 
    (p.bpjs_tk_jkk || 0) + 
    (p.bpjs_tk_jkm || 0), 0);

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
              {aprilPayroll.length > 0 ? aprilPayroll[0].payment_status === 'paid' ? 'Selesai' : 'Belum Diproses' : 'Belum Diproses'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Penggajian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalSalary.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">{totalEmployees} karyawan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total PPh 21</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalPPh21.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">{totalSalary > 0 ? `${((totalPPh21 / totalSalary) * 100).toFixed(2)}% dari total gaji` : '0%'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total BPJS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalBPJS.toLocaleString('id-ID')}</div>
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
                  <Select defaultValue="april2025">
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
                  <Input type="date" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Catatan</label>
                  <Input placeholder="Catatan untuk penggajian periode ini" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button onClick={() => setIsDialogOpen(false)}>Proses Penggajian</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="flex items-center gap-2">
            <Calendar size={16} />
            <span>Sinkronisasi Kalender</span>
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
                  const periodEmployees = new Set(payrollData
                    .filter(p => p.period_start === row.period_start && p.period_end === row.period_end)
                    .map(p => p.employee_id)).size;
                  const periodSalary = payrollData
                    .filter(p => p.period_start === row.period_start && p.period_end === row.period_end)
                    .reduce((sum, p) => sum + (p.basic_salary || 0), 0);
                  const periodPPh21 = payrollData
                    .filter(p => p.period_start === row.period_start && p.period_end === row.period_end)
                    .reduce((sum, p) => sum + (p.pph21 || 0), 0);
                  const periodBPJS = payrollData
                    .filter(p => p.period_start === row.period_start && p.period_end === row.period_end)
                    .reduce((sum, p) => sum + 
                      (p.bpjs_kes_employee || 0) + 
                      (p.bpjs_tk_jht_employee || 0) + 
                      (p.bpjs_tk_jp_employee || 0) + 
                      (p.bpjs_kes_company || 0) + 
                      (p.bpjs_tk_jht_company || 0) + 
                      (p.bpjs_tk_jp_company || 0) + 
                      (p.bpjs_tk_jkk || 0) + 
                      (p.bpjs_tk_jkm || 0), 0);
                  const periodNetSalary = payrollData
                    .filter(p => p.period_start === row.period_start && p.period_end === row.period_end)
                    .reduce((sum, p) => sum + (p.net_salary || 0), 0);

                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {format(new Date(row.period_start), "MMMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            row.payment_status === 'paid'
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {row.payment_status === 'paid' ? 'Selesai' : 'Belum Diproses'}
                        </span>
                      </TableCell>
                      <TableCell>{periodEmployees}</TableCell>
                      <TableCell>Rp {periodSalary.toLocaleString('id-ID')}</TableCell>
                      <TableCell>Rp {periodPPh21.toLocaleString('id-ID')}</TableCell>
                      <TableCell>Rp {periodBPJS.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="font-medium">Rp {periodNetSalary.toLocaleString('id-ID')}</TableCell>
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