
import { useState } from "react";
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

// Mock data for payroll
const payrollData = [
  {
    id: "1",
    period: "April 2025",
    status: "Belum Diproses",
    totalEmployees: 42,
    totalSalary: "Rp 240.500.000",
    totalPPh21: "Rp 12.845.000",
    totalBPJS: "Rp 14.875.000",
    netSalary: "Rp 212.780.000",
  },
  {
    id: "2",
    period: "Maret 2025",
    status: "Selesai",
    totalEmployees: 42,
    totalSalary: "Rp 240.500.000",
    totalPPh21: "Rp 12.845.000",
    totalBPJS: "Rp 14.875.000",
    netSalary: "Rp 212.780.000",
  },
  {
    id: "3",
    period: "Februari 2025",
    status: "Selesai",
    totalEmployees: 40,
    totalSalary: "Rp 235.000.000",
    totalPPh21: "Rp 12.500.000",
    totalBPJS: "Rp 14.500.000",
    netSalary: "Rp 208.000.000",
  },
];

export default function Payroll() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
            <p className="text-xs text-muted-foreground">Belum diproses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Penggajian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp 240,5jt</div>
            <p className="text-xs text-muted-foreground">42 karyawan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total PPh 21</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp 12,8jt</div>
            <p className="text-xs text-muted-foreground">5,34% dari total gaji</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total BPJS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp 14,8jt</div>
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
              {payrollData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.period}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.status === "Selesai"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell>{row.totalEmployees}</TableCell>
                  <TableCell>{row.totalSalary}</TableCell>
                  <TableCell>{row.totalPPh21}</TableCell>
                  <TableCell>{row.totalBPJS}</TableCell>
                  <TableCell className="font-medium">{row.netSalary}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
