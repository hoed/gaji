/* src/pages/Calendar.tsx */
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

// Define interface for payroll events (based on payroll_events table)
interface PayrollEvent {
  id: string;
  title: string;
  event_type: string;
  start_time: string;
  end_time: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Define interface for calendar events (based on calendar_events table)
interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  start_time: string;
  end_time: string;
  description: string | null;
  check_in: string | null;
  check_out: string | null;
  earliest_check_in_attendance_id: string | null;
  latest_check_out_attendance_id: string | null;
  created_at: string;
  updated_at: string;
  is_synced: boolean;
}

export default function Calendar() {
  const [payrollEvents, setPayrollEvents] = useState<PayrollEvent[]>([]);
  const [attendanceEvents, setAttendanceEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch payroll events and attendance events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // Fetch payroll events for April 2025
        const startDate = "2025-04-01";
        const endDate = "2025-04-30";
        const { data: payrollData, error: payrollError } = await supabase
          .from("payroll_events")
          .select("*")
          .gte("start_time", startDate)
          .lte("end_time", endDate);

        if (payrollError) throw payrollError;
        setPayrollEvents(payrollData as PayrollEvent[] || []);

        // Fetch attendance events for April 2025
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("calendar_events")
          .select("*")
          .gte("start_time", startDate)
          .lte("end_time", endDate)
          .eq("event_type", "attendance");

        if (attendanceError) throw attendanceError;
        setAttendanceEvents((attendanceData || []).map(event => ({
          ...event,
          event_type: 'attendance'
        })) as CalendarEvent[]);

      } catch (error) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data event.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kalender</h1>
        <p className="text-muted-foreground">
          Lihat event penggajian dan kehadiran karyawan
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Kalender - April 2025</CardTitle>
          <CardDescription>
            Ringkasan event penggajian dan kehadiran karyawan untuk bulan April 2025.
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
            <div className="space-y-6">
              {/* Payroll Events Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Payroll Events</h3>
                {payrollEvents.length === 0 ? (
                  <p className="text-muted-foreground">Tidak ada event penggajian untuk bulan ini.</p>
                ) : (
                  <ul className="space-y-4">
                    {payrollEvents.map(event => (
                      <li key={event.id} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.start_time).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                              {event.start_time !== event.end_time && (
                                <>
                                  {" - "}
                                  {new Date(event.end_time).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </>
                              )}
                            </p>
                            {event.description && (
                              <p className="text-sm mt-1">{event.description}</p>
                            )}
                          </div>
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            {event.event_type}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Employee Attendance Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Employee Attendance</h3>
                {attendanceEvents.length === 0 ? (
                  <p className="text-muted-foreground">Tidak ada data kehadiran untuk bulan ini.</p>
                ) : (
                  <ul className="space-y-4">
                    {attendanceEvents.map(event => (
                      <li key={event.id} className="border-l-4 border-green-500 pl-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.start_time).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                            {event.check_in && (
                              <p className="text-sm">
                                Check-in Paling Awal: {new Date(event.check_in).toLocaleTimeString("id-ID")}
                              </p>
                            )}
                            {event.check_out && (
                              <p className="text-sm">
                                Check-out Paling Akhir: {new Date(event.check_out).toLocaleTimeString("id-ID")}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-sm mt-1 whitespace-pre-line">{event.description}</p>
                            )}
                          </div>
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            {event.is_synced ? "Tersinkronisasi" : "Belum Tersinkronisasi"}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}