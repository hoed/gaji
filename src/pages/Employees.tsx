
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data for employees
const mockEmployees = [
  {
    id: "1",
    name: "Budi Santoso",
    position: "Senior Developer",
    department: "Teknologi Informasi",
    employeeId: "EMP001",
    joinDate: "12 Jan 2023",
    salary: "Rp 12.000.000",
    status: "Aktif",
  },
  {
    id: "2",
    name: "Siti Nurhaliza",
    position: "HR Manager",
    department: "Human Resources",
    employeeId: "EMP002",
    joinDate: "05 Mar 2022",
    salary: "Rp 15.000.000",
    status: "Aktif",
  },
  {
    id: "3",
    name: "Ahmad Dhani",
    position: "Finance Officer",
    department: "Keuangan",
    employeeId: "EMP003",
    joinDate: "17 Jun 2023",
    salary: "Rp 8.000.000",
    status: "Aktif",
  },
  {
    id: "4",
    name: "Dewi Kartika",
    position: "Marketing Specialist",
    department: "Pemasaran",
    employeeId: "EMP004",
    joinDate: "23 Sep 2022",
    salary: "Rp 9.500.000",
    status: "Aktif",
  },
  {
    id: "5",
    name: "Joko Widodo",
    position: "Operations Manager",
    department: "Operasional",
    employeeId: "EMP005",
    joinDate: "08 Nov 2021",
    salary: "Rp 18.000.000",
    status: "Aktif",
  },
];

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredEmployees = mockEmployees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Karyawan</h1>
        <p className="text-muted-foreground">Kelola data karyawan perusahaan</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari karyawan..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              <span>Tambah Karyawan</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Tambah Karyawan Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi karyawan baru di bawah ini
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Nama Lengkap
                  </label>
                  <Input id="name" placeholder="Nama lengkap karyawan" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="employeeId" className="text-sm font-medium">
                    ID Karyawan
                  </label>
                  <Input id="employeeId" placeholder="EMP001" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="position" className="text-sm font-medium">
                    Jabatan
                  </label>
                  <Input id="position" placeholder="Jabatan karyawan" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="department" className="text-sm font-medium">
                    Departemen
                  </label>
                  <Input id="department" placeholder="Departemen karyawan" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="salary" className="text-sm font-medium">
                    Gaji Pokok
                  </label>
                  <Input id="salary" placeholder="10000000" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="joinDate" className="text-sm font-medium">
                    Tanggal Bergabung
                  </label>
                  <Input id="joinDate" type="date" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-md">Daftar Karyawan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Departemen</TableHead>
                <TableHead>Tgl Bergabung</TableHead>
                <TableHead>Gaji Pokok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.employeeId}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.joinDate}</TableCell>
                  <TableCell>{employee.salary}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      {employee.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Lihat Detail</DropdownMenuItem>
                        <DropdownMenuItem>Edit Data</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Nonaktifkan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
