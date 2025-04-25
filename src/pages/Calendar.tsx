
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, DollarSign, UserCheck, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent, CalendarEventType } from "@/types/calendar";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [syncing, setSyncing] = useState(false);
  const [settings, setSettings] = useState({
    payrollNotifications: true,
    attendanceNotifications: true,
    taxNotifications: true
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateEvents, setDateEvents] = useState<CalendarEvent[]>([]);
  const { toast } = useToast();

  // Fetch events from the database
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .select('*');

        if (error) throw error;

        // Convert to CalendarEvent type
        const fetchedEvents: CalendarEvent[] = data.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description || undefined,
          eventType: event.event_type as CalendarEventType,
          startTime: new Date(event.start_time),
          endTime: new Date(event.end_time),
          googleEventId: event.google_event_id || undefined,
          payrollId: event.payroll_id || undefined,
          employeeId: event.employee_id || undefined,
          attendanceId: event.attendance_id || undefined,
          isSynced: event.is_synced || false
        }));

        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data kalender.",
          variant: "destructive",
        });
      }
    };

    fetchEvents();
  }, [toast]);

  // Update events for selected date
  useEffect(() => {
    if (selectedDate && events.length > 0) {
      const eventsOnDate = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return (
          eventDate.getDate() === selectedDate.getDate() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getFullYear() === selectedDate.getFullYear()
        );
      });
      setDateEvents(eventsOnDate);
    } else {
      setDateEvents([]);
    }
  }, [selectedDate, events]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Get events to sync based on settings
      const eventsToSync = events.filter(event => {
        if (!event.isSynced) {
          if (event.eventType === 'payroll' && settings.payrollNotifications) return true;
          if (event.eventType === 'attendance' && settings.attendanceNotifications) return true;
          if (event.eventType === 'tax' && settings.taxNotifications) return true;
        }
        return false;
      });

      if (eventsToSync.length === 0) {
        toast({
          title: "Tidak Ada Event",
          description: "Tidak ada event baru untuk disinkronkan.",
        });
        setSyncing(false);
        return;
      }

      // In a real implementation, you would call Google Calendar API here
      // For now, we'll just update the is_synced flag
      const updatedIds = eventsToSync.map(event => event.id);
      
      const { error } = await supabase
        .from('calendar_events')
        .update({ is_synced: true })
        .in('id', updatedIds);

      if (error) throw error;

      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          updatedIds.includes(event.id) ? { ...event, isSynced: true } : event
        )
      );

      toast({
        title: "Sinkronisasi Berhasil",
        description: `${eventsToSync.length} event telah disinkronkan ke Google Calendar.`,
      });
    } catch (error) {
      console.error('Error syncing calendar:', error);
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

  // Handle date selection
  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    setSelectedDate(newDate || null);
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
          <CardHeader>
            <CardTitle>Kalender Event</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid md:grid-cols-[1fr,250px]">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                className="rounded-md"
                classNames={{
                  day_selected: "bg-primary text-primary-foreground",
                  day_today: "bg-muted text-muted-foreground",
                }}
              />
              <div className="px-4 py-4 border-l">
                <h3 className="text-sm font-medium mb-2">
                  {selectedDate ? selectedDate.toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : "Pilih tanggal"}
                </h3>
                
                <div className="space-y-2 mt-3">
                  {dateEvents.length > 0 ? (
                    dateEvents.map(event => (
                      <div key={event.id} className="p-2 rounded-md border text-sm">
                        <div className="flex items-center gap-2">
                          {event.eventType === 'payroll' && <DollarSign size={14} className="text-green-500" />}
                          {event.eventType === 'attendance' && <UserCheck size={14} className="text-blue-500" />}
                          {event.eventType === 'tax' && <Receipt size={14} className="text-amber-500" />}
                          <span className="font-medium">{event.title}</span>
                        </div>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                        )}
                        <p className="text-xs mt-1">
                          {event.startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - 
                          {event.endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {event.isSynced && (
                          <div className="text-xs text-green-600 mt-1 flex items-center">
                            <CalendarIcon size={10} className="mr-1" />
                            Tersinkron dengan Google Calendar
                          </div>
                        )}
                      </div>
                    ))
                  ) : selectedDate ? (
                    <p className="text-sm text-muted-foreground">Tidak ada event pada tanggal ini</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Pilih tanggal untuk melihat event</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
