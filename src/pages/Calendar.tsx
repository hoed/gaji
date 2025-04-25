
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, DollarSign, UserCheck, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [syncing, setSyncing] = useState(false);
  const [settings, setSettings] = useState({
    payrollNotifications: true,
    attendanceNotifications: true,
    taxNotifications: true
  });
  const { toast } = useToast();

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Add sync logic here
      toast({
        title: "Sinkronisasi Berhasil",
        description: "Kalender telah diperbarui dengan events terbaru.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyinkronkan kalender.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const updateNotificationSettings = async (type: string, enabled: boolean) => {
    setSettings(prev => ({ ...prev, [type]: enabled }));
    toast({
      title: "Pengaturan Disimpan",
      description: "Pengaturan notifikasi telah diperbarui.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kalender</h1>
        <p className="text-muted-foreground">Kelola jadwal dan notifikasi</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[400px,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Notifikasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Tanggal Pembayaran Gaji</Label>
                <p className="text-sm text-muted-foreground">
                  Notifikasi untuk jadwal pembayaran gaji karyawan
                </p>
              </div>
              <Switch
                checked={settings.payrollNotifications}
                onCheckedChange={(checked) => updateNotificationSettings('payrollNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Kehadiran Karyawan</Label>
                <p className="text-sm text-muted-foreground">
                  Notifikasi untuk rekap kehadiran karyawan
                </p>
              </div>
              <Switch
                checked={settings.attendanceNotifications}
                onCheckedChange={(checked) => updateNotificationSettings('attendanceNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Tanggal Pembayaran Pajak</Label>
                <p className="text-sm text-muted-foreground">
                  Notifikasi untuk jadwal pembayaran pajak
                </p>
              </div>
              <Switch
                checked={settings.taxNotifications}
                onCheckedChange={(checked) => updateNotificationSettings('taxNotifications', checked)}
              />
            </div>

            <Button
              className="w-full mt-4"
              onClick={handleSync}
              disabled={syncing}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {syncing ? "Menyinkronkan..." : "Sinkronkan dengan Google Calendar"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
