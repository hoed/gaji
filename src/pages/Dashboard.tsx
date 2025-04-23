
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, Calculator } from "lucide-react";

export default function Dashboard() {
  const summaryCards = [
    {
      title: "Total Karyawan",
      value: "42",
      description: "Aktif bulan ini",
      icon: Users,
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Total Penggajian",
      value: "Rp 240,5jt",
      description: "Bulan April 2025",
      icon: Calculator,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Kehadiran",
      value: "95%",
      description: "Tingkat kehadiran",
      icon: Calendar,
      color: "bg-amber-100 text-amber-700",
    },
    {
      title: "Pajak PPh 21",
      value: "Rp 12,8jt",
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
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-2"></span>
                    <span className="text-sm text-muted-foreground">Mendatang</span>
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
    </div>
  );
}
